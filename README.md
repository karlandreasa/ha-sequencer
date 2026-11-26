# Sequencer – sekvensstyrning för Home Assistant

Lägger till fliken **Sekvenser** i sidomenyn. Där ritar du upp din anläggning, till exempel mixer → DSP → slutsteg, och delar in den i grupper som rum eller zoner. Sedan startar och stänger du grupperna i rätt ordning, från panelen, från en switch eller direkt från en fjärrkontroll. Inga automationer behövs.

## Flikar

| Flik | Vad du gör där |
|---|---|
| **Styrning** | Starta och stäng av grupper, "Stäng av allt" och live-schema över vad som är igång. Håll muspekaren över en grupp för att se vilken utrustning den använder. |
| **Flödesschema** | Lägg till utrustning med en bild (mixer, slutsteg, högtalare, DSP …), dra den dit du vill och dra pilar mellan enheterna. En pil betyder **startas före** och **stängs av efter**. |
| **Regler** | Samma ordning som pilarna, men i textform. Här finns också *prioritet* (alltid först / alltid sist), fördröjningar och väntevillkor samlade i en tabell. |
| **Grupper** | Välj vilken utrustning en grupp behöver. Det som krävs före tas med automatiskt. Här väljer du också gruppens status-LED. |
| **Fjärrkontroller** | Koppla knappar till grupper med åtgärden *Starta*, *Stäng av* eller *Växla*. Lyssna-läget hittar knappen åt dig. |

## Lyssna – lägg till med knapptryck

Ett trådlöst uttag eller en enhet med en fysisk knapp hittar du genom att trycka på knappen:

- **Flödesschema → 🎧 Lägg till med knapptryck**: skapar ny utrustning med namn och en gissad bild.
- **I utrustningens inställningar → 🎧 Lyssna**: lägger till entiteten i befintlig utrustning.
- **Vid väntevillkor → 🎧 Lyssna efter status**: skapar villkoret "vänta tills X = det nya läget".

## Mobil

Panelen känner av sin bredd. På mobil flyttas flikarna till en meny längst ner, redigerare öppnas i helskärm, tabeller blir kort och flödesschemat får zoomknappar. Kopplingar kan också göras i utrustningens inställningar under *Kopplingar*, så du behöver inte dra pilar med fingret.

## Delad utrustning

Om Vardagsrum och Kök delar samma mixer gäller följande:

- Mixern startas när den första gruppen startar. Det som redan är igång hoppas över.
- Mixern stängs bara av när **ingen** annan grupp som använder den är igång.

## Per utrustning

- **Påslag och avstängning:** slå på/stäng av entiteterna, valfri tjänst med JSON-data, eller *ingen åtgärd*. Det sista passar passiva högtalare som bara ska synas i schemat.
- **Vänta efter påslag / avstängning** i sekunder.
- **Vänta tills …** en eller flera entiteter (eventuellt ett attribut) har ett visst värde, till exempel `sensor.slutsteg_status = ready`. Du väljer *alla* (X och Y) eller *något* (X eller Y), en maxtid, och om sekvensen ska fortsätta eller avbrytas när tiden går ut.
- **Prioritet:** *Alltid först* betyder att enheten startas före allt annat i samma körning och stängs av sist. *Alltid sist* betyder tvärtom. Prioritet påverkar bara ordningen. Den gör inte att enheten följer med i en grupp, det gör pilarna och gruppvalet.
- **Testa:** knappar för att slå på eller stänga av en enhet direkt.

## Status-LED per grupp

Välj en light- eller switch-entitet, t.ex. en GPIO-LED:

- **Långsam blinkning** medan sekvensen körs.
- **Fast sken** när allt startade eller stängdes av som det skulle. Släcks efter 30 min, och tiden går att ändra.
- **Snabb blinkning** vid fel. Fortsätter tills gruppen körs igen.

## Fjärrkontroller

- **Lyssna:** tryck på knappen inom 60 s och välj rätt rad. Det fungerar med ZHA, deCONZ, Hue, Z-Wave, Zigbee2MQTT (action-sensorer), event-entiteter och knappar.
- **Enhet:** välj enhet och knapp, på samma sätt som i HA:s automationsredigerare.
- **Entitet** eller **Händelse:** manuellt läge för avancerade fall.

## I Home Assistant

- `switch.<grupp>`: på startar gruppen och av stänger den. Attributen visar status, aktuellt steg, vad den väntar på och eventuella fel.
- Eventet `sequencer_event` (`type: started/finished`, `action: start/stop`, `zone_id`, `errors`).

## Installation

**Marketplace (HA 2026.11+):** Inställningar → Marketplace → *Add from link* → `karlandreasa/ha-sequencer` → installera → starta om. Lägg sedan till integrationen *Sequencer* under Enheter och tjänster.

Sekvenser från version 1 konverteras automatiskt till utrustning och grupper.
