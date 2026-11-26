"""Websocket API used by the sidebar panel."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import config_validation as cv

from .const import (
    ACTION_SERVICE,
    ACTION_TURN_ON,
    ACTIONS,
    DIRECTION_START,
    DIRECTION_STOP,
    DOMAIN,
    STOP_MODE_CUSTOM,
    STOP_MODE_REVERSE,
)
from .manager import SequenceManager

STEP_SCHEMA = vol.Schema(
    {
        vol.Optional("id"): cv.string,
        vol.Optional("name", default=""): vol.Any(None, cv.string),
        vol.Optional("entities", default=[]): vol.All(cv.ensure_list, [cv.entity_id]),
        vol.Optional("action", default=ACTION_TURN_ON): vol.In(ACTIONS),
        vol.Optional("service", default=""): vol.Any(None, cv.string),
        vol.Optional("data", default={}): dict,
        vol.Optional("delay", default=0): vol.All(vol.Coerce(float), vol.Range(min=0, max=3600)),
    },
    extra=vol.REMOVE_EXTRA,
)


def _validate_services(seq: dict[str, Any]) -> dict[str, Any]:
    for key in ("start_steps", "stop_steps"):
        for step in seq[key]:
            if step["action"] == ACTION_SERVICE:
                cv.service(step.get("service") or "")
    return seq


SEQUENCE_SCHEMA = vol.All(
    vol.Schema(
        {
            vol.Optional("id"): vol.Any(None, cv.string),
            vol.Required("name"): vol.All(cv.string, vol.Length(min=1)),
            vol.Optional("icon", default=""): vol.Any(None, cv.string),
            vol.Optional("stop_mode", default=STOP_MODE_REVERSE): vol.In(
                [STOP_MODE_REVERSE, STOP_MODE_CUSTOM]
            ),
            vol.Optional("start_steps", default=[]): [STEP_SCHEMA],
            vol.Optional("stop_steps", default=[]): [STEP_SCHEMA],
        },
        extra=vol.REMOVE_EXTRA,
    ),
    _validate_services,
)


@callback
def async_register(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, ws_list)
    websocket_api.async_register_command(hass, ws_save)
    websocket_api.async_register_command(hass, ws_delete)
    websocket_api.async_register_command(hass, ws_run)
    websocket_api.async_register_command(hass, ws_subscribe)


def _manager(hass: HomeAssistant, connection, msg) -> SequenceManager | None:
    manager = hass.data.get(DOMAIN)
    if manager is None:
        connection.send_error(msg["id"], "not_loaded", "Sequencer är inte laddad")
    return manager


@websocket_api.websocket_command({vol.Required("type"): "sequencer/list"})
@callback
def ws_list(hass: HomeAssistant, connection, msg) -> None:
    if (manager := _manager(hass, connection, msg)) is None:
        return
    connection.send_result(
        msg["id"],
        {"sequences": list(manager.sequences.values()), "status": manager.status},
    )


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): "sequencer/save", vol.Required("sequence"): dict}
)
@websocket_api.async_response
async def ws_save(hass: HomeAssistant, connection, msg) -> None:
    if (manager := _manager(hass, connection, msg)) is None:
        return
    try:
        seq = SEQUENCE_SCHEMA(msg["sequence"])
    except vol.Invalid as err:
        connection.send_error(msg["id"], "invalid_format", str(err))
        return
    saved = await manager.async_save_sequence(seq)
    connection.send_result(msg["id"], saved)


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): "sequencer/delete", vol.Required("sequence_id"): str}
)
@websocket_api.async_response
async def ws_delete(hass: HomeAssistant, connection, msg) -> None:
    if (manager := _manager(hass, connection, msg)) is None:
        return
    await manager.async_delete_sequence(msg["sequence_id"])
    connection.send_result(msg["id"])


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "sequencer/run",
        vol.Required("sequence_id"): str,
        vol.Required("direction"): vol.In([DIRECTION_START, DIRECTION_STOP]),
    }
)
@websocket_api.async_response
async def ws_run(hass: HomeAssistant, connection, msg) -> None:
    if (manager := _manager(hass, connection, msg)) is None:
        return
    try:
        await manager.async_run(msg["sequence_id"], msg["direction"])
    except KeyError:
        connection.send_error(msg["id"], "not_found", "Sekvensen finns inte")
        return
    connection.send_result(msg["id"])


@websocket_api.websocket_command({vol.Required("type"): "sequencer/subscribe"})
@callback
def ws_subscribe(hass: HomeAssistant, connection, msg) -> None:
    if (manager := _manager(hass, connection, msg)) is None:
        return

    @callback
    def forward(seq_id: str) -> None:
        connection.send_message(
            websocket_api.event_message(
                msg["id"],
                {"sequence_id": seq_id, "status": manager.status.get(seq_id)},
            )
        )

    connection.subscriptions[msg["id"]] = manager.async_add_listener(forward)
    connection.send_result(msg["id"])
