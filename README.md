# Sequencer – sekvensstyrning för Home Assistant

Lägger till fliken **Sekvenser** i sidomenyn. Där bygger du sekvenser som startar och stänger av saker i tur och ordning, med en paus mellan varje del. Den är gjord för ljudanläggningar (mixer → DSP → slutsteg på, och tvärtom vid avstängning) men fungerar med alla entiteter och tjänster.

## Funktioner

- **Grafisk editor** i en egen flik: steg med namn, en eller flera entiteter, åtgärd och fördröjning till nästa steg. Stegen går att flytta upp och ned.
- **Åtgärder:** slå på, stäng av, växla eller valfri tjänst (t.ex. `media_player.volume_set`, `script.turn_on`) med extra data i JSON.
- **Avstängning:**
  - *Omvänd ordning:* startsekvensen körs baklänges med inverterad åtgärd och samma pauser. Slutstegen stängs alltså av först.
  - *Egen sekvens:* en helt separat avstängningsordning. Den kan fyllas i från den omvända startsekvensen som utgångspunkt.
- **Live-status** i panelen: vilket steg som körs, nedräkning under pauser och eventuella fel.
- **Säkert avbrott:** trycker du *Stäng av* medan sekvensen startar avbryts starten direkt och avstängningen körs.
- **En switch per sekvens** (`switch.<namn>`): *på* kör startsekvensen och *av* kör avstängningen. Den kan användas i automationer, på dashboards, med röststyrning och så vidare. Attributen `status`, `step`, `total_steps`, `step_name` och `errors` visar förloppet.
- **Event** `sequencer_event` (`type: started/finished`, `direction: start/stop`) som du kan trigga automationer på, t.ex. "när ljudet är helt uppstartat".

## Installation

**HACS:** HACS → ⋮ → *Custom repositories* → `https://github.com/karlandreasa/ha-sequencer`, typ *Integration* → sök på Sequencer → Download → starta om.

**Manuellt:** kopiera `custom_components/sequencer` till `/config/custom_components/sequencer`.

Starta sedan om Home Assistant och gå till **Inställningar → Enheter och tjänster → Lägg till integration → Sequencer**. Fliken **Sekvenser** dyker upp i sidomenyn. Den syns bara för administratörer.

Kräver Home Assistant 2025.1 eller senare.

## Exempel

| Steg | Entiteter | Åtgärd | Vänta |
|---|---|---|---|
| Mixer | `switch.mixer` | Slå på | 3 s |
| DSP / processor | `switch.dsp` | Slå på | 5 s |
| Slutsteg | `switch.amp_front`, `switch.amp_sub` | Slå på | – |

Med omvänd avstängning blir ordningen: slutsteg av → 5 s → DSP av → 3 s → mixer av.

## Bra att veta

- Varje tjänsteanrop väntar på svar (högst 30 s) innan pausen börjar. Om ett steg misslyckas loggas felet, det visas i panelen och sekvensen fortsätter.
- Steg av typen *Annan tjänst* går inte att invertera och hoppas därför över i omvänt läge. Pausen behålls. Välj egen avstängningssekvens om sådana steg behövs.
- Sekvenserna sparas i `.storage/sequencer.sequences`.
- Efter en omstart av Home Assistant visar alla sekvenser *Av*, eftersom integrationen inte vet vad som faktiskt är påslaget.
