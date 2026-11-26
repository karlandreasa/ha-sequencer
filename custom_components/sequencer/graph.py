"""Pure graph logic (no Home Assistant imports, so it can be unit tested).

Model
-----
* nodes  – pieces of equipment. ``rank`` is "first" | "normal" | "last".
* edges  – ``{"from": A, "to": B}`` means *A is started before B and stopped after B*.
* zones  – groups. ``zone["nodes"]`` lists the equipment the zone needs; everything
  upstream of those (via edges) is included automatically.

Ranks add *implicit* ordering only (they never pull equipment into a zone):
"first" nodes start before every other node in the same run, "last" nodes after.
"""

from __future__ import annotations

import heapq
from typing import Any

RANK_ORDER = {"first": 0, "normal": 1, "last": 2}


def node_map(cfg: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {n["id"]: n for n in cfg.get("nodes", [])}


def parents_map(cfg: dict[str, Any]) -> dict[str, set[str]]:
    nodes = node_map(cfg)
    parents: dict[str, set[str]] = {nid: set() for nid in nodes}
    for edge in cfg.get("edges", []):
        if edge["from"] in nodes and edge["to"] in nodes and edge["from"] != edge["to"]:
            parents[edge["to"]].add(edge["from"])
    return parents


def _descendants(children: dict[str, set[str]], start: str) -> set[str]:
    seen: set[str] = set()
    stack = [start]
    while stack:
        cur = stack.pop()
        for nxt in children.get(cur, ()):
            if nxt not in seen:
                seen.add(nxt)
                stack.append(nxt)
    return seen


def has_cycle(cfg: dict[str, Any]) -> bool:
    parents = parents_map(cfg)
    children: dict[str, set[str]] = {n: set() for n in parents}
    for child, ps in parents.items():
        for p in ps:
            children[p].add(child)
    return any(n in _descendants(children, n) for n in parents)


def closure(cfg: dict[str, Any], zone_ids) -> set[str]:
    """All equipment needed by the given zones (members + everything upstream)."""
    zones = {z["id"]: z for z in cfg.get("zones", [])}
    parents = parents_map(cfg)
    out: set[str] = set()
    stack = [nid for zid in zone_ids for nid in zones.get(zid, {}).get("nodes", []) if nid in parents]
    while stack:
        nid = stack.pop()
        if nid in out:
            continue
        out.add(nid)
        stack.extend(parents[nid])
    return out


def order(cfg: dict[str, Any]) -> list[str]:
    """Global start order. Stop order is the reverse.

    Explicit edges are always respected. Ranks add implicit edges
    (lower rank before higher rank) unless that would contradict an explicit edge.
    Ties are broken by position in the diagram (left to right, top to bottom).
    """
    nodes = node_map(cfg)
    parents = parents_map(cfg)
    children: dict[str, set[str]] = {n: set() for n in nodes}
    for child, ps in parents.items():
        for p in ps:
            children[p].add(child)

    rank = {nid: RANK_ORDER.get(n.get("rank") or "normal", 1) for nid, n in nodes.items()}
    # Implicit rank edges a -> b where rank(a) < rank(b), added one at a time and
    # skipped if it would create a cycle (explicit edges always win).
    all_children = {nid: set(ch) for nid, ch in children.items()}
    for a in nodes:
        for b in nodes:
            if a != b and rank[a] < rank[b] and b not in all_children[a]:
                if a not in _descendants(all_children, b):
                    all_children[a].add(b)

    indeg = {nid: 0 for nid in nodes}
    for a, chs in all_children.items():
        for b in chs:
            indeg[b] += 1

    def key(nid: str):
        n = nodes[nid]
        return (rank[nid], float(n.get("x", 0)), float(n.get("y", 0)), n.get("name", ""), nid)

    heap = [(key(nid), nid) for nid, d in indeg.items() if d == 0]
    heapq.heapify(heap)
    out: list[str] = []
    while heap:
        _, nid = heapq.heappop(heap)
        out.append(nid)
        for c in all_children[nid]:
            indeg[c] -= 1
            if indeg[c] == 0:
                heapq.heappush(heap, (key(c), c))
    # Should not happen (cycles are rejected on save), but never drop nodes.
    out.extend(sorted((n for n in nodes if n not in out), key=key))
    return out


# ------------------------------------------------------------------ sequences
# A zone ("grupp" or a standalone "sekvens") runs either the automatic sequence
# (derived from rules + group members) or a custom one: zone["custom"] =
# {"start": [step], "stop": [step], "base_start": [...], "base_stop": [...]}
# step = {"node": id, "delay": float | None (None = equipment default), "force": bool}
#   or a free "moment" not tied to equipment or rules:
#        {"kind": "action", "id", "name", "entities", "spec": {...}, "wait": {...}, "delay"}
# Moments can also be added to an *automatic* sequence without freezing it:
# zone["extras"] = {"start": [{"after": node id | None, "step": moment}], "stop": [...]}


def is_moment(step: dict[str, Any]) -> bool:
    return step.get("kind") == "action"


def merge_extras(base: list[dict[str, Any]], extras: list[dict[str, Any]]) -> list[dict[str, Any]]:
    anchors = {s.get("node") for s in base}
    out = [e["step"] for e in extras if not e.get("after")]
    for step in base:
        out.append(step)
        out.extend(e["step"] for e in extras if e.get("after") and e["after"] == step.get("node"))
    out.extend(e["step"] for e in extras if e.get("after") and e["after"] not in anchors)
    return out


def _zone(cfg: dict[str, Any], zone_id: str) -> dict[str, Any] | None:
    return next((z for z in cfg.get("zones", []) if z["id"] == zone_id), None)


def custom_of(cfg: dict[str, Any], zone_id: str) -> dict[str, Any] | None:
    zone = _zone(cfg, zone_id)
    return (zone or {}).get("custom") or None


def auto_start(cfg: dict[str, Any], zone_id: str) -> list[str]:
    needed = closure(cfg, [zone_id])
    return [n for n in order(cfg) if n in needed]


def auto_stop(cfg: dict[str, Any], zone_id: str) -> list[str]:
    return list(reversed(auto_start(cfg, zone_id)))


def zone_needs(cfg: dict[str, Any], zone_id: str) -> set[str]:
    """Equipment a zone keeps running while it is active."""
    nodes = node_map(cfg)
    custom = custom_of(cfg, zone_id)
    if custom:
        return {s["node"] for s in custom.get("start", []) if not is_moment(s) and s.get("node") in nodes}
    return closure(cfg, [zone_id])


def needs_of(cfg: dict[str, Any], zone_ids) -> set[str]:
    out: set[str] = set()
    for zid in zone_ids:
        out |= zone_needs(cfg, zid)
    return out


def start_steps(cfg: dict[str, Any], zone_id: str) -> list[dict[str, Any]]:
    nodes = node_map(cfg)
    custom = custom_of(cfg, zone_id)
    if custom:
        return [s for s in custom.get("start", []) if is_moment(s) or s.get("node") in nodes]
    extras = ((_zone(cfg, zone_id) or {}).get("extras") or {}).get("start", [])
    return merge_extras([{"node": n} for n in auto_start(cfg, zone_id)], extras)


def stop_steps(cfg: dict[str, Any], zone_id: str | None, active_zones) -> list[dict[str, Any]]:
    """Steps to run when ``zone_id`` stops (None = everything).

    Equipment still needed by another active zone is skipped, unless the step is
    marked "force" (stäng alltid av).
    """
    nodes = node_map(cfg)
    keep = needs_of(cfg, [z for z in active_zones if z != zone_id])
    if zone_id is None:
        steps = [{"node": n} for n in reversed(order(cfg))]
    else:
        custom = custom_of(cfg, zone_id)
        if custom:
            steps = custom.get("stop", [])
        else:
            extras = ((_zone(cfg, zone_id) or {}).get("extras") or {}).get("stop", [])
            steps = merge_extras([{"node": n} for n in auto_stop(cfg, zone_id)], extras)
    return [
        s for s in steps
        if is_moment(s) or (s.get("node") in nodes and (s.get("force") or s["node"] not in keep))
    ]


def start_sequence(cfg: dict[str, Any], zone_id: str) -> list[str]:
    return [s["node"] for s in start_steps(cfg, zone_id) if not is_moment(s)]


def stop_sequence(cfg: dict[str, Any], zone_id: str | None, active_zones) -> list[str]:
    return [s["node"] for s in stop_steps(cfg, zone_id, active_zones) if not is_moment(s)]


# --------------------------------------------------------------------- migration
def migrate_v1(old: dict[str, Any]) -> dict[str, Any]:
    """Convert version 1 (linear step lists) to the graph model."""
    cfg: dict[str, Any] = {"nodes": [], "edges": [], "zones": [], "remotes": []}
    colors = ["#2196f3", "#e91e63", "#4caf50", "#ff9800", "#9c27b0", "#00bcd4"]
    for row, seq in enumerate(old.get("sequences", [])):
        steps = seq.get("start_steps", [])
        prev_id = None
        prev_delay = 0.0
        for col, step in enumerate(steps):
            nid = f"{seq['id']}_{step.get('id') or col}"
            action = step.get("action", "turn_on")
            if action == "service":
                on = {"action": "service", "service": step.get("service", ""), "data": step.get("data") or {}}
                off = {"action": "none"}
            elif action == "turn_off":
                on = {"action": "service", "service": "homeassistant.turn_off", "data": {}}
                off = {"action": "service", "service": "homeassistant.turn_on", "data": {}}
            else:
                on = {"action": "turn_on", "data": step.get("data") or {}}
                off = {"action": "turn_off"}
            cfg["nodes"].append(
                {
                    "id": nid,
                    "name": step.get("name") or f"Steg {col + 1}",
                    "image": "generic",
                    "entities": step.get("entities", []),
                    "on": on,
                    "off": off,
                    "delay_on": float(step.get("delay") or 0),
                    # In v1 "reverse" mode the gap before a step was reused after it.
                    "delay_off": prev_delay,
                    "rank": "normal",
                    "wait_on": None,
                    "wait_off": None,
                    "x": 40 + col * 220,
                    "y": 40 + row * 180,
                }
            )
            if prev_id:
                cfg["edges"].append({"from": prev_id, "to": nid})
            prev_id = nid
            prev_delay = float(step.get("delay") or 0)
        cfg["zones"].append(
            {
                "id": seq["id"],
                "name": seq.get("name", "Grupp"),
                "icon": seq.get("icon", ""),
                "color": colors[row % len(colors)],
                "nodes": [prev_id] if prev_id else [],
            }
        )
    return cfg
