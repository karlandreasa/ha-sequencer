"""Constants for the Sequencer integration."""

DOMAIN = "sequencer"
VERSION = "2.2.0"

STORAGE_KEY_V1 = f"{DOMAIN}.sequences"
STORAGE_KEY_CONFIG = f"{DOMAIN}.config"
STORAGE_KEY_STATE = f"{DOMAIN}.state"
STORAGE_VERSION = 1

PANEL_URL_PATH = "sequencer"
PANEL_TITLE = "Sekvenser"
PANEL_ICON = "mdi:playlist-play"
PANEL_COMPONENT = "sequencer-panel"
STATIC_URL = "/sequencer_static"

SIGNAL_ZONE_ADDED = f"{DOMAIN}_zone_added"
SIGNAL_ZONE_REMOVED = f"{DOMAIN}_zone_removed"

EVENT_SEQUENCER = f"{DOMAIN}_event"

# Max time a single service call may take before the step is marked as failed.
SERVICE_TIMEOUT = 30
# Ignore repeated presses of the same remote button within this time (seconds).
REMOTE_DEBOUNCE = 0.8

ALL_ZONES = "__all__"

# Entity states that count as "off" when deciding whether equipment is running.
OFF_STATES = {"off", "unavailable", "unknown", "standby"}

NODE_ON_ACTIONS = ["turn_on", "light", "wol", "dmx", "service", "none"]
NODE_OFF_ACTIONS = ["turn_off", "light_off", "rpc_shutdown", "dmx_off", "dmx", "service", "none"]
ZONE_ACTIONS = ["start", "stop", "toggle"]
RANKS = ["first", "normal", "last"]
RANK_ORDER = {"first": 0, "normal": 1, "last": 2}
