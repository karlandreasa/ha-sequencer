"""Sequencer – start and stop audio systems (or anything) in sequence, with a sidebar panel."""

from __future__ import annotations

from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.start import async_at_started

from . import websocket
from .const import (
    DOMAIN,
    PANEL_COMPONENT,
    PANEL_ICON,
    PANEL_TITLE,
    PANEL_URL_PATH,
    STATIC_URL,
    VERSION,
)
from .i18n import tr
from .manager import SequencerManager

PLATFORMS = [Platform.SWITCH]

type SequencerConfigEntry = ConfigEntry[SequencerManager]


async def async_setup_entry(hass: HomeAssistant, entry: SequencerConfigEntry) -> bool:
    manager = SequencerManager(hass)
    await manager.async_load()
    entry.runtime_data = manager
    hass.data[DOMAIN] = manager

    await _async_register_panel(hass)
    websocket.async_register(hass)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # Remote triggers (e.g. ZHA/Z2M device triggers) need their integrations loaded first.
    async def _start_remotes(_hass: HomeAssistant) -> None:
        await manager.async_setup_remotes()

    entry.async_on_unload(async_at_started(hass, _start_remotes))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: SequencerConfigEntry) -> bool:
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        await entry.runtime_data.async_shutdown()
        frontend.async_remove_panel(hass, PANEL_URL_PATH, warn_if_unknown=False)
        hass.data.pop(DOMAIN, None)
    return unloaded


async def _async_register_panel(hass: HomeAssistant) -> None:
    static_key = f"{DOMAIN}_static_registered"
    if not hass.data.get(static_key):
        await hass.http.async_register_static_paths(
            [StaticPathConfig(STATIC_URL, str(Path(__file__).parent / "frontend"), False)]
        )
        hass.data[static_key] = True

    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_URL_PATH,
        webcomponent_name=PANEL_COMPONENT,
        sidebar_title=tr(hass, PANEL_TITLE),
        sidebar_icon=PANEL_ICON,
        module_url=f"{STATIC_URL}/sequencer-panel.js?v={VERSION}",
        require_admin=True,
        config={},
    )
