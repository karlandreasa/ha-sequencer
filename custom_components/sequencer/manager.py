"""Engine: equipment graph, zones (groups) with shared equipment, remote controls."""

from __future__ import annotations

import asyncio
import contextlib
from collections.abc import Callable
from copy import deepcopy
from functools import partial
import logging
import time
from typing import Any

from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.helpers.storage import Store
from homeassistant.helpers.trigger import (
    async_initialize_triggers,
    async_validate_trigger_config,
)

from . import graph, netcontrol
from .dmx import DmxEngine, parse_channels
from .const import (
    ALL_ZONES,
    EVENT_SEQUENCER,
    OFF_STATES,
    REMOTE_DEBOUNCE,
    SERVICE_TIMEOUT,
    SIGNAL_ZONE_ADDED,
    SIGNAL_ZONE_REMOVED,
    STORAGE_KEY_CONFIG,
    STORAGE_KEY_STATE,
    STORAGE_KEY_V1,
    STORAGE_VERSION,
)

_LOGGER = logging.getLogger(__name__)

ENTITY_STATE_ACTIONS = {"turn_on", "light", "wol"}

EMPTY_CONFIG: dict[str, Any] = {"nodes": [], "edges": [], "zones": [], "remotes": []}


class SequenceAborted(Exception):
    """A wait condition timed out with on_timeout = abort."""


