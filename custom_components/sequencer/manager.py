"""Storage and execution engine for sequences."""

from __future__ import annotations

import asyncio
import contextlib
from collections.abc import Callable
from copy import deepcopy
import logging
import time
from typing import Any
import uuid

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store

from .const import (
    ACTION_SERVICE,
    ACTION_TOGGLE,
    ACTION_TURN_OFF,
    ACTION_TURN_ON,
    DIRECTION_START,
    EVENT_SEQUENCER,
    SERVICE_TIMEOUT,
    SIGNAL_SEQUENCE_ADDED,
    SIGNAL_SEQUENCE_REMOVED,
    STATE_OFF,
    STATE_ON,
    STATE_STARTING,
    STATE_STOPPING,
    STOP_MODE_CUSTOM,
    STORAGE_KEY,
    STORAGE_VERSION,
)

_LOGGER = logging.getLogger(__name__)

_INVERSE = {
    ACTION_TURN_ON: ACTION_TURN_OFF,
    ACTION_TURN_OFF: ACTION_TURN_ON,
    ACTION_TOGGLE: ACTION_TOGGLE,
}


def _new_id() -> str:
    return uuid.uuid4().hex[:10]


def _initial_status() -> dict[str, Any]:
    return {
        "state": STATE_OFF,
        "direction": None,
        "step": 0,
        "total": 0,
        "step_name": None,
        "wait_until": None,
        "errors": [],
        "last_run": None,
    }


def build_stop_steps(sequence: dict[str, Any]) -> list[dict[str, Any]]:
    """Return the steps used when stopping a sequence.

    In "reverse" mode the start steps are run backwards with the inverse
    action. The delay that was used *before* a step when starting is used
    *after* it when stopping, so the gaps between sections stay the same.
    Steps that call an arbitrary service can't be inverted and are skipped.
    """
    if sequence.get("stop_mode") == STOP_MODE_CUSTOM:
        return sequence.get("stop_steps", [])

    rev = list(reversed(sequence.get("start_steps", [])))
    out: list[dict[str, Any]] = []
    for idx, step in enumerate(rev):
        delay = float(rev[idx + 1].get("delay", 0)) if idx + 1 < len(rev) else 0.0
        inverse = _INVERSE.get(step.get("action", ACTION_TURN_ON))
        if inverse is None:
            # Not invertible: keep the timing by moving the delay to the previous step.
            if out:
                out[-1]["delay"] = float(out[-1]["delay"]) + delay
            continue
        out.append(
            {
                **step,
                "action": inverse,
                "data": {},
                "delay": delay,
            }
        )
    return out


