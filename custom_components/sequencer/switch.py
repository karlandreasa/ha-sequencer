"""One switch per sequence: on = run start sequence, off = run stop sequence."""

from __future__ import annotations

from typing import Any

from homeassistant.components.switch import SwitchEntity
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import SequencerConfigEntry
from .const import (
    DIRECTION_START,
    DIRECTION_STOP,
    DOMAIN,
    PANEL_ICON,
    SIGNAL_SEQUENCE_ADDED,
    SIGNAL_SEQUENCE_REMOVED,
    STATE_ON,
    STATE_STARTING,
    VERSION,
)
from .manager import SequenceManager


async def async_setup_entry(
    hass: HomeAssistant,
    entry: SequencerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    manager = entry.runtime_data
    async_add_entities(SequenceSwitch(manager, seq_id) for seq_id in manager.sequences)

    @callback
    def _added(seq_id: str) -> None:
        async_add_entities([SequenceSwitch(manager, seq_id)])

    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_SEQUENCE_ADDED, _added))


class SequenceSwitch(SwitchEntity):
    _attr_should_poll = False

    def __init__(self, manager: SequenceManager, seq_id: str) -> None:
        self._manager = manager
        self._seq_id = seq_id
        self._attr_unique_id = f"{DOMAIN}_{seq_id}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, "sequencer")},
            name="Sekvensstyrning",
            manufacturer="Sequencer",
            sw_version=VERSION,
        )

    @property
    def _seq(self) -> dict[str, Any]:
        return self._manager.sequences.get(self._seq_id, {})

    @property
    def _status(self) -> dict[str, Any]:
        return self._manager.status.get(self._seq_id, {})

    @property
    def name(self) -> str | None:
        return self._seq.get("name")

    @property
    def icon(self) -> str | None:
        return self._seq.get("icon") or PANEL_ICON

    @property
    def is_on(self) -> bool:
        return self._status.get("state") in (STATE_ON, STATE_STARTING)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        st = self._status
        return {
            "sequence_id": self._seq_id,
            "status": st.get("state"),
            "step": st.get("step"),
            "total_steps": st.get("total"),
            "step_name": st.get("step_name"),
            "errors": st.get("errors") or [],
        }

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(self._manager.async_add_listener(self._handle_change))
        self.async_on_remove(
            async_dispatcher_connect(self.hass, SIGNAL_SEQUENCE_REMOVED, self._handle_removed)
        )

    @callback
    def _handle_change(self, seq_id: str) -> None:
        if seq_id == self._seq_id and seq_id in self._manager.sequences:
            self.async_write_ha_state()

    async def _handle_removed(self, seq_id: str) -> None:
        if seq_id != self._seq_id:
            return
        registry = er.async_get(self.hass)
        if self.registry_entry:
            registry.async_remove(self.entity_id)
        else:
            await self.async_remove(force_remove=True)

    async def async_turn_on(self, **kwargs: Any) -> None:
        await self._manager.async_run(self._seq_id, DIRECTION_START)

    async def async_turn_off(self, **kwargs: Any) -> None:
        await self._manager.async_run(self._seq_id, DIRECTION_STOP)
