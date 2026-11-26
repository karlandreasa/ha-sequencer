#!/usr/bin/env python3
"""Inject tools/i18n/en.json into the panel and check that every T("…") has an English entry.

Usage: python3 tools/i18n/build.py          (inject + check, exit 1 on missing)
Swedish is the source language; add new strings to en.json as {"svensk text": "English text"}.
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
PANEL = ROOT / "custom_components/sequencer/frontend/sequencer-panel.js"
EN = pathlib.Path(__file__).with_name("en.json")

en = json.loads(EN.read_text(encoding="utf-8"))
src = PANEL.read_text(encoding="utf-8")

# 1. every literal T("…") key must have an English translation
keys = set()
for m in re.finditer(r'\bT\(\s*("(?:[^"\\]|\\.)*")', src):
    keys.add(json.loads(m.group(1)))
# label tables that are translated at render time
for table in ("IMAGES", "RANK_LABEL", "ZONE_ACTION_LABEL", "MOMENT_TYPES"):
    m = re.search(rf"const {table} = (.*?);\n(?=\S)", src, re.S)
    if m:
        keys.update(json.loads(s) for s in re.findall(r'\[\s*"[^"]*",\s*("(?:[^"\\]|\\.)*")', m.group(1)))
        keys.update(json.loads(s) for s in re.findall(r'\w+:\s*("(?:[^"\\]|\\.)*")', m.group(1)))
        keys.update(json.loads(s) for s in re.findall(r'^\s*\w+:\s*\[("(?:[^"\\]|\\.)*")', m.group(1), re.M))
missing = sorted(k for k in keys if k not in en)
unused = sorted(k for k in en if k not in keys)

# 2. inject
block = "/*EN_DICT*/" + json.dumps(dict(sorted(en.items())), ensure_ascii=False, indent=1) + "/*END_EN_DICT*/"
src2 = re.sub(r"/\*EN_DICT\*/.*?/\*END_EN_DICT\*/", lambda _: block, src, flags=re.S)
PANEL.write_text(src2, encoding="utf-8")

print(f"{len(keys)} strings, {len(en)} translations")
if unused:
    print(f"note: {len(unused)} unused translations (dynamic keys are fine)")
if missing:
    print("MISSING English translations:")
    for k in missing:
        print("  ", json.dumps(k, ensure_ascii=False))
    sys.exit(1)