class SequenceManager:
    """Keeps sequences in storage and runs them."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self.sequences: dict[str, dict[str, Any]] = {}
        self.status: dict[str, dict[str, Any]] = {}
        self._tasks: dict[str, asyncio.Task] = {}
        self._listeners: list[Callable[[str], None]] = []

    # ------------------------------------------------------------------ storage
    async def async_load(self) -> None:
        data = await self._store.async_load() or {}
        for seq in data.get("sequences", []):
            self.sequences[seq["id"]] = seq
            self.status[seq["id"]] = _initial_status()

    async def _async_persist(self) -> None:
        await self._store.async_save({"sequences": list(self.sequences.values())})

    async def async_save_sequence(self, sequence: dict[str, Any]) -> dict[str, Any]:
        seq = deepcopy(sequence)
        if not seq.get("id"):
            seq["id"] = _new_id()
        is_new = seq["id"] not in self.sequences
        for key in ("start_steps", "stop_steps"):
            for step in seq.setdefault(key, []):
                if not step.get("id"):
                    step["id"] = _new_id()

        self.sequences[seq["id"]] = seq
        if is_new:
            self.status[seq["id"]] = _initial_status()
        await self._async_persist()

        if is_new:
            async_dispatcher_send(self.hass, SIGNAL_SEQUENCE_ADDED, seq["id"])
        self._notify(seq["id"])
        return seq

    async def async_delete_sequence(self, seq_id: str) -> None:
        await self._async_cancel(seq_id)
        self.sequences.pop(seq_id, None)
        self.status.pop(seq_id, None)
        await self._async_persist()
        async_dispatcher_send(self.hass, SIGNAL_SEQUENCE_REMOVED, seq_id)
        self._notify(seq_id)

    # ---------------------------------------------------------------- listeners
    @callback
    def async_add_listener(self, listener: Callable[[str], None]) -> Callable[[], None]:
        self._listeners.append(listener)

        @callback
        def _remove() -> None:
            with contextlib.suppress(ValueError):
                self._listeners.remove(listener)

        return _remove

    @callback
    def _notify(self, seq_id: str) -> None:
        for listener in list(self._listeners):
            try:
                listener(seq_id)
            except Exception:  # noqa: BLE001
                _LOGGER.exception("Error in sequencer listener")

    @callback
    def _set_status(self, seq_id: str, **changes: Any) -> None:
        if seq_id not in self.status:
            return
        self.status[seq_id].update(changes)
        self._notify(seq_id)

    # ---------------------------------------------------------------- execution
    async def _async_cancel(self, seq_id: str) -> None:
        task = self._tasks.pop(seq_id, None)
        if task and not task.done():
            task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await task

    async def async_run(self, seq_id: str, direction: str) -> None:
        """Start or stop a sequence. A sequence already running is interrupted."""
        if seq_id not in self.sequences:
            raise KeyError(seq_id)
        await self._async_cancel(seq_id)
        self._tasks[seq_id] = self.hass.async_create_background_task(
            self._async_execute(seq_id, direction),
            f"sequencer_{seq_id}_{direction}",
        )

    async def async_shutdown(self) -> None:
        for seq_id in list(self._tasks):
            await self._async_cancel(seq_id)
        self._listeners.clear()

    async def _async_execute(self, seq_id: str, direction: str) -> None:
        seq = self.sequences[seq_id]
        starting = direction == DIRECTION_START
        steps = seq.get("start_steps", []) if starting else build_stop_steps(seq)
        total = len(steps)
        errors: list[str] = []

        self._set_status(
            seq_id,
            state=STATE_STARTING if starting else STATE_STOPPING,
            direction=direction,
            step=0,
            total=total,
            step_name=None,
            wait_until=None,
            errors=[],
        )
        self.hass.bus.async_fire(
            EVENT_SEQUENCER,
            {"sequence_id": seq_id, "name": seq.get("name"), "direction": direction, "type": "started"},
        )

        try:
            for idx, step in enumerate(steps, start=1):
                name = step.get("name") or f"Steg {idx}"
                self._set_status(seq_id, step=idx, step_name=name, wait_until=None)
                try:
                    await self._async_execute_step(step)
                except Exception as err:  # noqa: BLE001
                    _LOGGER.error("Sequence '%s', step '%s' failed: %s", seq.get("name"), name, err)
                    errors.append(f"{name}: {err}")
                    self._set_status(seq_id, errors=list(errors))

                delay = float(step.get("delay") or 0)
                if delay > 0 and idx < total:
                    self._set_status(seq_id, wait_until=time.time() + delay)
                    await asyncio.sleep(delay)
        except asyncio.CancelledError:
            self._set_status(seq_id, wait_until=None)
            raise

        self._set_status(
            seq_id,
            state=STATE_ON if starting else STATE_OFF,
            step=total,
            step_name=None,
            wait_until=None,
            last_run=time.time(),
        )
        self.hass.bus.async_fire(
            EVENT_SEQUENCER,
            {
                "sequence_id": seq_id,
                "name": seq.get("name"),
                "direction": direction,
                "type": "finished",
                "errors": errors,
            },
        )

    async def _async_execute_step(self, step: dict[str, Any]) -> None:
        action = step.get("action", ACTION_TURN_ON)
        entities = step.get("entities") or []
        data = dict(step.get("data") or {})

        if action == ACTION_SERVICE:
            service = step.get("service") or ""
            if "." not in service:
                raise ValueError(f"Ogiltig tjänst '{service}'")
            domain, service_name = service.split(".", 1)
        else:
            if not entities:
                return
            domain, service_name = "homeassistant", action

        if entities:
            data["entity_id"] = entities

        async with asyncio.timeout(SERVICE_TIMEOUT):
            await self.hass.services.async_call(domain, service_name, data, blocking=True)