class SequencerManager:
    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
        self._state_store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY_STATE)
        self.config: dict[str, Any] = deepcopy(EMPTY_CONFIG)

        self.zones_active: set[str] = set()
        self.tracked: dict[str, bool] = {}  # node id -> on (for non entity-based nodes)
        self.transient: dict[str, str] = {}  # node id -> "starting" | "stopping"
        self.ops: dict[str, dict[str, Any]] = {}  # zone id / ALL -> run status
        self.remote_status: dict[str, dict[str, Any]] = {}

        self._lock = asyncio.Lock()
        self._tasks: dict[str, asyncio.Task] = {}
        self._listeners: list[Callable[[str], None]] = []
        self._remote_unsubs: list[Callable[[], None]] = []
        self._remote_last: dict[str, float] = {}
        self._started = False
        self.dmx = DmxEngine(hass)
        self._led_tasks: dict[str, asyncio.Task] = {}  # led entity -> blink/hold task
        self.led_modes: dict[str, str] = {}  # zone id -> slow | fast | on | off

    # ================================================================ storage
    async def async_load(self) -> None:
        data = await self._store.async_load()
        if data is None:
            old = await Store(self.hass, STORAGE_VERSION, STORAGE_KEY_V1).async_load()
            if old and old.get("sequences"):
                data = graph.migrate_v1(old)
                await self._store.async_save(data)
                _LOGGER.info("Migrated %d sequences to the new group model", len(old["sequences"]))
        self.config = {**deepcopy(EMPTY_CONFIG), **(data or {})}

        state = await self._state_store.async_load() or {}
        zone_ids = {z["id"] for z in self.config["zones"]}
        node_ids = {n["id"] for n in self.config["nodes"]}
        self.zones_active = set(state.get("zones_active", [])) & zone_ids
        self.tracked = {k: bool(v) for k, v in state.get("tracked", {}).items() if k in node_ids}

    @callback
    def _save_state(self) -> None:
        self._state_store.async_delay_save(
            lambda: {"zones_active": sorted(self.zones_active), "tracked": self.tracked}, 1
        )

    async def async_set_config(self, cfg: dict[str, Any]) -> dict[str, Any]:
        old_zones = {z["id"] for z in self.config["zones"]}
        self.config = cfg
        await self._store.async_save(cfg)

        zone_ids = {z["id"] for z in cfg["zones"]}
        node_ids = {n["id"] for n in cfg["nodes"]}
        self.zones_active &= zone_ids
        self.tracked = {k: v for k, v in self.tracked.items() if k in node_ids}
        for zid in old_zones - zone_ids:
            await self._cancel(zid)
            self.ops.pop(zid, None)
            async_dispatcher_send(self.hass, SIGNAL_ZONE_REMOVED, zid)
        for zid in zone_ids - old_zones:
            async_dispatcher_send(self.hass, SIGNAL_ZONE_ADDED, zid)
        self._save_state()

        if self._started:
            await self.async_setup_remotes()
        self._notify("config")
        self._notify("state")
        return cfg

    # ============================================================== listeners
    @callback
    def async_add_listener(self, listener: Callable[[str], None]) -> Callable[[], None]:
        self._listeners.append(listener)

        @callback
        def _remove() -> None:
            with contextlib.suppress(ValueError):
                self._listeners.remove(listener)

        return _remove

    @callback
    def _notify(self, kind: str = "state") -> None:
        for listener in list(self._listeners):
            try:
                listener(kind)
            except Exception:  # noqa: BLE001
                _LOGGER.exception("Error in sequencer listener")

    def snapshot(self) -> dict[str, Any]:
        return {
            "zones_active": sorted(self.zones_active),
            "tracked": self.tracked,
            "transient": self.transient,
            "ops": self.ops,
            "remotes": self.remote_status,
            "leds": self.led_modes,
        }

    @callback
    def _set_op(self, key: str, **changes: Any) -> None:
        self.ops.setdefault(key, {"op": None, "node": None, "wait_until": None, "waiting": None, "errors": []})
        self.ops[key].update(changes)
        self._notify()

    # ================================================================ helpers
    def zone(self, zone_id: str) -> dict[str, Any] | None:
        return next((z for z in self.config["zones"] if z["id"] == zone_id), None)

    def _is_off(self, entity_id: str) -> bool:
        st = self.hass.states.get(entity_id)
        return st is None or st.state in OFF_STATES

    @staticmethod
    def _entity_based(node: dict[str, Any]) -> bool:
        """Running state is read from the entities (switches, lights, a ping sensor for WoL …)."""
        return bool(node.get("entities")) and (node.get("on") or {}).get("action", "turn_on") in ENTITY_STATE_ACTIONS

    def _needs_on(self, node: dict[str, Any]) -> bool:
        if (node.get("on") or {}).get("action", "turn_on") == "none":
            return False
        if self._entity_based(node):
            return any(self._is_off(e) for e in node["entities"])
        return not self.tracked.get(node["id"], False)

    def _needs_off(self, node: dict[str, Any]) -> bool:
        if (node.get("off") or {}).get("action", "turn_off") == "none":
            return False
        if self._entity_based(node):
            return any(not self._is_off(e) for e in node["entities"])
        return self.tracked.get(node["id"], False)

    # ============================================================== execution
    async def _cancel(self, key: str) -> None:
        task = self._tasks.pop(key, None)
        if task and not task.done() and task is not asyncio.current_task():
            task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await task

    async def async_zone(self, zone_id: str, action: str) -> None:
        """start | stop | toggle a zone. Returns immediately; the run happens in the background."""
        if zone_id == ALL_ZONES:
            await self.async_all(action)
            return
        if self.zone(zone_id) is None:
            raise KeyError(zone_id)
        if action == "toggle":
            action = "stop" if zone_id in self.zones_active else "start"

        await self._cancel(zone_id)
        starting = action == "start"
        if starting:
            self.zones_active.add(zone_id)
        else:
            self.zones_active.discard(zone_id)
        self._save_state()
        self._set_op(zone_id, op="starting" if starting else "stopping", node=None, wait_until=None, waiting=None, errors=[])
        self._led([zone_id], "slow")
        self._tasks[zone_id] = self.hass.async_create_background_task(
            self._async_run(zone_id, starting), f"sequencer_{zone_id}_{action}"
        )

    async def async_all(self, action: str) -> None:
        if action == "toggle":
            action = "stop" if self.zones_active else "start"
        if action == "start":
            for z in self.config["zones"]:
                await self.async_zone(z["id"], "start")
            return
        for key in list(self._tasks):
            await self._cancel(key)
        self.zones_active.clear()
        self._save_state()
        for z in self.config["zones"]:
            self.ops.pop(z["id"], None)
        self._set_op(ALL_ZONES, op="stopping", node=None, wait_until=None, waiting=None, errors=[])
        self._led([z["id"] for z in self.config["zones"]], "slow")
        self._tasks[ALL_ZONES] = self.hass.async_create_background_task(
            self._async_run(ALL_ZONES, False), "sequencer_all_off"
        )

    async def _async_run(self, key: str, starting: bool) -> None:
        zone = self.zone(key)
        name = zone["name"] if zone else "Alla"
        errors: list[str] = []
        completed = False
        try:
            async with self._lock:
                if starting:
                    seq = graph.start_sequence(self.config, key)
                else:
                    seq = graph.stop_sequence(
                        self.config, None if key == ALL_ZONES else key, self.zones_active
                    )
                self.hass.bus.async_fire(
                    EVENT_SEQUENCER,
                    {"zone_id": key, "name": name, "action": "start" if starting else "stop", "type": "started"},
                )
                errors = await self._run_nodes(key, seq, starting)
            completed = True
            self.hass.bus.async_fire(
                EVENT_SEQUENCER,
                {
                    "zone_id": key,
                    "name": name,
                    "action": "start" if starting else "stop",
                    "type": "finished",
                    "errors": errors,
                },
            )
        finally:
            if completed:
                zones = [z["id"] for z in self.config["zones"]] if key == ALL_ZONES else [key]
                self._led(zones, "fast" if errors else "on")
            if key in self.ops:
                self.ops[key].update(op=None, node=None, wait_until=None, waiting=None)
                if key == ALL_ZONES and not self.ops[key].get("errors"):
                    self.ops.pop(key, None)
            if self._tasks.get(key) is asyncio.current_task():
                self._tasks.pop(key, None)
            self._notify()

    async def _run_nodes(self, key: str, seq: list[str], on: bool) -> list[str]:
        nodes = graph.node_map(self.config)
        errors: list[str] = []
        todo: list[dict[str, Any]] = []
        for nid in seq:
            node = nodes.get(nid)
            if node is None:
                continue
            if self._needs_on(node) if on else self._needs_off(node):
                todo.append(node)
            else:
                self.tracked[nid] = on  # already in the right state, or visual-only
        self._save_state()
        self._notify()

        for idx, node in enumerate(todo):
            nid = node["id"]
            label = node.get("name") or "?"
            self.transient[nid] = "starting" if on else "stopping"
            self._set_op(key, node=label, wait_until=None, waiting=None)
            try:
                wait = node.get("wait_on" if on else "wait_off")
                if wait and wait.get("conditions"):
                    try:
                        await self._async_wait(key, wait)
                    except SequenceAborted as err:
                        errors.append(f"{label}: {err}")
                        self._set_op(key, errors=list(errors))
                        _LOGGER.warning("Sequence '%s' aborted at '%s': %s", key, label, err)
                        return errors
                    except TimeoutError:
                        errors.append(f"{label}: väntade för länge, fortsätter")
                        self._set_op(key, errors=list(errors))

                try:
                    await self._async_execute(node, on)
                except Exception as err:  # noqa: BLE001
                    _LOGGER.error("'%s' failed to turn %s: %s", label, "on" if on else "off", err)
                    errors.append(f"{label}: {err}")
                    self._set_op(key, errors=list(errors))
                self.tracked[nid] = on
                self._save_state()

                delay = float(node.get("delay_on" if on else "delay_off") or 0)
                if delay > 0 and idx < len(todo) - 1:
                    self._set_op(key, wait_until=time.time() + delay, waiting=None)
                    await asyncio.sleep(delay)
            finally:
                self.transient.pop(nid, None)
                self._notify()
        return errors

    def _conditions_met(self, wait: dict[str, Any]) -> bool:
        results = []
        for cond in wait["conditions"]:
            st = self.hass.states.get(cond.get("entity_id", ""))
            wanted = [s.strip() for s in str(cond.get("state", "")).split(",") if s.strip()]
            if st is None:
                results.append(False)
                continue
            attr = (cond.get("attribute") or "").strip()
            value = st.attributes.get(attr) if attr else st.state
            results.append(str(value) in wanted if wanted else value not in (None, "unavailable", "unknown"))
        return any(results) if wait.get("mode") == "any" else all(results)

    async def _async_wait(self, key: str, wait: dict[str, Any]) -> None:
        """Wait until the conditions are met. Raises TimeoutError / SequenceAborted."""
        if self._conditions_met(wait):
            return
        timeout = float(wait.get("timeout") or 60)
        entities = [c["entity_id"] for c in wait["conditions"] if c.get("entity_id")]
        joiner = " eller " if wait.get("mode") == "any" else " och "
        text = joiner.join(
            f"{self._friendly(c.get('entity_id'))}{'.' + c['attribute'] if c.get('attribute') else ''} = {c.get('state') or 'något'}"
            for c in wait["conditions"]
        )
        self._set_op(key, waiting=text, wait_until=time.time() + timeout)

        done = asyncio.Event()

        @callback
        def _changed(_event: Event) -> None:
            if self._conditions_met(wait):
                done.set()

        unsub = async_track_state_change_event(self.hass, entities, _changed)
        try:
            async with asyncio.timeout(timeout):
                await done.wait()
        except TimeoutError:
            if wait.get("on_timeout") == "abort":
                raise SequenceAborted(f"villkoret uppfylldes inte inom {timeout:g} s") from None
            raise
        finally:
            unsub()
            self._set_op(key, waiting=None, wait_until=None)

    def _friendly(self, entity_id: str | None) -> str:
        st = self.hass.states.get(entity_id or "")
        return (st and st.attributes.get("friendly_name")) or (entity_id or "?")

    async def _async_execute(self, node: dict[str, Any], on: bool) -> None:
        spec = node.get("on" if on else "off") or {}
        action = spec.get("action") or ("turn_on" if on else "turn_off")
        entities = node.get("entities") or []
        data = dict(spec.get("data") or {})
        wait = 0.0

        if action == "none":
            return
        if action == "light" or action == "light_off":
            lights = [e for e in entities if e.startswith("light.")]
            if not lights:
                raise ValueError("inga light-entiteter att dimma")
            data["entity_id"] = lights
            transition = float(spec.get("transition") or 0)
            if transition > 0:
                data["transition"] = transition
            if action == "light":
                if spec.get("brightness") not in (None, ""):
                    data["brightness_pct"] = max(0, min(100, int(float(spec["brightness"]))))
                if spec.get("color_mode") == "rgb" and spec.get("rgb"):
                    hexv = str(spec["rgb"]).lstrip("#")
                    data["rgb_color"] = [int(hexv[i : i + 2], 16) for i in (0, 2, 4)]
                elif spec.get("color_mode") == "temp" and spec.get("kelvin"):
                    data["color_temp_kelvin"] = int(spec["kelvin"])
            if spec.get("wait"):
                wait = transition
            await self._async_call("light", "turn_on" if action == "light" else "turn_off", data)
        elif action == "wol":
            await self.hass.async_add_executor_job(
                netcontrol.send_magic_packet, spec.get("mac", ""), spec.get("broadcast") or None, spec.get("port") or 9
            )
        elif action == "rpc_shutdown":
            await netcontrol.async_ensure_impacket(self.hass)
            await self.hass.async_add_executor_job(
                netcontrol.windows_shutdown,
                spec.get("host", ""),
                spec.get("username", ""),
                spec.get("password", ""),
                spec.get("domain", ""),
                int(spec.get("timeout") or 0),
                spec.get("force", True) is not False,
                bool(spec.get("reboot")),
            )
        elif action in ("dmx", "dmx_off"):
            src = spec if action == "dmx" else (node.get("on") or {})
            if src.get("action") != "dmx":
                raise ValueError("DMX-släckning kräver att påslaget är DMX")
            values = parse_channels(src.get("channels"))
            if action == "dmx_off":
                values = {ch: 0 for ch in values}
            fade = float(spec.get("fade") or 0)
            await self.dmx.async_set(src.get("protocol") or "artnet", src.get("host") or "", int(src.get("universe") or 0), values, fade)
            if spec.get("wait"):
                wait = fade
        elif action == "service":
            service = spec.get("service") or ""
            if "." not in service:
                raise ValueError(f"ogiltig tjänst '{service}'")
            if entities and "entity_id" not in data:
                data["entity_id"] = entities
            domain, service_name = service.split(".", 1)
            await self._async_call(domain, service_name, data)
        else:  # turn_on / turn_off
            if not entities:
                return
            data.setdefault("entity_id", entities)
            await self._async_call("homeassistant", action, data)

        if wait > 0:
            await asyncio.sleep(wait)

    async def _async_call(self, domain: str, service: str, data: dict[str, Any]) -> None:
        async with asyncio.timeout(SERVICE_TIMEOUT):
            await self.hass.services.async_call(domain, service, data, blocking=True)

    async def async_test_node(self, node: dict[str, Any], on: bool) -> None:
        await self._async_execute(node, on)
        if node.get("id") in graph.node_map(self.config):
            self.tracked[node["id"]] = on
            self._save_state()
            self._notify()

    async def async_shutdown(self) -> None:
        self._unsub_remotes()
        for task in self._led_tasks.values():
            task.cancel()
        self._led_tasks.clear()
        await self.dmx.async_stop()
        for key in list(self._tasks):
            await self._cancel(key)
        self._listeners.clear()


    # ============================================================ status LEDs
    @callback
    def _led(self, zone_ids: list[str], mode: str) -> None:
        """slow = running, on = finished OK (off after N minutes), fast = error."""
        for zid in zone_ids:
            zone = self.zone(zid)
            if not zone or not zone.get("led"):
                continue
            self.led_modes[zid] = mode
            entity = zone["led"]
            old = self._led_tasks.pop(entity, None)
            if old and not old.done():
                old.cancel()
            minutes = float(zone.get("led_minutes", 30) or 0)
            self._led_tasks[entity] = self.hass.async_create_background_task(
                self._async_led(zid, entity, mode, minutes), f"sequencer_led_{entity}"
            )
        self._notify()

    async def _led_set(self, entity: str, on: bool) -> None:
        try:
            await self.hass.services.async_call(
                "homeassistant", "turn_on" if on else "turn_off", {"entity_id": [entity]}, blocking=False
            )
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("LED %s: %s", entity, err)

    async def _async_led(self, zone_id: str, entity: str, mode: str, minutes: float) -> None:
        if mode in ("slow", "fast"):
            half = 0.7 if mode == "slow" else 0.18
            state = True
            while True:
                await self._led_set(entity, state)
                state = not state
                await asyncio.sleep(half)
        elif mode == "on":
            await self._led_set(entity, True)
            if minutes > 0:
                await asyncio.sleep(minutes * 60)
                await self._led_set(entity, False)
                self.led_modes[zone_id] = "off"
                self._notify()
        else:
            await self._led_set(entity, False)

    # ================================================================ remotes
    def _unsub_remotes(self) -> None:
        for unsub in self._remote_unsubs:
            with contextlib.suppress(Exception):
                unsub()
        self._remote_unsubs.clear()

    async def async_setup_remotes(self) -> None:
        self._started = True
        self._unsub_remotes()
        self.remote_status = {}
        for remote in self.config.get("remotes", []):
            rid = remote["id"]
            status: dict[str, Any] = {"error": None, "last": None}
            self.remote_status[rid] = status
            if not remote.get("enabled", True) or not remote.get("trigger"):
                continue
            name = f"Sequencer: {remote.get('name') or rid}"
            try:
                conf = await async_validate_trigger_config(self.hass, [deepcopy(remote["trigger"])])
                unsub = await async_initialize_triggers(
                    self.hass,
                    conf,
                    partial(self._async_remote_fired, rid),
                    "sequencer",
                    name,
                    partial(self._log_trigger, name),
                )
            except Exception as err:  # noqa: BLE001
                status["error"] = str(err)
                _LOGGER.warning("Could not set up remote '%s': %s", name, err)
                continue
            if unsub is None:
                status["error"] = "Kunde inte starta utlösaren"
            else:
                self._remote_unsubs.append(unsub)
        self._notify()

    @staticmethod
    def _log_trigger(name: str, level: int, msg: str, **kwargs: Any) -> None:
        _LOGGER.log(level, "%s: %s", name, msg)

    async def _async_remote_fired(self, rid: str, run_variables: dict[str, Any], context=None) -> None:
        remote = next((r for r in self.config.get("remotes", []) if r["id"] == rid), None)
        if remote is None:
            return
        trig = (run_variables or {}).get("trigger") or {}
        to_state = trig.get("to_state")
        if to_state is not None and to_state.state in ("unavailable", "unknown"):
            return
        wanted_event = remote.get("event_type")
        if wanted_event and (to_state is None or to_state.attributes.get("event_type") != wanted_event):
            return

        now = time.monotonic()
        if now - self._remote_last.get(rid, 0) < REMOTE_DEBOUNCE:
            return
        self._remote_last[rid] = now
        self.remote_status.setdefault(rid, {"error": None})["last"] = time.time()
        self._notify()

        try:
            await self.async_zone(remote.get("target") or ALL_ZONES, remote.get("action") or "toggle")
        except KeyError:
            self.remote_status[rid]["error"] = "Gruppen finns inte längre"
            self._notify()
