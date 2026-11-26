"""Constants for the Sequencer integration."""

DOMAIN = "sequencer"
VERSION = "1.0.0"

STORAGE_KEY = f"{DOMAIN}.sequences"
STORAGE_VERSION = 1

PANEL_URL_PATH = "sequencer"
PANEL_TITLE = "Sekvenser"
PANEL_ICON = "mdi:playlist-play"
PANEL_COMPONENT = "sequencer-panel"
STATIC_URL = "/sequencer_static"

SIGNAL_SEQUENCE_ADDED = f"{DOMAIN}_sequence_added"
SIGNAL_SEQUENCE_REMOVED = f"{DOMAIN}_sequence_removed"

EVENT_SEQUENCER = f"{DOMAIN}_event"

# Max time a single service call may take before the step is marked as failed.
SERVICE_TIMEOUT = 30

STATE_OFF = "off"
STATE_ON = "on"
STATE_STARTING = "starting"
STATE_STOPPING = "stopping"

DIRECTION_START = "start"
DIRECTION_STOP = "stop"

ACTION_TURN_ON = "turn_on"
ACTION_TURN_OFF = "turn_off"
ACTION_TOGGLE = "toggle"
ACTION_SERVICE = "service"
ACTIONS = [ACTION_TURN_ON, ACTION_TURN_OFF, ACTION_TOGGLE, ACTION_SERVICE]

STOP_MODE_REVERSE = "reverse"
STOP_MODE_CUSTOM = "custom"
