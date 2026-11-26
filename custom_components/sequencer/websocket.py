"""Websocket API used by the sidebar panel."""

from __future__ import annotations

import json
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.const import EVENT_STATE_CHANGED, MATCH_ALL
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import async_call_later

from . import graph, netcontrol
from .dmx import parse_channels
from .const import ALL_ZONES, DOMAIN, NODE_OFF_ACTIONS, NODE_ON_ACTIONS, RANKS, ZONE_ACTIONS
from .manager import SequencerManager

LEARN_SECONDS = 60

_delay = vol.All(vol.Coerce(float), vol.Range(min=0, max=3600))


def _action_spec(actions: list[str]):
    def validate(value: dict[str, Any]) -> dict[str, Any]:
        action = value.get("action")
        if action == "service":
            cv.service(value.get("service") or "")
        elif action == "wol":
            try:
                netcontrol.normalize_mac(value.get("mac", ""))
            except ValueError as err:
                raise vol.Invalid(str(err)) from err
        elif action == "rpc_shutdown":
            if not value.get("host") or not value.get("username"):
                raise vol.Invalid("Windows-avstängning kräver värd och användarnamn")
        elif action == "dmx":
            try:
                parse_channels(value.get("channels"))
            except ValueError as err:
                raise vol.Invalid(str(err)) from err
        return value

    return vol.All(
        vol.Schema(
            {
                vol.Optional("action", default=actions[0]): vol.In(actions),
                vol.Optional("service", default=""): vol.Any(None, cv.string),
                vol.Optional("data", default={}): dict,
            },
            extra=vol.ALLOW_EXTRA,
        ),
        validate,
    )


WAIT_SCHEMA = vol.Any(
    None,
    vol.Schema(
        {
            vol.Optional("mode", default="all"): vol.In(["all", "any"]),
            vol.Optional("timeout", default=60): vol.All(vol.Coerce(float), vol.Range(min=1, max=3600)),
            vol.Optional("on_timeout", default="continue"): vol.In(["continue", "abort"]),
            vol.Optional("conditions", default=[]): [
                vol.Schema(
                    {
                        vol.Required("entity_id"): cv.entity_id,
                        vol.Optional("state", default=""): vol.Any(None, cv.string),
                        vol.Optional("attribute", default=""): vol.Any(None, cv.string),
                    },
                    extra=vol.REMOVE_EXTRA,
                )
            ],
        },
        extra=vol.REMOVE_EXTRA,
    ),
)

MOMENT_ACTIONS = ["turn_on", "turn_off", "light", "light_off", "dmx", "wol", "rpc_shutdown", "service", "none"]


