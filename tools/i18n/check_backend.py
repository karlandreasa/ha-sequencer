#!/usr/bin/env python3
"""Check that every translatable backend text has an English entry in i18n.EN."""
import ast, pathlib, re, sys
ROOT = pathlib.Path(__file__).resolve().parents[2] / "custom_components/sequencer"
src_i18n = (ROOT / "i18n.py").read_text(encoding="utf-8")
EN = ast.literal_eval(re.search(r"EN: dict\[str, str\] = (\{.*?\n\})", src_i18n, re.S).group(1))
missing = set()
for py in ROOT.glob("*.py"):
    tree = ast.parse(py.read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            fn = node.func.id if isinstance(node.func, ast.Name) else getattr(node.func, "attr", "")
            args = node.args
            idx = {"tr": 1, "tr_lang": 1, "_t": 0}.get(fn)
            if fn == "tr" and args and isinstance(args[0], ast.Constant):  # translator-bound tr(sv, ...)
                idx = 0
            if idx is None or len(args) <= idx:
                continue
            a = args[idx]
            if isinstance(a, ast.Constant) and isinstance(a.value, str) and a.value not in EN:
                missing.add((py.name, a.value))
            if isinstance(a, ast.Name) and a.id == "PANEL_TITLE":
                pass
if missing:
    print("MISSING backend translations:")
    for f, s in sorted(missing):
        print(f"  {f}: {s!r}")
    sys.exit(1)
print(f"backend OK ({len(EN)} texts)")
