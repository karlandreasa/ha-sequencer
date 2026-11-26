# Sequencer – power sequencing for Home Assistant

🇬🇧 English · 🇸🇪 [Svenska](README.sv.md)

Adds a **Sequences** tab to the sidebar. Draw up your system there, e.g. mixer → DSP → amplifiers, and divide it into groups such as rooms or zones. Then start and stop the groups in the right order: from the panel, from a switch, or directly from a remote control. No automations needed.

## Tabs

| Tab | What you do there |
|---|---|
| **Control** | Start and stop groups and sequences, "Turn everything off", and a live diagram of what is running. |
| **Equipment & rules** | *Diagram:* add equipment with a picture and draw arrows between units. An arrow means **started before** and **turned off after**. *Rules:* the same order as text, plus priority (always first / always last), delays and wait conditions. The rules apply to the whole system. |
| **Groups** | Choose the equipment a group needs. Whatever is required before it is included automatically. This is also where you choose the group's status LED. |
| **Sequences** | Every group gets a sequence automatically. It can be adjusted by hand, and you can also make your own sequences without any groups. See below. |
| **Remotes** | Link buttons to groups and sequences with the action *Start*, *Turn off* or *Toggle*. Listen mode finds the button for you. |

## Sequences

- **Automatic:** built from the rules and the group's equipment, and follows along when something changes.
- **Moments** (light/colour, pause, wait until …, DMX scene, service, turn an entity on/off) can be placed anywhere. Moments follow no rules and never give warnings. In an automatic sequence they don't lock it either – it keeps following the rules.
- **Customised** (🟡): when you move, remove or add equipment or change a delay, the sequence becomes customised and no longer updates itself. *Reset to automatic* is always available.
- **The group has changed** (🟠): if the group or the rules change after you customised the sequence, you see what is missing and can choose *Add missing at the suggested position*, *Keep my version* or *Reset*.
- **⚠ A warning** appears **only** when your order breaks a rule, e.g. amplifier before mixer. The sequence still runs in your order.
- **Carry on anyway:** anything already running, e.g. the mixer from another room, is skipped – including its wait and delay.
- **Shared equipment** is skipped when turning off if another running group or sequence uses it, unless the step is marked *always turn off*.

## Listen – add by button press

Find a wireless plug or a device with a physical button by pressing the button:

- **Equipment & rules → Diagram → Add by button press**: creates new equipment with a name and a guessed picture.
- **In the equipment settings → Listen**: adds the entity to existing equipment.
- **For wait conditions → Watch status**: creates the condition "wait until X = the new state".

## Mobile

The panel adapts to its width. On mobile the tabs move to a bottom bar, editors open full screen, tables become cards and the diagram gets zoom buttons. Connections can also be made in the equipment settings under *Connections*, so you don't have to draw arrows with your finger.

## Shared equipment

If the living room and the kitchen share the same mixer:

- The mixer is started when the first group starts. Anything already running is skipped.
- The mixer is only turned off when **no** other group using it is running.

## Per piece of equipment

- **Turning on and off:** turn the entities on/off, any service with JSON data, or *no action* – the latter suits passive speakers that should only appear in the diagram.
- **Wait after turning on / off** in seconds.
- **Wait until …** one or more entities (optionally an attribute) have a certain value, e.g. `sensor.amp_status = ready`. Choose *all* (X and Y) or *any* (X or Y), a maximum time, and whether the sequence should continue or abort when the time runs out.
- **Priority:** *Always first* means the unit starts before everything else in the same run and turns off last. *Always last* is the opposite. Priority only affects the order – it doesn't pull the unit into a group; the arrows and group selection do that.
- **Test:** buttons to turn a unit on or off right away.

## Types of equipment

Each piece of equipment has a *turn-on* and a *turn-off* action:

| Action | Used for |
|---|---|
| **Turn on / Turn off** | Switches, plugs, media players and the like. |
| **Light up / dim** | Brightness, transition (instant, fast, soft, slow or custom) and colour or colour temperature. For light entities. You can choose to wait for the transition to finish before the next step. |
| **Wake on LAN** | Starts a computer by MAC address and optional broadcast address. Add a ping sensor as an entity to show its status and to wait until the computer is up. |
| **Shut down Windows PC (RPC)** | Same protocol as `shutdown /s /m \\pc`. Requires an administrator account, *File and Printer Sharing* allowed in the firewall and, for local accounts, `LocalAccountTokenFilterPolicy=1`. A helper library (impacket) is installed automatically the first time the feature is used. |
| **DMX** | Art-Net or sACN (E1.31) directly to a DMX node on the network. Channels are written as `1=255, 2-4=50%` and you choose a fade time. The turn-off action *turn off the same channels* fades down whatever was turned on. If you already have DMX lights as light entities in HA, you can use *Light up / dim* instead. |
| **Service** | Any HA service with JSON data. |

There are pictures for mixer, amplifier, DSP, speakers, lighting console, spotlight, PAR can, moving head, dimmer rack, DMX node, cross, computer, projector and more.

## Status LED per group

Choose a light or switch entity, e.g. a GPIO LED:

- **Slow blinking** while the sequence runs.
- **Steady light** when everything started or turned off as it should. Turns off after 30 min (adjustable).
- **Fast blinking** on errors, until the group runs again.

## Remotes

- **Listen:** press the button within 60 s and choose the right row. Works with ZHA, deCONZ, Hue, Z-Wave, Zigbee2MQTT (action sensors), event entities and buttons.
- **Device:** choose device and button, just like in HA's automation editor.
- **Entity** or **Event:** manual modes for advanced cases.

## In Home Assistant

- `switch.<group>`: on starts the group, off turns it off. Attributes show status, current step, what it is waiting for and any errors. Created for both groups and own sequences.
- The event `sequencer_event` (`type: started/finished`, `action: start/stop`, `zone_id`, `errors`).

## Installation

**Marketplace (HA 2026.11+):** Settings → Marketplace → *Add from link* → `karlandreasa/ha-sequencer` → install → restart. Then add the *Sequencer* integration under Devices & services.

Sequences from version 1 are converted to equipment and groups automatically.

## Language

The panel is shown in Swedish if your HA language is Swedish, otherwise in English. Developers: new texts are written in Swedish in the code with `T("…")` and get an English translation in `tools/i18n/en.json`. Run `python3 tools/i18n/build.py` (and `tools/i18n/check_backend.py`) to inject and check the translations.

## Third party and acknowledgements

- **Art-Net™** Designed by and Copyright Artistic Licence Engineering Ltd. Sequencer sends ArtDmx packets according to the published, royalty-free specification.
- **sACN / ANSI E1.31** is an open standard from ESTA.
- **Windows shutdown** uses the [MS-RSP] protocol, published by Microsoft as an Open Specification, via the **[Impacket](https://github.com/fortra/impacket)** library ("This product includes software developed by SecureAuth Corporation"). Impacket is not included in this repository; Home Assistant installs it from PyPI the first time the feature is used, under Impacket's own license (a modified Apache Software License 1.1).
- The equipment pictures are original, simple SVG drawings.

## License

Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE). You may use, modify and distribute the code, including commercially, as long as the license and NOTICE are included. The license grants no right to use the project's name or trademarks.
