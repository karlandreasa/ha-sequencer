# Sequencer – sekvensstyrning för Home Assistant

Lägger till fliken **Sekvenser** i sidomenyn. Där ritar du upp din anläggning, till exempel mixer → DSP → slutsteg, och delar in den i grupper som rum eller zoner. Sedan startar och stänger du grupperna i rätt ordning, från panelen, från en switch eller direkt från en fjärrkontroll. Inga automationer behövs.

## Flikar

| Flik | Vad du gör där |
|---|---|
| **Styrning** | Starta och stäng av grupper och sekvenser, "Stäng av allt" och live-schema över vad som är igång. |
| **Utrustning & regler** | *Schema:* lägg till utrustning med en bild och dra pilar mellan enheterna. En pil betyder **startas före** och **stängs av efter**. *Regler:* samma ordning i textform, plus prioritet (alltid först / alltid sist), fördröjningar och väntevillkor. Reglerna gäller hela anläggningen. |
| **Grupper** | Välj vilken utrustning en grupp behöver. Det som krävs före tas med automatiskt. Här väljer du också gruppens status-LED. |
| **Sekvenser** | Varje grupp får en sekvens automatiskt. Den kan justeras för hand, och du kan också göra egna sekvenser helt utan grupper. Se nedan. |
| **Fjärrkontroller** | Koppla knappar till grupper och sekvenser med åtgärden *Starta*, *Stäng av* eller *Växla*. Lyssna-läget hittar knappen åt dig. |

## Sekvenser

- **Automatisk:** byggs av reglerna och gruppens utrustning och följer med när något ändras.
- **Moment** (ljus/färg, paus, vänta tills …, DMX-scen, tjänst, slå på/av en entitet) läggs in var du vill. Moment följer inga regler och ger aldrig varningar. I en automatisk sekvens låser de inte heller sekvensen, utan den fortsätter att följa reglerna.
- **Anpassad** (🟡): när du flyttar, tar bort eller lägger till utrustning eller ändrar en fördröjning blir sekvensen anpassad, och den uppdateras då inte längre av sig själv. *Återställ till automatisk* finns alltid.
- **Gruppen har ändrats** (🟠): om gruppen eller reglerna ändras efter att du anpassat sekvensen ser du vad som saknas. Du kan välja *Lägg till saknade på föreslagen plats*, *Behåll min version* eller *Återställ*.
- **⚠ Varning** visas **bara** när din ordning bryter mot en regel, t.ex. slutsteg före mixer. Sekvensen körs ändå i din ordning.
- **Kör på ändå:** det som redan är igång, t.ex. mixern från ett annat rum, hoppas över, inklusive dess väntan och fördröjning.
- **Delad utrustning** hoppas över vid avstängning om en annan grupp eller sekvens som är igång använder den, utom när steget är markerat *stäng alltid av*.

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

## Typer av utrustning

Varje utrustning har ett *påslag* och en *avstängning*:

| Åtgärd | Används till |
|---|---|
| **Slå på / Stäng av** | Switchar, uttag, mediaspelare och liknande. |
| **Tänd / dimma ljus** | Ljusstyrka, övergång (direkt, snabbt, mjukt, långsamt eller egen tid) och färg eller färgtemperatur. Gäller light-entiteter. Du kan välja att vänta tills övergången är klar innan nästa steg. |
| **Wake on LAN** | Startar en dator med MAC-adress och eventuell broadcast-adress. Lägg gärna till en ping-sensor som entitet, så syns status och du kan vänta på att datorn är uppe. |
| **Stäng av Windows-dator (RPC)** | Samma protokoll som `shutdown /s /m \\dator`. Kräver ett administratörskonto, att *Fil- och skrivardelning* är tillåten i brandväggen och, för lokala konton, `LocalAccountTokenFilterPolicy=1`. Ett hjälpbibliotek (impacket) installeras automatiskt första gången funktionen används. |
| **DMX** | Art-Net eller sACN (E1.31) direkt till en DMX-nod i nätverket. Kanaler skrivs som `1=255, 2-4=50%`, och du väljer fade-tid. Avstängningen *släck samma kanaler* fadar ner det som tändes. Om du redan har DMX-lampor som light-entiteter i HA kan du använda *Tänd / dimma ljus* i stället. |
| **Tjänst** | Valfri HA-tjänst med JSON-data. |

Det finns bilder för bland annat mixer, slutsteg, DSP, högtalare, ljusbord, strålkastare, PAR-lampa, moving head, dimmerrack, DMX-nod, kors, dator och projektor.

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

`switch.<namn>` skapas för både grupper och egna sekvenser.

Sekvenser från version 1 konverteras automatiskt till utrustning och grupper.

## Tredjepart och erkännanden

- **Art-Net™** Designed by and Copyright Artistic Licence Engineering Ltd. Sequencer skickar ArtDmx-paket enligt den publicerade, royaltyfria specifikationen.
- **sACN / ANSI E1.31** är en öppen standard från ESTA.
- **Windows-avstängning** använder protokollet [MS-RSP], som Microsoft har publicerat som en Open Specification. Funktionen använder biblioteket **[Impacket](https://github.com/fortra/impacket)** ("This product includes software developed by SecureAuth Corporation"). Impacket ingår inte i det här repot. Home Assistant installerar det från PyPI först när funktionen används, och då gäller Impackets egen licens (en modifierad Apache Software License 1.1).
- Bilderna på utrustning är egna, enkla SVG-ritningar.
