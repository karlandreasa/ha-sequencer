"""Backend texts (errors, status shown in the panel, sidebar title).

Swedish is the source language; English is used unless Home Assistant's
language is Swedish. Keep EN in sync when adding texts (tools/i18n/check_backend.py).
"""

from __future__ import annotations

from typing import Any

EN: dict[str, str] = {
    "Sekvenser": "Sequences",
    "Sekvensstyrning": "Sequencer",
    "Alla": "All",
    "och": "and",
    "eller": "or",
    "något": "anything",
    "{label}: väntade för länge, fortsätter": "{label}: waited too long, continuing",
    "villkoret uppfylldes inte inom {timeout} s": "the condition was not met within {timeout} s",
    "Kunde inte starta utlösaren": "Could not start the trigger",
    "Gruppen finns inte längre": "The group no longer exists",
    "inga light-entiteter att dimma": "no light entities to dim",
    "DMX-släckning kräver att påslaget är DMX": "DMX turn-off requires turning on to be DMX",
    "ogiltig tjänst '{service}'": "invalid service '{service}'",
    "Moment": "Moment",
    "Windows svarade med felkod 0x{code}": "Windows responded with error code 0x{code}",
    "Ogiltig MAC-adress '{mac}'": "Invalid MAC address '{mac}'",
    "Kan inte tolka '{part}' – skriv t.ex. 1=255, 2-4=50%": "Cannot parse '{part}' – write e.g. 1=255, 2-4=50%",
    "Kanal utanför 1–512 i '{part}'": "Channel outside 1–512 in '{part}'",
    "Värde utanför 0–255 (0–100 %) i '{part}'": "Value outside 0–255 (0–100 %) in '{part}'",
    "Windows-avstängning kräver värd och användarnamn": "Windows shutdown requires host and user name",
    "Två utrustningar har samma id": "Two pieces of equipment have the same id",
    "Kopplingarna bildar en loop – något kan inte startas före sig självt": "The connections form a loop – something cannot start before itself",
    "Fjärrkontrollen '{name}' styr en grupp som inte finns": "The remote '{name}' controls a group that does not exist",
    "Sequencer är inte laddad": "Sequencer is not loaded",
    "Gruppen finns inte": "The group does not exist",
}


def is_swedish(language: str | None) -> bool:
    return (language or "").lower().startswith("sv")


def tr_lang(language: str | None, sv: str, **kwargs: Any) -> str:
    text = sv if is_swedish(language) else EN.get(sv, sv)
    return text.format(**kwargs) if kwargs else text


def tr(hass, sv: str, **kwargs: Any) -> str:
    """Translate using Home Assistant's configured language."""
    return tr_lang(getattr(getattr(hass, "config", None), "language", None), sv, **kwargs)


def translator(hass):
    """A tr(sv, **kw) callable bound to hass, for helpers without access to hass."""
    return lambda sv, **kw: tr(hass, sv, **kw)


def identity(sv: str, **kwargs: Any) -> str:
    return sv.format(**kwargs) if kwargs else sv