def _step(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise vol.Invalid("ogiltigt steg")
    if value.get("kind") == "action":
        return MOMENT_SCHEMA(value)
    return NODE_STEP_SCHEMA(value)


NODE_STEP_SCHEMA = vol.Schema(
    {
        vol.Required("node"): cv.string,
        vol.Optional("delay", default=None): vol.Any(None, vol.All(vol.Coerce(float), vol.Range(min=0, max=3600))),
        vol.Optional("force", default=False): bool,
    },
    extra=vol.REMOVE_EXTRA,
)

EXTRAS_SCHEMA = vol.Schema(
    {
        vol.Optional("start", default=[]): [vol.Schema({vol.Optional("after", default=None): vol.Any(None, cv.string), vol.Required("step"): _step}, extra=vol.REMOVE_EXTRA)],
        vol.Optional("stop", default=[]): [vol.Schema({vol.Optional("after", default=None): vol.Any(None, cv.string), vol.Required("step"): _step}, extra=vol.REMOVE_EXTRA)],
    },
    extra=vol.REMOVE_EXTRA,
)

CUSTOM_SCHEMA = vol.Schema(
    {
        vol.Optional("start", default=[]): [_step],
        vol.Optional("stop", default=[]): [_step],
        vol.Optional("base_start", default=[]): [cv.string],
        vol.Optional("base_stop", default=[]): [cv.string],
    },
    extra=vol.REMOVE_EXTRA,
)

MOMENT_SCHEMA = vol.Schema(
    {
        vol.Required("kind"): "action",
        vol.Required("id"): cv.string,
        vol.Optional("name", default=""): vol.Any(None, cv.string),
        vol.Optional("entities", default=[]): vol.All(cv.ensure_list, [cv.entity_id]),
        vol.Optional("spec", default={}): _action_spec(MOMENT_ACTIONS),
        vol.Optional("wait", default=None): WAIT_SCHEMA,
        vol.Optional("delay", default=None): vol.Any(None, vol.All(vol.Coerce(float), vol.Range(min=0, max=3600))),
    },
    extra=vol.REMOVE_EXTRA,
)

NODE_SCHEMA = vol.Schema(
    {
        vol.Required("id"): cv.string,
        vol.Optional("name", default=""): vol.Any(None, cv.string),
        vol.Optional("image", default="generic"): cv.string,
        vol.Optional("entities", default=[]): vol.All(cv.ensure_list, [cv.entity_id]),
        vol.Optional("on", default={}): _action_spec(NODE_ON_ACTIONS),
        vol.Optional("off", default={}): _action_spec(NODE_OFF_ACTIONS),
        vol.Optional("delay_on", default=0): _delay,
        vol.Optional("delay_off", default=0): _delay,
        vol.Optional("rank", default="normal"): vol.In(RANKS),
        vol.Optional("wait_on", default=None): WAIT_SCHEMA,
        vol.Optional("wait_off", default=None): WAIT_SCHEMA,
        vol.Optional("x", default=0): vol.Coerce(float),
        vol.Optional("y", default=0): vol.Coerce(float),
    },
    extra=vol.REMOVE_EXTRA,
)

CONFIG_SCHEMA = vol.Schema(
    {
        vol.Optional("nodes", default=[]): [NODE_SCHEMA],
        vol.Optional("edges", default=[]): [
            vol.Schema({vol.Required("from"): cv.string, vol.Required("to"): cv.string}, extra=vol.REMOVE_EXTRA)
        ],
        vol.Optional("zones", default=[]): [
            vol.Schema(
                {
                    vol.Required("id"): cv.string,
                    vol.Required("name"): vol.All(cv.string, vol.Length(min=1)),
                    vol.Optional("icon", default=""): vol.Any(None, cv.string),
                    vol.Optional("color", default="#2196f3"): cv.string,
                    vol.Optional("nodes", default=[]): [cv.string],
                    vol.Optional("standalone", default=False): bool,
                    vol.Optional("custom", default=None): vol.Any(None, CUSTOM_SCHEMA),
                    vol.Optional("extras", default=None): vol.Any(None, EXTRAS_SCHEMA),
                    vol.Optional("led", default=""): vol.Any(None, "", cv.entity_id),
                    vol.Optional("led_minutes", default=30): vol.All(vol.Coerce(float), vol.Range(min=0, max=1440)),
                },
                extra=vol.REMOVE_EXTRA,
            )
        ],
        vol.Optional("remotes", default=[]): [
            vol.Schema(
                {
                    vol.Required("id"): cv.string,
                    vol.Optional("name", default=""): vol.Any(None, cv.string),
                    vol.Optional("enabled", default=True): bool,
                    vol.Optional("kind", default="event"): cv.string,
                    vol.Optional("trigger", default=None): vol.Any(None, dict),
                    vol.Optional("event_type", default=None): vol.Any(None, cv.string),
                    vol.Optional("target", default=ALL_ZONES): cv.string,
                    vol.Optional("action", default="toggle"): vol.In(ZONE_ACTIONS),
                },
                extra=vol.REMOVE_EXTRA,
            )
        ],
    },
    extra=vol.REMOVE_EXTRA,
)


def _validate_config(raw: dict[str, Any]) -> dict[str, Any]:
    cfg = CONFIG_SCHEMA(raw)
    node_ids = [n["id"] for n in cfg["nodes"]]
    if len(node_ids) != len(set(node_ids)):
        raise vol.Invalid("Två utrustningar har samma id")
    ids = set(node_ids)
    seen_edges = set()
    edges = []
    for e in cfg["edges"]:
        key = (e["from"], e["to"])
        if e["from"] in ids and e["to"] in ids and e["from"] != e["to"] and key not in seen_edges:
            seen_edges.add(key)
            edges.append(e)
    cfg["edges"] = edges
    if graph.has_cycle(cfg):
        raise vol.Invalid("Kopplingarna bildar en loop – något kan inte startas före sig självt")
    for z in cfg["zones"]:
        z["nodes"] = [n for n in z["nodes"] if n in ids]
        if z.get("custom"):
            for key in ("start", "stop"):
                z["custom"][key] = [st for st in z["custom"][key] if st.get("kind") == "action" or st["node"] in ids]
    zone_ids = {z["id"] for z in cfg["zones"]}
    for r in cfg["remotes"]:
        if r["target"] != ALL_ZONES and r["target"] not in zone_ids:
            raise vol.Invalid(f"Fjärrkontrollen '{r['name']}' styr en grupp som inte finns")
    return cfg


@callback
def async_register(hass: HomeAssistant) -> None:
    for handler in (ws_config, ws_save, ws_subscribe, ws_zone, ws_test_node, ws_learn):
        websocket_api.async_register_command(hass, handler)


def _manager(hass: HomeAssistant, connection, msg) -> SequencerManager | None:
    manager = hass.data.get(DOMAIN)
    if manager is None:
        connection.send_error(msg["id"], "not_loaded", "Sequencer är inte laddad")
    return manager


@websocket_api.websocket_command({vol.Required("type"): "sequencer/config"})
@callback
def ws_config(hass: HomeAssistant, connection, msg) -> None:
    if (m := _manager(hass, connection, msg)) is None:
        return
    connection.send_result(msg["id"], {"config": m.config, "state": m.snapshot()})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "sequencer/config/save", vol.Required("config"): dict})
