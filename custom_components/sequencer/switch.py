"""One switch per group: on = start the group, off = stop it (shared equipment stays on)."""

from __future__ import annotations

from typing import Any

from homeassistant.components.switch import SwitchEntity
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import SequencerConfigEntry, graph
from .const import DOMAIN, PANEL_ICON, SIGNAL_ZONE_ADDED, SIGNAL_ZONE_REMOVED, VERSION
from .manager import SequencerManager


async def async_setup_entry(
    hass: HomeAssistant,
    entry: SequencerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    manager = entry.runtime_data
    async_add_entities(ZoneSwitch(manager, z["id"]) for z in manager.config["zones"])

    @callback
    def _added(zone_id: str) -> None:
        async_add_entities([ZoneSwitch(manager, zone_id)])

    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_ZONE_ADDED, _added))


class ZoneSwitch(SwitchEntity):
    _attr_should_poll = False

    def __init__(self, manager: SequencerManager, zone_id: str) -> None:
        self._manager = manager
        self._zone_id = zone_id
        # Same unique_id format as v1 sequences, so migrated switches keep their entity_id.
        self._attr_unique_id = f"{DOMAIN}_{zone_id}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, "sequencer")},
            name="Sekvensstyrning",
            manufacturer="Sequencer",
            sw_version=VERSION,
        )

    @property
    def _zone(self) -> dict[str, Any]:
        return self._manager.zone(self._zone_id) or {}

    @property
    def name(self) -> str | None:
        return self._zone.get("name")

    @property
    def icon(self) -> str | None:
        return self._zone.get("icon") or PANEL_ICON

    @property
    def is_on(self) -> bool:
        return self._zone_id in self._manager.zones_active

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        op = self._manager.ops.get(self._zone_id) or {}
        nodes = graph.node_map(self._manager.config)
        needed = graph.start_sequence(self._manager.config, self._zone_id)
        return {
            "zone_id": self._zone_id,
            "status": op.get("op") or ("on" if self.is_on else "off"),
            "current": op.get("node"),
            "waiting_for": op.get("waiting"),
            "equipment": [nodes[n].get("name") for n in needed if n in nodes],
            "errors": op.get("errors") or [],
        }

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(self._manager.async_add_listener(self._changed))
        self.async_on_remove(async_dispatcher_connect(self.hass, SIGNAL_ZONE_REMOVED, self._removed))

    @callback
    def _changed(self, _kind: str) -> None:
        if self._manager.zone(self._zone_id) is not None:
            self.async_write_ha_state()

    async def _removed(self, zone_id: str) -> None:
        if zone_id != self._zone_id:
            return
        if self.registry_entry:
            er.async_get(self.hass).async_remove(self.entity_id)
        else:
            await self.async_remove(force_remove=True)

    async def async_turn_on(self, **kwargs: Any) -> None:
        await self._manager.async_zone(self._zone_id, "start")

    async def async_turn_off(self, **kwargs: Any) -> None:
        await self._manager.async_zone(self._zone_id, "stop")