@websocket_api.async_response
async def ws_save(hass: HomeAssistant, connection, msg) -> None:
    if (m := _manager(hass, connection, msg)) is None:
        return
    try:
        cfg = _validate_config(msg["config"])
    except vol.Invalid as err:
        connection.send_error(msg["id"], "invalid_format", str(err))
        return
    saved = await m.async_set_config(cfg)
    connection.send_result(msg["id"], {"config": saved, "state": m.snapshot()})


@websocket_api.websocket_command({vol.Required("type"): "sequencer/subscribe"})
@callback
def ws_subscribe(hass: HomeAssistant, connection, msg) -> None:
    if (m := _manager(hass, connection, msg)) is None:
        return

    @callback
    def forward(kind: str) -> None:
        payload: dict[str, Any] = {"type": kind}
        if kind == "state":
            payload["state"] = m.snapshot()
        connection.send_message(websocket_api.event_message(msg["id"], payload))

    connection.subscriptions[msg["id"]] = m.async_add_listener(forward)
    connection.send_result(msg["id"])
    forward("state")


@websocket_api.websocket_command(
    {
        vol.Required("type"): "sequencer/zone",
        vol.Required("zone_id"): str,
        vol.Required("action"): vol.In(ZONE_ACTIONS),
    }
)
@websocket_api.async_response
async def ws_zone(hass: HomeAssistant, connection, msg) -> None:
    if (m := _manager(hass, connection, msg)) is None:
        return
    try:
        await m.async_zone(msg["zone_id"], msg["action"])
    except KeyError:
        connection.send_error(msg["id"], "not_found", "Gruppen finns inte")
        return
    connection.send_result(msg["id"])


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): "sequencer/node/test", vol.Required("node"): dict, vol.Required("on"): bool}
)
@websocket_api.async_response
async def ws_test_node(hass: HomeAssistant, connection, msg) -> None:
    if (m := _manager(hass, connection, msg)) is None:
        return
    try:
        node = NODE_SCHEMA(msg["node"])
        await m.async_test_node(node, msg["on"])
    except Exception as err:  # noqa: BLE001
        connection.send_error(msg["id"], "failed", str(err))
        return
    connection.send_result(msg["id"])


# --------------------------------------------------------------------- learn mode
_IGNORED_EVENTS = {
    "call_service", "service_registered", "service_removed", "component_loaded",
    "core_config_updated", "automation_triggered", "automation_reloaded", "script_started",
    "logbook_entry", "panels_updated", "themes_updated", "lovelace_updated",
    "entity_registry_updated", "device_registry_updated", "area_registry_updated",
    "floor_registry_updated", "label_registry_updated", "category_registry_updated",
    "persistent_notifications_updated", "repairs_issue_registry_updated", "user_added",
    "user_removed", "user_updated", "timer_out_of_sync", "config_entry_discovered",
    "data_entry_flow_progressed", "recorder_5min_compile_statistics",
    "recorder_hourly_statistics_generated", "sequencer_event", "state_reported",
    "labs_updated", "assist_satellite_announce", "homeassistant_started", "homeassistant_start",
}
_VOLATILE_KEYS = {"context", "timestamp", "last_seen", "linkquality", "rssi", "lqi"}


def _json_safe(data: Any) -> Any:
    return json.loads(json.dumps(data, default=str))


def _candidate(event: Event) -> dict[str, Any] | None:
    etype = event.event_type
    if etype == EVENT_STATE_CHANGED:
        eid: str = event.data.get("entity_id", "")
        new = event.data.get("new_state")
        old = event.data.get("old_state")
        if new is None or new.state in ("unavailable", "unknown", ""):
            return None
        domain = eid.split(".", 1)[0]
        name = new.attributes.get("friendly_name") or eid
        if domain == "event":
            return {"kind": "event_entity", "entity_id": eid, "event_type": new.attributes.get("event_type"), "name": name}
        if domain in ("button", "input_button"):
            return {"kind": "button", "entity_id": eid, "name": name}
        if domain in ("sensor", "select", "text") and any(k in eid for k in ("action", "click", "button", "remote", "scene")):
            if old is None or old.state != new.state:
                return {"kind": "state", "entity_id": eid, "to": new.state, "name": name}
        return None
    if etype in _IGNORED_EVENTS or etype.startswith(("recorder_", "homeassistant_", "hacs", "marketplace")):
        return None
    data = {k: v for k, v in (event.data or {}).items() if k not in _VOLATILE_KEYS}
    return {"kind": "event", "event_type": etype, "event_data": _json_safe(data)}


_SKIP_DOMAINS = {
    "sun", "weather", "zone", "person", "device_tracker", "update", "automation", "script",
    "scene", "event", "button", "input_button", "timer", "counter", "image", "camera",
    "calendar", "todo", "conversation", "tts", "stt", "wake_word", "assist_satellite",
    "time", "date", "datetime", "input_datetime", "tag", "image_processing", "group",
}


def _entity_candidate(hass: HomeAssistant, event: Event) -> dict[str, Any] | None:
    """Learn mode for equipment: something physically changed state (e.g. a plug button)."""
    if event.event_type != EVENT_STATE_CHANGED:
        return None
    eid: str = event.data.get("entity_id", "")
    new = event.data.get("new_state")
    old = event.data.get("old_state")
    if new is None or old is None or old.state == new.state:
        return None
    if {old.state, new.state} & {"unavailable", "unknown"}:
        return None
    domain = eid.split(".", 1)[0]
    if domain in _SKIP_DOMAINS:
        return None
    try:
        float(new.state)
        return None  # numeric sensors change all the time
    except ValueError:
        pass
    entry = er.async_get(hass).async_get(eid)
    if entry is not None and entry.platform == DOMAIN:
        return None
    return {
        "kind": "entity",
        "entity_id": eid,
        "domain": domain,
        "name": new.attributes.get("friendly_name") or eid,
        "from": old.state,
        "to": new.state,
    }


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): "sequencer/learn", vol.Optional("mode", default="remote"): vol.In(["remote", "entity"])}
)
@callback
def ws_learn(hass: HomeAssistant, connection, msg) -> None:
    active = {"on": True}
    unsubs: list = []
    entity_mode = msg["mode"] == "entity"

    @callback
    def handle(event: Event) -> None:
        if not active["on"]:
            return
        cand = _entity_candidate(hass, event) if entity_mode else _candidate(event)
        if cand is not None:
            connection.send_message(websocket_api.event_message(msg["id"], cand))

    @callback
    def stop(*_args) -> None:
        if not active["on"]:
            return
        active["on"] = False
        for unsub in unsubs:
            unsub()

    unsubs.append(hass.bus.async_listen(MATCH_ALL, handle))
    unsubs.append(async_call_later(hass, LEARN_SECONDS, stop))
    connection.subscriptions[msg["id"]] = stop
    connection.send_result(msg["id"])
