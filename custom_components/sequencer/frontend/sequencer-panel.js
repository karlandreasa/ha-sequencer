/* Sequencer – sidebar panel for Home Assistant (plain web component, no build step). */

const VERSION = "2.1.0";
const ALL = "__all__";
const OFF = ["off", "unavailable", "unknown", "standby"];
const NODE_W = 150;
const NODE_H = 104;
const GRID = 20;
const ZONE_COLORS = ["#2196f3", "#e91e63", "#4caf50", "#ff9800", "#9c27b0", "#00bcd4", "#795548", "#607d8b"];

const IMG = (body) =>
  `<svg viewBox="0 0 64 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const IMAGES = {
  mixer: ["Mixer", IMG(`<rect x="3" y="10" width="58" height="30" rx="3"/><path d="M13 16v18M24 16v18M35 16v18M46 16v18"/><rect x="10" y="26" width="6" height="4" rx="1" fill="currentColor"/><rect x="21" y="19" width="6" height="4" rx="1" fill="currentColor"/><rect x="32" y="29" width="6" height="4" rx="1" fill="currentColor"/><rect x="43" y="22" width="6" height="4" rx="1" fill="currentColor"/><circle cx="55" cy="18" r="2.5"/><circle cx="55" cy="28" r="2.5"/>`)],
  amp: ["Slutsteg", IMG(`<rect x="3" y="12" width="58" height="24" rx="2"/><circle cx="14" cy="24" r="5"/><path d="M14 24l2.5-3"/><circle cx="28" cy="24" r="5"/><path d="M28 24l2.5-3"/><path d="M40 18v12M44 18v12M48 18v12"/><circle cx="56" cy="24" r="1.8" fill="currentColor"/><path d="M7 36v4M57 36v4"/>`)],
  dsp: ["DSP / processor", IMG(`<rect x="3" y="14" width="58" height="20" rx="2"/><rect x="8" y="19" width="20" height="10" rx="1"/><path d="M11 26l3-4 3 3 3-5 3 4"/><circle cx="36" cy="24" r="2"/><circle cx="43" cy="24" r="2"/><circle cx="50" cy="24" r="2"/><circle cx="56.5" cy="24" r="1.5" fill="currentColor"/>`)],
  receiver: ["Receiver", IMG(`<rect x="3" y="12" width="58" height="26" rx="2"/><rect x="8" y="17" width="26" height="7" rx="1"/><circle cx="49" cy="25" r="7"/><circle cx="49" cy="25" r="2"/><path d="M8 31h4M15 31h4M22 31h4M29 31h4"/>`)],
  speaker: ["Högtalare", IMG(`<rect x="18" y="2" width="28" height="44" rx="3"/><circle cx="32" cy="12" r="4"/><circle cx="32" cy="31" r="9"/><circle cx="32" cy="31" r="3"/>`)],
  sub: ["Subwoofer", IMG(`<rect x="8" y="6" width="48" height="38" rx="3"/><circle cx="32" cy="25" r="14"/><circle cx="32" cy="25" r="5"/>`)],
  ceiling: ["Takhögtalare", IMG(`<circle cx="32" cy="24" r="19"/><circle cx="32" cy="24" r="12"/><path d="M26 24h12M32 18v12"/>`)],
  power: ["Strömfördelare", IMG(`<rect x="3" y="14" width="58" height="20" rx="2"/><circle cx="14" cy="24" r="5"/><circle cx="28" cy="24" r="5"/><path d="M12.5 24h.01M15.5 24h.01M26.5 24h.01M29.5 24h.01"/><path d="M50 19v5"/><path d="M46.5 21.5a5 5 0 1 0 7 0"/>`)],
  streamer: ["Streamer / spelare", IMG(`<rect x="6" y="14" width="52" height="22" rx="4"/><path d="M24 19v12l10-6z"/><path d="M42 21a6 6 0 0 1 0 8M46 18a10 10 0 0 1 0 14"/>`)],
  mic: ["Mikrofon", IMG(`<rect x="25" y="3" width="14" height="24" rx="7"/><path d="M19 21a13 13 0 0 0 26 0M32 34v9M24 44h16"/>`)],
  tv: ["TV / skärm", IMG(`<rect x="6" y="5" width="52" height="30" rx="2"/><path d="M24 43h16M32 35v8"/>`)],
  projector: ["Projektor", IMG(`<rect x="6" y="16" width="52" height="20" rx="4"/><circle cx="20" cy="26" r="6"/><circle cx="20" cy="26" r="2"/><path d="M34 22h16M34 27h16M34 32h10M12 36v4M52 36v4"/>`)],
  network: ["Nätverk", IMG(`<rect x="3" y="16" width="58" height="16" rx="2"/><path d="M8 21h5v6H8zM16 21h5v6h-5zM24 21h5v6h-5zM32 21h5v6h-5zM40 21h5v6h-5z"/><circle cx="54" cy="24" r="1.8" fill="currentColor"/>`)],
  light: ["Ljus", IMG(`<path d="M24 6h16l6 18H18z"/><path d="M32 24v12M24 42h16"/>`)],
  generic: ["Övrigt", IMG(`<rect x="10" y="10" width="44" height="28" rx="4"/><path d="M32 16v8"/><path d="M26 19.5a8 8 0 1 0 12 0"/>`)],
};

const RANK_LABEL = { first: "Alltid först", normal: "Normal", last: "Alltid sist" };
const ZONE_ACTION_LABEL = { start: "Starta", stop: "Stäng av", toggle: "Växla på/av" };

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const uid = () => Math.random().toString(36).slice(2, 12);
const clone = (o) => JSON.parse(JSON.stringify(o));
const fmtSec = (s) => {
  const n = Number(s) || 0;
  return (Number.isInteger(n) ? `${n}` : n.toFixed(1)).replace(".", ",");
};
const snap = (v) => Math.max(0, Math.round(v / GRID) * GRID);
const pretty = (s) => String(s ?? "").replace(/_/g, " ");
const ENTITY_RE = /^[a-z0-9_]+\.[a-z0-9_]+$/;

/* ------------------------------------------------------------ graph helpers */
function parentsMap(cfg) {
  const p = {};
  cfg.nodes.forEach((n) => (p[n.id] = []));
  cfg.edges.forEach((e) => { if (p[e.to] && p[e.from] && e.to !== e.from) p[e.to].push(e.from); });
  return p;
}
function childrenMap(cfg) {
  const c = {};
  cfg.nodes.forEach((n) => (c[n.id] = []));
  cfg.edges.forEach((e) => { if (c[e.from] && c[e.to]) c[e.from].push(e.to); });
  return c;
}
function descendants(children, start) {
  const seen = new Set(); const stack = [start];
  while (stack.length) for (const n of children[stack.pop()] || []) if (!seen.has(n)) { seen.add(n); stack.push(n); }
  return seen;
}
function closure(cfg, zoneIds) {
  const parents = parentsMap(cfg); const out = new Set(); const stack = [];
  for (const z of cfg.zones) if (zoneIds.includes(z.id)) stack.push(...z.nodes.filter((n) => parents[n]));
  while (stack.length) { const n = stack.pop(); if (out.has(n)) continue; out.add(n); stack.push(...parents[n]); }
  return out;
}
const RANK_N = { first: 0, normal: 1, last: 2 };
function order(cfg) {
  const nodes = Object.fromEntries(cfg.nodes.map((n) => [n.id, n]));
  const ch = childrenMap(cfg);
  const all = Object.fromEntries(Object.entries(ch).map(([k, v]) => [k, new Set(v)]));
  const rank = (id) => RANK_N[nodes[id].rank || "normal"] ?? 1;
  const ids = Object.keys(nodes);
  for (const a of ids) for (const b of ids) {
    if (a !== b && rank(a) < rank(b) && !all[a].has(b) && !descendants(Object.fromEntries(Object.entries(all).map(([k, v]) => [k, [...v]])), b).has(a)) all[a].add(b);
  }
  const indeg = Object.fromEntries(ids.map((i) => [i, 0]));
  for (const a of ids) for (const b of all[a]) indeg[b]++;
  const key = (id) => [rank(id), Number(nodes[id].x) || 0, Number(nodes[id].y) || 0, nodes[id].name || "", id];
  const cmp = (a, b) => { const ka = key(a), kb = key(b); for (let i = 0; i < ka.length; i++) { if (ka[i] < kb[i]) return -1; if (ka[i] > kb[i]) return 1; } return 0; };
  let ready = ids.filter((i) => indeg[i] === 0).sort(cmp); const out = [];
  while (ready.length) {
    const n = ready.shift(); out.push(n);
    for (const c of all[n]) if (--indeg[c] === 0) ready.push(c);
    ready.sort(cmp);
  }
  for (const i of ids) if (!out.includes(i)) out.push(i);
  return out;
}
function wouldCycle(cfg, from, to) {
  if (from === to) return true;
  return descendants(childrenMap(cfg), to).has(from);
}
function guessImage(c) {
  const t = `${c.entity_id} ${c.name || ""}`.toLowerCase();
  const rules = [[/mixer|mixerbord/, "mixer"], [/slutsteg|amp|förstärk|forstark/, "amp"], [/dsp|processor/, "dsp"], [/receiver|reciever/, "receiver"],
    [/sub/, "sub"], [/tak|ceiling/, "ceiling"], [/högtal|hogtal|speaker/, "speaker"], [/projekt/, "projector"], [/tv|skärm|display|monitor/, "tv"],
    [/mic|mikrofon/, "mic"], [/switch|nätverk|router|poe/, "network"], [/stream|sonos|spelare|player|chromecast|apple/, "streamer"],
    [/uttag|plug|ström|power|socket|grenuttag/, "power"]];
  for (const [re, img] of rules) if (re.test(t)) return img;
  if (c.domain === "light") return "light";
  if (c.domain === "media_player") return "streamer";
  return "generic";
}
const entityBased = (n) => (n.entities || []).length > 0 && ((n.on || {}).action || "turn_on") === "turn_on";

/* ------------------------------------------------------------------- styles */
const STYLE = `
:host { display:block; min-height:100vh; background:var(--primary-background-color); color:var(--primary-text-color);
  font-family:var(--ha-font-family-body, Roboto, sans-serif); --ok:var(--success-color,#43a047); --warn:var(--warning-color,#ffa600); --err:var(--error-color,#db4437); }
.toolbar { display:flex; align-items:center; height:var(--header-height,56px); padding:0 12px; box-sizing:border-box;
  background:var(--app-header-background-color, var(--primary-color)); color:var(--app-header-text-color,#fff); font-size:20px; gap:8px; }
.toolbar .title { flex:1; margin-left:8px; }
.tabs { display:flex; gap:4px; padding:0 12px; overflow-x:auto; background:var(--app-header-background-color, var(--primary-color)); }
.tab { color:var(--app-header-text-color,#fff); opacity:.75; background:none; border:none; border-bottom:3px solid transparent;
  border-radius:0; padding:10px 14px; font-size:14px; white-space:nowrap; cursor:pointer; }
.tab:hover { background:rgba(255,255,255,.12); }
.tab.sel { opacity:1; border-bottom-color:var(--app-header-text-color,#fff); }
.content { max-width:1000px; margin:0 auto; padding:16px; box-sizing:border-box; padding-bottom:90px; }
.content.wide { max-width:1400px; }
.card { background:var(--card-background-color,#fff); border-radius:var(--ha-card-border-radius,12px);
  box-shadow:var(--ha-card-box-shadow,none); border:1px solid var(--divider-color,#e0e0e0); padding:16px; margin-bottom:16px; box-sizing:border-box; }
.card.pad0 { padding:0; overflow:hidden; }
h2 { font-size:18px; font-weight:500; margin:8px 0 12px; }
h3 { font-size:15px; font-weight:500; margin:18px 0 8px; }
.row-between { display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; }
button { font:inherit; font-size:14px; border-radius:8px; padding:8px 14px; cursor:pointer;
  border:1px solid var(--divider-color,#ccc); background:transparent; color:var(--primary-text-color); }
button:hover { background:var(--secondary-background-color, rgba(0,0,0,.05)); }
button.primary { background:var(--primary-color); color:var(--text-primary-color,#fff); border-color:var(--primary-color); }
button.danger { color:var(--err); border-color:var(--err); }
button.icon { padding:4px 8px; border:none; }
button.small { padding:4px 10px; font-size:13px; }
button:disabled { opacity:.4; cursor:default; }
label { display:flex; flex-direction:column; font-size:12px; color:var(--secondary-text-color); gap:4px; }
.lbl { font-size:12px; color:var(--secondary-text-color); margin:14px 0 6px; font-weight:500; text-transform:uppercase; letter-spacing:.04em; }
input, select, textarea { font:inherit; font-size:14px; padding:7px 8px; border-radius:6px; box-sizing:border-box;
  border:1px solid var(--divider-color,#ccc); background:var(--card-background-color); color:var(--primary-text-color); }
textarea { font-family:monospace; min-height:54px; width:100%; }
input[type=checkbox], input[type=radio] { width:auto; }
.row { display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end; margin-bottom:8px; }
.grow { flex:1; min-width:160px; }
.hint { font-size:13px; color:var(--secondary-text-color); line-height:1.45; }
.empty { text-align:center; color:var(--secondary-text-color); padding:28px 16px; line-height:1.6; }
.btns { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
.badge { font-size:12px; padding:3px 10px; border-radius:12px; background:var(--divider-color,#ddd); white-space:nowrap; }
.badge.on { background:var(--ok); color:#fff; } .badge.busy { background:var(--warn); color:#fff; }
.err { color:var(--err); font-size:13px; }

/* zones on control tab */
.zone-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:12px; margin-bottom:20px; }
.zone-card { border-left:5px solid var(--zc); margin:0; cursor:default; }
.zone-card.hl { box-shadow:0 0 0 2px var(--zc); }
.zc-head { display:flex; align-items:center; gap:10px; }
.zc-head ha-icon { color:var(--zc); }
.zc-name { flex:1; font-weight:500; font-size:16px; }
.led { width:12px; height:12px; border-radius:50%; background:var(--divider-color,#ccc); flex:none; }
.led[data-mode="on"] { background:var(--ok); box-shadow:0 0 8px var(--ok); }
.led[data-mode="slow"] { background:var(--ok); animation:blink 1.4s steps(1) infinite; }
.led[data-mode="fast"] { background:var(--err); animation:blink .36s steps(1) infinite; }
@keyframes blink { 50% { opacity:.15; } }
.zc-info { font-size:13px; color:var(--secondary-text-color); margin-top:6px; min-height:18px; }

/* diagram */
.dg-scroll { overflow:auto; max-height:70vh; background:
  radial-gradient(circle, var(--divider-color,#ddd) 1px, transparent 1px) 0 0/20px 20px; }
.canvas { position:relative; transform-origin:0 0; }
.sizer { position:relative; }
.canvas svg.edges { position:absolute; inset:0; overflow:visible; pointer-events:none; }
.edge { fill:none; stroke:var(--secondary-text-color); stroke-width:2; opacity:.55; }
.edge.active { stroke:var(--ok); opacity:1; stroke-dasharray:7 5; animation:flow 0.8s linear infinite; }
.edge.sel { stroke:var(--primary-color); stroke-width:3.5; opacity:1; }
.arrow { fill:var(--secondary-text-color); opacity:.55; } .arrow.active { fill:var(--ok); opacity:1; } .arrow.sel { fill:var(--primary-color); opacity:1; }
.edge-hit { fill:none; stroke:transparent; stroke-width:14; pointer-events:stroke; cursor:pointer; }
.tmp-edge { fill:none; stroke:var(--primary-color); stroke-width:2; stroke-dasharray:4 4; }
@keyframes flow { to { stroke-dashoffset:-12; } }
.node { position:absolute; width:${NODE_W}px; height:${NODE_H}px; box-sizing:border-box; border-radius:12px;
  background:var(--card-background-color,#fff); border:2px solid var(--divider-color,#ccc); display:flex; flex-direction:column;
  align-items:center; justify-content:center; padding:6px; text-align:center; user-select:none; transition:border-color .2s, box-shadow .2s; }
.editable .node { cursor:grab; touch-action:none; }
.node .img { width:56px; height:42px; color:var(--secondary-text-color); }
.node .img ha-icon { --mdc-icon-size:38px; }
.node .nname { font-size:13px; font-weight:500; line-height:1.2; margin-top:4px; max-height:32px; overflow:hidden; }
.node .nsub { font-size:11px; color:var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
.node.st-on { border-color:var(--ok); box-shadow:0 0 10px color-mix(in srgb, var(--ok) 45%, transparent); }
.node.st-on .img { color:var(--ok); }
.node.st-partial { border-color:var(--warn); border-style:dashed; }
.node.st-starting, .node.st-stopping { border-color:var(--warn); animation:pulse 1s ease-in-out infinite; }
.node.st-starting .img, .node.st-stopping .img { color:var(--warn); }
@keyframes pulse { 50% { box-shadow:0 0 16px color-mix(in srgb, var(--warn) 70%, transparent); } }
.node.dim { opacity:.35; }
.node.hl { outline:3px solid var(--hlc); outline-offset:3px; }
.node.sel { outline:3px solid var(--primary-color); outline-offset:3px; }
.node .dots { position:absolute; top:5px; right:6px; display:flex; gap:3px; }
.node .dot { width:9px; height:9px; border-radius:50%; }
.node .rank { position:absolute; top:4px; left:7px; font-size:10px; color:var(--secondary-text-color); }
.port { position:absolute; top:50%; width:16px; height:16px; margin-top:-8px; border-radius:50%; background:var(--card-background-color);
  border:2px solid var(--primary-color); box-sizing:border-box; }
.port-in { left:-9px; pointer-events:none; }
.port-out { right:-9px; cursor:crosshair; touch-action:none; }
.port-out:hover { background:var(--primary-color); }

/* layout */
.flow-layout { display:flex; gap:16px; align-items:flex-start; }
.flow-layout > .grow { min-width:0; }
.side { width:360px; flex:none; max-height:calc(100vh - 140px); overflow:auto; position:sticky; top:12px; }
.side-left { width:280px; flex:none; }
@media (max-width: 900px) { .flow-layout { flex-direction:column; align-items:stretch; } .side, .side-left { width:auto; position:static; max-height:none; } }
.side-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; font-size:16px; }
.tools { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:12px; }

.img-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:6px; }
.img-opt { padding:4px; display:flex; flex-direction:column; align-items:center; font-size:10px; gap:2px; color:var(--secondary-text-color); }
.img-opt svg { width:40px; height:30px; }
.img-opt.sel { border-color:var(--primary-color); color:var(--primary-color); background:color-mix(in srgb, var(--primary-color) 10%, transparent); }
.chips { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
.chip { display:inline-flex; align-items:center; gap:4px; background:var(--secondary-background-color,#eee); border-radius:16px; padding:3px 4px 3px 10px; font-size:13px; }
.chip button { border:none; padding:0 6px; font-size:16px; line-height:1; }
.chips input { flex:1; min-width:180px; }
details { margin-top:8px; } summary { cursor:pointer; font-size:13px; color:var(--secondary-text-color); padding:4px 0; }
.cond { display:flex; gap:6px; align-items:center; margin:6px 0; flex-wrap:wrap; }
.cond input { min-width:0; } .cond input[data-cf="entity_id"] { flex:1 1 100%; }

.list-item { display:flex; align-items:center; gap:10px; padding:10px; border-radius:8px; cursor:pointer; }
.list-item:hover { background:var(--secondary-background-color); }
.list-item.sel { background:color-mix(in srgb, var(--primary-color) 12%, transparent); }
.list-item .sw { width:12px; height:12px; border-radius:50%; flex:none; }
.list-item .t { flex:1; min-width:0; } .list-item .t small { display:block; color:var(--secondary-text-color); font-size:12px; }
.swatches { display:flex; gap:8px; flex-wrap:wrap; }
.swatch { width:28px; height:28px; border-radius:50%; padding:0; border:3px solid transparent; }
.swatch.sel { border-color:var(--primary-text-color); }
.pick-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:8px; }
.pick { flex-direction:row; align-items:center; gap:8px; border:1px solid var(--divider-color); border-radius:8px; padding:6px 8px; color:var(--primary-text-color); font-size:13px; cursor:pointer; }
.pick svg { width:32px; height:24px; flex:none; color:var(--secondary-text-color); }
.pick.on { border-color:var(--primary-color); background:color-mix(in srgb, var(--primary-color) 10%, transparent); }
.pick.auto { border-style:dashed; }
.pick small { display:block; color:var(--secondary-text-color); font-size:11px; }
.preview { font-size:13px; background:var(--secondary-background-color,#f5f5f5); border-radius:8px; padding:10px 14px; line-height:1.7; }
.rule { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid var(--divider-color); flex-wrap:wrap; }
.rule:last-child { border-bottom:none; } .rule .t { flex:1; min-width:200px; }
.rule input[type=number] { width:80px; }
table.rules { width:100%; border-collapse:collapse; font-size:14px; }
table.rules td, table.rules th { padding:6px 8px; border-bottom:1px solid var(--divider-color); text-align:left; vertical-align:middle; }
table.rules th { font-size:12px; color:var(--secondary-text-color); font-weight:500; }
table.rules input[type=number] { width:76px; }
.seg { display:flex; flex-wrap:wrap; gap:0; border:1px solid var(--divider-color); border-radius:8px; overflow:hidden; margin:8px 0 12px; }
.seg button { border:none; border-radius:0; border-right:1px solid var(--divider-color); flex:1; min-width:110px; }
.seg button:last-child { border-right:none; } .seg button.sel { background:var(--primary-color); color:var(--text-primary-color,#fff); }
.cand { display:flex; align-items:center; gap:8px; padding:8px; border-bottom:1px solid var(--divider-color); font-size:13px; }
.cand .t { flex:1; word-break:break-all; }
.current { padding:10px 12px; border-radius:8px; background:var(--secondary-background-color); font-size:14px; }
.flash { animation:flash 1.2s ease-out; } @keyframes flash { from { background:color-mix(in srgb, var(--ok) 40%, transparent); } }
/* ---- learn box */
.learnbox { margin:8px 0; }
.learnbox .cand { padding:6px 4px; }
.learn-on { animation:pulseb 1.4s ease-in-out infinite; }
@keyframes pulseb { 50% { box-shadow:0 0 0 4px color-mix(in srgb, var(--primary-color) 30%, transparent); } }
.zoom { display:flex; gap:4px; margin-left:auto; }
.zoom button { padding:4px 10px; min-width:36px; }
.tab ha-icon { display:none; }
/* ---- mobile layout */
:host([mobile]) .content { padding:12px 10px 150px; }
:host([mobile]) .tabs { position:fixed; left:0; right:0; bottom:0; z-index:15; justify-content:space-around; gap:0; padding:0 0 env(safe-area-inset-bottom);
  background:var(--card-background-color,#fff); border-top:1px solid var(--divider-color); overflow:hidden; }
:host([mobile]) .tab { flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; padding:8px 2px 6px; font-size:11px;
  color:var(--secondary-text-color); opacity:1; border-bottom:none; border-top:3px solid transparent; min-width:0; }
:host([mobile]) .tab ha-icon { display:block; --mdc-icon-size:22px; }
:host([mobile]) .tab.sel { color:var(--primary-color); border-top-color:var(--primary-color); }
:host([mobile]) .tab:hover { background:none; }
:host([mobile]) button { min-height:40px; }
:host([mobile]) button.icon, :host([mobile]) .chip button, :host([mobile]) .swatch { min-height:0; }
:host([mobile]) input, :host([mobile]) select { font-size:16px; padding:9px 10px; }
:host([mobile]) .zone-grid { grid-template-columns:1fr; }
:host([mobile]) .zone-card .btns button { flex:1; }
:host([mobile]) .tools .hint { display:none; }
:host([mobile]) .img-grid { grid-template-columns:repeat(4,1fr); }
:host([mobile]) .dg-scroll { max-height:60vh; }
:host([mobile]) .savebar { bottom:78px; }
:host([mobile][sheet]) .savebar { bottom:14px; }
:host([mobile]) .side-left { width:auto; }
:host([mobile]) .seg button { min-width:0; padding:8px 4px; font-size:13px; }
:host([mobile]) .savebar { flex-wrap:nowrap; padding:8px 10px; gap:8px; width:max-content; }
:host([mobile]) .savebar .msg { font-size:13px; }
:host([mobile]) .tools .zhint { display:block; font-size:12px; }
.sheet { position:fixed; inset:0; z-index:20; background:var(--primary-background-color); display:flex; flex-direction:column; }
.sheet-head { display:flex; align-items:center; gap:8px; height:56px; padding:0 8px; flex:none; box-sizing:border-box;
  background:var(--app-header-background-color, var(--primary-color)); color:var(--app-header-text-color,#fff); font-size:17px; }
.sheet-head button { color:inherit; border:none; font-size:16px; }
.sheet-head b { flex:1; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.sheet-body { flex:1; overflow:auto; padding:12px 10px 110px; -webkit-overflow-scrolling:touch; }
.sheet .side-head { display:none; }
.sheet .card { margin-bottom:12px; }
@media (max-width: 760px) {
  table.rules, table.rules tbody, table.rules tr, table.rules td { display:block; width:auto; }
  table.rules tr:first-child { display:none; }
  table.rules tr { border:1px solid var(--divider-color); border-radius:10px; padding:8px 10px; margin-bottom:10px; }
  table.rules td { border:none; padding:4px 0; display:flex; align-items:center; justify-content:space-between; gap:10px; }
  table.rules td[data-label]::before { content:attr(data-label); font-size:12px; color:var(--secondary-text-color); }
}
.savebar { position:fixed; left:50%; transform:translateX(-50%); bottom:16px; z-index:30; display:none; align-items:center; gap:10px;
  background:var(--card-background-color); border:1px solid var(--divider-color); border-radius:12px; padding:10px 14px;
  box-shadow:0 4px 18px rgba(0,0,0,.25); max-width:calc(100vw - 32px); flex-wrap:wrap; }
.savebar.show { display:flex; }
.savebar .msg { font-size:14px; } .savebar .msg.err { color:var(--err); }
`;

/* ==================================================================== panel */
class SequencerPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = { nodes: [], edges: [], zones: [], remotes: [] };
    this._draft = null;
    this._dirty = false;
    this._live = { zones_active: [], tracked: {}, transient: {}, ops: {}, remotes: {} };
    this._tab = "control";
    this._sel = { node: null, edge: null, zone: null, remote: null };
    this._hl = null;
    this._rkind = null;
    this._learn = null;
    this._devTriggers = null;
    this._stateRefs = {};
    this._zoom = null;
    this._mobile = false;
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (this._menu) this._menu.hass = hass;
    if (first) { this._build(); this._connect(); }
    else this._onHassUpdate();
  }
  get hass() { return this._hass; }
  set narrow(v) { this._narrow = v; if (this._menu) this._menu.narrow = v; }
  set panel(p) { this._panel = p; }
  set route(r) { this._route = r; }

  connectedCallback() { if (this._hass && !this._unsubP) this._connect(); }
  disconnectedCallback() {
    this._unsubP?.then((u) => u()).catch(() => {});
    this._unsubP = null;
    this._stopLearn();
    clearInterval(this._ticker); this._ticker = null;
  }

  /* ------------------------------------------------------------ plumbing */
  _build() {
    const root = this.shadowRoot;
    root.innerHTML = `<style>${STYLE}</style>
      <div class="toolbar"><span id="menu"></span><div class="title">Sekvensstyrning</div></div>
      <div class="tabs" id="tabs"></div>
      <div id="main"></div>
      <div class="savebar" id="savebar"></div>
      <datalist id="entities"></datalist><datalist id="services"></datalist>`;
    this._menu = document.createElement("ha-menu-button");
    this._menu.hass = this._hass; this._menu.narrow = this._narrow;
    root.getElementById("menu").appendChild(this._menu);
    this._main = root.getElementById("main");

    root.addEventListener("click", (e) => this._onClick(e));
    root.addEventListener("input", (e) => this._onInput(e));
    root.addEventListener("change", (e) => this._onChange(e));
    root.addEventListener("pointerdown", (e) => this._onPointerDown(e));
    root.addEventListener("mouseover", (e) => this._onHover(e));
    root.addEventListener("keydown", (e) => this._onKey(e));
    this._ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      const m = w > 0 && w < 760;
      if (m !== this._mobile) { this._mobile = m; this.toggleAttribute("mobile", m); this._render(); }
      else this._fitDiagrams();
    });
    this._ro.observe(this);
    this._render();
  }

  _connect() {
    if (this._unsubP || !this._hass) return;
    this._unsubP = this._hass.connection.subscribeMessage((ev) => this._onEvent(ev), { type: "sequencer/subscribe" });
    this._unsubP.catch((err) => this._toast(err.message || String(err), true));
    this._load();
  }

  async _load() {
    try {
      const res = await this._hass.callWS({ type: "sequencer/config" });
      this._config = res.config;
      this._live = res.state;
      if (!this._dirty) this._resetDraft();
      this._render();
    } catch (err) { this._toast(`Kunde inte ladda: ${err.message || err}`, true); }
  }

  _onEvent(ev) {
    if (ev.type === "state") {
      const prev = this._live.remotes || {};
      this._live = ev.state;
      this._applyLive(prev);
    } else if (ev.type === "config") {
      if (this._saving) return;
      if (!this._dirty) this._load();
      else { this._external = true; this._renderSaveBar(); }
    }
  }

  _onHassUpdate() {
    const cfgs = [this._config, this._draft].filter(Boolean);
    let changed = false;
    for (const cfg of cfgs) for (const n of cfg.nodes) for (const e of n.entities || []) {
      const st = this._hass.states[e];
      if (this._stateRefs[e] !== st) { this._stateRefs[e] = st; changed = true; }
    }
    if (changed) this._applyLive();
  }

  _resetDraft() {
    const d = clone(this._config);
    for (const n of d.nodes) for (const k of ["on", "off"]) {
      n[k] = n[k] || {};
      n[k]._dataText = n[k].data && Object.keys(n[k].data).length ? JSON.stringify(n[k].data, null, 2) : "";
    }
    for (const r of d.remotes) r._dataText = r.trigger?.event_data ? JSON.stringify(r.trigger.event_data, null, 2) : "";
    this._draft = d;
    this._dirty = false;
    this._external = false;
    this._saveError = null;
  }

  _markDirty() { this._dirty = true; this._saveError = null; this._renderSaveBar(); }

  _toast(msg, isErr) {
    if (isErr) this._saveError = msg;
    else {
      this._toastMsg = msg;
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => { this._toastMsg = null; this._renderSaveBar(); }, 3000);
    }
    this._renderSaveBar();
  }

  _fillDatalists() {
    const root = this.shadowRoot; const st = this._hass.states;
    root.getElementById("entities").innerHTML = Object.keys(st).sort()
      .map((id) => `<option value="${esc(id)}">${esc(st[id].attributes.friendly_name || "")}</option>`).join("");
    const svcs = [];
    for (const [d, s] of Object.entries(this._hass.services || {})) for (const k of Object.keys(s)) svcs.push(`${d}.${k}`);
    root.getElementById("services").innerHTML = svcs.sort().map((s) => `<option value="${esc(s)}"></option>`).join("");
  }

  _friendly(id) { return this._hass.states[id]?.attributes.friendly_name || id; }
  _cfg(src) { return src === "draft" ? this._draft : this._config; }

  /* ------------------------------------------------------------- render */
  _render() {
    if (!this._main) return;
    const tabs = [["control", "Styrning", "Styrning", "mdi:play-circle-outline"], ["flow", "Flödesschema", "Schema", "mdi:sitemap-outline"],
      ["rules", "Regler", "Regler", "mdi:format-list-checks"], ["zones", "Grupper", "Grupper", "mdi:speaker-multiple"], ["remotes", "Fjärrkontroller", "Fjärrar", "mdi:remote"]];
    this.shadowRoot.getElementById("tabs").innerHTML = tabs
      .map(([k, l, short, icon]) => `<button class="tab ${this._tab === k ? "sel" : ""}" data-act="tab" data-tab="${k}"><ha-icon icon="${icon}"></ha-icon><span>${this._mobile ? short : l}</span></button>`).join("");

    // keep scroll + focus across re-renders
    const scrolls = [...this._main.querySelectorAll(".dg-scroll")].map((el) => [el.dataset.dg, el.scrollLeft, el.scrollTop]);
    const focus = this._focusKey();
    const winY = window.scrollY;

    if (this._tab !== "control" && !this._draft) this._resetDraft();
    if (this._tab !== "control") this._fillDatalistsOnce();
    const html = { control: () => this._controlTab(), flow: () => this._flowTab(), rules: () => this._rulesTab(), zones: () => this._zonesTab(), remotes: () => this._remotesTab() }[this._tab]();
    this._main.innerHTML = html;
    this.toggleAttribute("sheet", !!this._main.querySelector(".sheet"));

    this._main.querySelectorAll(".canvas").forEach((c) => this._drawEdges(c));
    this._fitDiagrams();
    for (const [dg, l, t] of scrolls) { const el = this._main.querySelector(`.dg-scroll[data-dg="${dg}"]`); if (el) { el.scrollLeft = l; el.scrollTop = t; } }
    if (focus) { const el = this._main.querySelector(focus); if (el) { el.focus(); if (el.setSelectionRange && el.type === "text") { const n = el.value.length; el.setSelectionRange(n, n); } } }
    window.scrollTo(0, winY);
    this._applyLive();
    this._renderSaveBar();
  }

  _fillDatalistsOnce() {
    if (this._listsFilled && Date.now() - this._listsFilled < 30000) return;
    this._listsFilled = Date.now();
    this._fillDatalists();
  }

  _focusKey() {
    const el = this.shadowRoot.activeElement;
    if (!el || !this._main.contains(el)) return null;
    const attrs = (e) => [...e.attributes].filter((a) => a.name.startsWith("data-")).map((a) => `[${a.name}="${CSS.escape(a.value)}"]`).join("");
    const own = attrs(el);
    if (!own) return null;
    const ctx = el.parentElement?.closest("[data-ci]");
    return (ctx ? `${attrs(ctx)} ` : "") + el.tagName.toLowerCase() + own;
  }

  _renderSaveBar() {
    const bar = this.shadowRoot.getElementById("savebar");
    if (!bar) return;
    const msg = this._saveError || this._toastMsg ||
      (this._external ? "Konfigurationen ändrades någon annanstans. Spara skriver över den." : this._dirty ? "Du har osparade ändringar" : "");
    bar.classList.toggle("show", !!msg);
    if (!msg) return;
    bar.innerHTML = `<span class="msg ${this._saveError ? "err" : ""}">${esc(msg)}</span>
      ${this._dirty ? `<button data-act="revert">Ångra</button><button class="primary" data-act="save">Spara</button>` : this._saveError ? `<button data-act="close-bar">OK</button>` : ""}`;
  }

  /* --------------------------------------------------------- live status */
  _nodeState(n) {
    const tr = this._live.transient?.[n.id];
    if (tr) return tr;
    if (entityBased(n)) {
      const sts = n.entities.map((e) => this._hass.states[e]?.state);
      const on = sts.filter((s) => s && !OFF.includes(s)).length;
      return on === 0 ? "off" : on === sts.length ? "on" : "partial";
    }
    return this._live.tracked?.[n.id] ? "on" : "off";
  }

  _applyLive(prevRemotes) {
    if (!this._main || !this._hass) return;
    const states = {};
    this._main.querySelectorAll(".canvas").forEach((canvas) => {
      const cfg = this._cfg(canvas.dataset.src);
      const map = Object.fromEntries(cfg.nodes.map((n) => [n.id, n]));
      canvas.querySelectorAll(".node").forEach((el) => {
        const n = map[el.dataset.id]; if (!n) return;
        const st = this._nodeState(n); states[n.id] = st;
        for (const s of ["on", "off", "partial", "starting", "stopping"]) el.classList.toggle(`st-${s}`, st === s);
      });
      canvas.querySelectorAll("[data-from]").forEach((el) => {
        el.classList.toggle("active", states[el.dataset.from] === "on" && ["on", "starting"].includes(states[el.dataset.to]));
      });
    });

    const active = new Set(this._live.zones_active || []);
    const ops = this._live.ops || {};
    this._main.querySelectorAll("[data-zbadge]").forEach((el) => {
      const id = el.dataset.zbadge; const op = ops[id]?.op;
      el.className = `badge ${op ? "busy" : active.has(id) ? "on" : ""}`;
      el.textContent = op === "starting" ? "Startar…" : op === "stopping" ? "Stänger av…" : active.has(id) ? "På" : "Av";
    });
    this._main.querySelectorAll("[data-zled]").forEach((el) => { el.dataset.mode = (this._live.leds || {})[el.dataset.zled] || "off"; });
    this._main.querySelectorAll("[data-zinfo]").forEach((el) => {
      const id = el.dataset.zinfo;
      el.innerHTML = this._opInfo(id, (active.has(id) ? "Igång · " : "") + (el.dataset.default || ""));
    });

    const now = Date.now() / 1000;
    this._main.querySelectorAll("[data-rstat]").forEach((el) => {
      const s = (this._live.remotes || {})[el.dataset.rstat] || {};
      el.innerHTML = s.error ? `<span class="err">⚠ ${esc(s.error)}</span>` : s.last ? `Senast tryckt ${new Date(s.last * 1000).toLocaleTimeString("sv-SE")}` : "";
      if (prevRemotes && s.last && s.last !== prevRemotes[el.dataset.rstat]?.last && now - s.last < 3) {
        const item = el.closest(".list-item, .card"); item?.classList.remove("flash"); void item?.offsetWidth; item?.classList.add("flash");
      }
    });
    this._ensureTicker();
  }

  _opInfo(key, fallback) {
    const op = (this._live.ops || {})[key];
    if (!op) return esc(fallback);
    let html = "";
    if (op.op) {
      html += `${op.op === "starting" ? "Startar" : "Stänger av"}${op.node ? `: <b>${esc(op.node)}</b>` : "…"}`;
      if (op.waiting) html += ` · väntar på ${esc(op.waiting)}`;
      if (op.wait_until) html += ` · <span data-until="${op.wait_until}"></span> s`;
    } else html = esc(fallback);
    if (op.errors?.length) html += `<div class="err">⚠ ${op.errors.map(esc).join("<br>⚠ ")}</div>`;
    return html;
  }

  _ensureTicker() {
    const tick = () => {
      const els = this._main.querySelectorAll("[data-until]");
      if (!els.length && !this._learn) { clearInterval(this._ticker); this._ticker = null; return; }
      const now = Date.now() / 1000;
      els.forEach((el) => (el.textContent = fmtSec(Math.max(0, Math.ceil((Number(el.dataset.until) - now) * 10) / 10))));
      if (this._learn) {
        const left = Math.max(0, Math.ceil(this._learn.until - now));
        const b = this._main.querySelector("[data-learn-left]"); if (b) b.textContent = left;
        if (left <= 0) { this._stopLearn(); this._render(); }
      }
    };
    if (!this._ticker && (this._main.querySelector("[data-until]") || this._learn)) this._ticker = setInterval(tick, 200);
    tick();
  }

  /* ------------------------------------------------------------ diagram */
  _diagram(src, { editable = false, highlight = null, dimOthers = false } = {}) {
    const cfg = this._cfg(src);
    if (!cfg.nodes.length) {
      return `<div class="empty">Ingen utrustning ännu.${editable ? "<br>Klicka på <b>+ Lägg till utrustning</b> för att börja." : "<br>Lägg till utrustning under fliken <b>Flödesschema</b>."}</div>`;
    }
    const w = Math.max(...cfg.nodes.map((n) => n.x)) + NODE_W + (editable ? 260 : 60);
    const h = Math.max(...cfg.nodes.map((n) => n.y)) + NODE_H + (editable ? 160 : 40);
    const zoneDots = {};
    cfg.zones.forEach((z, i) => {
      const col = z.color || ZONE_COLORS[i % ZONE_COLORS.length];
      for (const nid of closure(cfg, [z.id])) (zoneDots[nid] ||= []).push(col);
    });
    const hlSet = highlight ? closure(cfg, [highlight]) : null;
    const hlZone = highlight ? cfg.zones.find((z) => z.id === highlight) : null;
    const hlColor = hlZone ? hlZone.color || ZONE_COLORS[cfg.zones.indexOf(hlZone) % ZONE_COLORS.length] : "";
    const nodes = cfg.nodes.map((n) => {
      const img = IMAGES[n.image] || IMAGES.generic;
      const one = (n.entities || []).length === 1 ? (this._friendly(n.entities[0]) === n.name ? n.entities[0] : this._friendly(n.entities[0])) : "";
      const sub = (n.entities || []).length ? (one || `${n.entities.length} entiteter`)
        : (n.on?.action === "service" ? n.on.service : "endast i schemat");
      const cls = ["node", this._sel.node === n.id && editable ? "sel" : "", hlSet?.has(n.id) ? "hl" : "", dimOthers && hlSet && !hlSet.has(n.id) ? "dim" : ""].join(" ");
      return `<div class="${cls}" data-id="${esc(n.id)}" style="left:${n.x}px;top:${n.y}px;--hlc:${hlColor}">
        ${n.rank && n.rank !== "normal" ? `<span class="rank">${n.rank === "first" ? "① först" : "sist ⑨"}</span>` : ""}
        <div class="dots">${(zoneDots[n.id] || []).map((c) => `<span class="dot" style="background:${c}"></span>`).join("")}</div>
        <div class="img">${img[1]}</div>
        <div class="nname">${esc(n.name || img[0])}</div>
        <div class="nsub">${esc(sub)}</div>
        ${editable ? `<div class="port port-in"></div><div class="port port-out" title="Dra till en annan enhet för att koppla"></div>` : ""}
      </div>`;
    }).join("");
    const dg = `${src}-${editable ? "e" : "v"}-${this._tab}`;
    return `${editable ? this._zoomBar() : ""}<div class="dg-scroll ${editable ? "zoomable" : "fit"}" data-dg="${dg}"><div class="sizer"><div class="canvas ${editable ? "editable" : ""}" data-src="${src}" data-w="${w}" data-h="${h}" style="width:${w}px;height:${h}px">
      <svg class="edges" width="${w}" height="${h}"></svg>${nodes}</div></div></div>`;
  }

  _zoomBar() {
    return `<div class="tools" style="margin:8px 8px 0"><span class="hint zhint">${this._mobile ? "Dra i en enhet för att flytta den. Tryck på den för att ändra inställningar och kopplingar." : ""}</span>
      <div class="zoom"><button data-act="zoom" data-z="out" title="Zooma ut">−</button><button data-act="zoom" data-z="fit" title="Anpassa">⤢</button><button data-act="zoom" data-z="in" title="Zooma in">+</button></div></div>`;
  }

  _fitDiagrams() {
    if (!this._main) return;
    this._main.querySelectorAll(".dg-scroll.fit, .dg-scroll.zoomable").forEach((sc) => {
      const c = sc.querySelector(".canvas"); const sizer = sc.querySelector(".sizer");
      if (!c || !sizer) return;
      const w = Number(c.dataset.w), h = Number(c.dataset.h);
      const avail = sc.clientWidth || w;
      const fit = Math.max(0.4, Math.min(1, avail / w));
      const k = sc.classList.contains("zoomable") ? (this._zoom ?? (this._mobile ? fit : 1)) : fit;
      c.dataset.k = k;
      c.style.transform = k !== 1 ? `scale(${k})` : "";
      sizer.style.width = `${w * k}px`; sizer.style.height = `${h * k}px`;
    });
  }

  _drawEdges(canvas, tmp) {
    const cfg = this._cfg(canvas.dataset.src);
    const svg = canvas.querySelector("svg.edges");
    if (!svg) return;
    const map = Object.fromEntries(cfg.nodes.map((n) => [n.id, n]));
    const editable = canvas.classList.contains("editable");
    let out = "";
    for (const e of cfg.edges) {
      const a = map[e.from], b = map[e.to];
      if (!a || !b) continue;
      const x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2, x2 = b.x - 2, y2 = b.y + NODE_H / 2;
      const dx = Math.max(40, Math.abs(x2 - x1) / 2);
      const d = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2 - 8},${y2}`;
      const sel = editable && this._sel.edge && this._sel.edge.from === e.from && this._sel.edge.to === e.to ? "sel" : "";
      const attrs = `data-from="${esc(e.from)}" data-to="${esc(e.to)}"`;
      out += `<path class="edge ${sel}" d="${d}" ${attrs}/>`;
      out += `<polygon class="arrow ${sel}" points="${x2},${y2} ${x2 - 10},${y2 - 6} ${x2 - 10},${y2 + 6}" ${attrs}/>`;
      if (editable) out += `<path class="edge-hit" d="${d}" data-ehit="1" data-efrom="${esc(e.from)}" data-eto="${esc(e.to)}"/>`;
    }
    if (tmp) out += `<path class="tmp-edge" d="M${tmp.x1},${tmp.y1} L${tmp.x2},${tmp.y2}"/>`;
    svg.innerHTML = out;
  }

  _sideWrap(title, inner, closeAct) {
    if (!this._mobile) return `<div class="card side">${inner}</div>`;
    return `<div class="sheet"><div class="sheet-head"><button data-act="${closeAct}">‹ Tillbaka</button><b>${esc(title)}</b></div>
      <div class="sheet-body"><div class="card">${inner}</div></div></div>`;
  }

  /* --------------------------------------------------------- tab: control */
  _controlTab() {
    const cfg = this._config;
    if (!cfg.zones.length) {
      return `<div class="content"><div class="card"><h2>Kom igång</h2><div class="hint" style="font-size:14px">
        <p><b>1. Flödesschema</b> – lägg till din utrustning (mixer, DSP, slutsteg …) och dra pilar mellan dem.
        En pil betyder att något <i>startas före</i> nästa sak och <i>stängs av efter</i>.</p>
        <p><b>2. Regler</b> – finjustera ordning, prioritet ("alltid först"), fördröjningar och villkor som "vänta tills slutsteget rapporterar på".</p>
        <p><b>3. Grupper</b> – skapa t.ex. ett rum per grupp och välj vilken utrustning rummet behöver. Delad utrustning (t.ex. en gemensam mixer) startas när första gruppen startar och stängs av först när sista gruppen stängs av.</p>
        <p><b>4. Fjärrkontroller</b> – koppla knappar direkt till grupperna, utan automationer.</p></div>
        <div class="btns"><button class="primary" data-act="tab" data-tab="flow">Öppna flödesschemat</button></div></div>
        ${cfg.nodes.length ? `<div class="card pad0">${this._diagram("config")}</div>` : ""}</div>`;
    }
    const cards = cfg.zones.map((z, i) => {
      const col = z.color || ZONE_COLORS[i % ZONE_COLORS.length];
      const n = closure(cfg, [z.id]).size;
      return `<div class="card zone-card ${this._hl === z.id ? "hl" : ""}" data-zone="${esc(z.id)}" style="--zc:${col}">
        <div class="zc-head"><ha-icon icon="${esc(z.icon || "mdi:speaker-multiple")}"></ha-icon><span class="zc-name">${esc(z.name)}</span>${z.led ? `<span class="led" data-zled="${esc(z.id)}" title="Status-LED"></span>` : ""}<span class="badge" data-zbadge="${esc(z.id)}"></span></div>
        <div class="zc-info" data-zinfo="${esc(z.id)}" data-default="${n} enheter"></div>
        <div class="btns"><button class="primary" data-act="zone" data-id="${esc(z.id)}" data-action="start">▶ Starta</button>
          <button data-act="zone" data-id="${esc(z.id)}" data-action="stop">■ Stäng av</button></div></div>`;
    }).join("");
    return `<div class="content wide">
      <div class="zone-grid">${cards}</div>
      <div class="row-between"><h2>Anläggningen just nu</h2>
        <div style="display:flex;gap:10px;align-items:center"><span class="hint" data-zinfo="${ALL}" data-default=""></span>
        <button class="danger" data-act="zone" data-id="${ALL}" data-action="stop">⏻ Stäng av allt</button></div></div>
      <div class="card pad0">${this._diagram("config", { highlight: this._hl, dimOthers: true })}</div>
      <div class="hint">Håll muspekaren över en grupp för att se vilken utrustning den använder. Färgprickarna visar vilka grupper som delar på en enhet.</div>
    </div>`;
  }

  /* ------------------------------------------------------------ tab: flow */
  _flowTab() {
    const node = this._draft.nodes.find((n) => n.id === this._sel.node);
    return `<div class="content wide">
      <div class="tools">
        <button class="primary" data-act="add-node">+ Lägg till utrustning</button>
        <button data-act="learn-toggle" data-target="new" class="${this._learn?.target === "new" ? "primary learn-on" : ""}">${this._learn?.target === "new" ? "Lyssnar… <span data-learn-left></span> s" : "🎧 Lägg till med knapptryck"}</button>
        ${this._sel.edge ? `<button class="danger" data-act="del-edge">Ta bort vald koppling</button>` : ""}
        <span class="hint">Dra en enhet för att flytta den. Dra från den högra punkten till en annan enhet för att koppla ihop dem.
          Pilen betyder <b>startas före</b> och <b>stängs av efter</b>. Klicka på en pil för att markera den.</span>
      </div>
      ${this._learn?.target === "new" ? `<div class="card">${this._learnList("Tryck på knappen på uttaget eller enheten du vill lägga till. Allt som ändrar läge visas här.", "Lägg till")}</div>` : ""}
      <div class="flow-layout">
        <div class="card pad0 grow">${this._diagram("draft", { editable: true })}</div>
        ${node ? this._sideWrap(node.name || "Utrustning", this._nodeEditor(node), "close-node") : ""}
      </div></div>`;
  }

  _nodeEditor(n) {
    const cfg = this._draft;
    const zonesUsing = cfg.zones.filter((z) => closure(cfg, [z.id]).has(n.id));
    const actSel = (path, opts, cur) => `<select data-nf="${path}">${opts.map(([v, l]) => `<option value="${v}" ${cur === v ? "selected" : ""}>${l}</option>`).join("")}</select>`;
    const spec = (k) => {
      const s = n[k] || {};
      const def = k === "on" ? "turn_on" : "turn_off";
      const cur = s.action || def;
      const opts = k === "on" ? [["turn_on", "Slå på entiteterna"], ["service", "Anropa tjänst…"], ["none", "Ingen åtgärd"]]
        : [["turn_off", "Stäng av entiteterna"], ["service", "Anropa tjänst…"], ["none", "Ingen åtgärd"]];
      return `<div class="row"><label class="grow">${actSel(`${k}.action`, opts, cur)}</label>
        ${cur === "service" ? `<label class="grow"><input data-nf="${k}.service" list="services" value="${esc(s.service || "")}" placeholder="t.ex. media_player.select_source"></label>` : ""}</div>
        ${cur !== "none" ? `<details ${s._dataText ? "open" : ""}><summary>Extra data (JSON)</summary>
          <textarea data-nf="${k}._dataText" placeholder='{"source": "TV"}'>${esc(s._dataText || "")}</textarea></details>` : ""}`;
    };
    return `<div class="side-head"><b>Utrustning</b><button class="icon" data-act="close-node" title="Stäng">✕</button></div>
      <label>Namn<input data-nf="name" value="${esc(n.name)}" placeholder="T.ex. Slutsteg kök"></label>
      <div class="lbl">Bild</div>
      <div class="img-grid">${Object.entries(IMAGES).map(([k, [l, svg]]) => `<button class="img-opt ${n.image === k ? "sel" : ""}" data-act="set-image" data-img="${k}" title="${l}">${svg}<span>${l}</span></button>`).join("")}</div>
      <div class="lbl">Entiteter som styrs</div>
      ${this._chips(n.entities, "node")}
      ${this._learnBox("node", "🎧 Lyssna – tryck på knappen på enheten", "Lägg till")}
      <div class="lbl">Påslag</div>${spec("on")}
      <div class="row" style="margin-top:8px"><label>Vänta efter påslag (s)<input type="number" min="0" step="0.5" data-nf="delay_on" value="${esc(n.delay_on || 0)}"></label></div>
      ${this._waitEditor(n, "wait_on", "Vänta innan påslag tills…")}
      <div class="lbl">Avstängning</div>${spec("off")}
      <div class="row" style="margin-top:8px"><label>Vänta efter avstängning (s)<input type="number" min="0" step="0.5" data-nf="delay_off" value="${esc(n.delay_off || 0)}"></label></div>
      ${this._waitEditor(n, "wait_off", "Vänta innan avstängning tills…")}
      <div class="lbl">Kopplingar</div>
      ${this._linkEditor(n)}
      <div class="lbl">Prioritet</div>
      ${actSel("rank", [["first", "Alltid först – startas först, stängs av sist"], ["normal", "Normal – följer pilarna"], ["last", "Alltid sist – startas sist, stängs av först"]], n.rank || "normal")}
      <div class="lbl">Används av</div>
      <div class="chips">${zonesUsing.length ? zonesUsing.map((z) => `<span class="chip" style="padding-right:10px"><span class="dot" style="width:9px;height:9px;border-radius:50%;background:${z.color}"></span>${esc(z.name)}</span>`).join("") : `<span class="hint">Ingen grupp ännu</span>`}</div>
      <div class="lbl">Testa</div>
      <div class="btns" style="margin-top:0"><button class="small" data-act="test-node" data-on="1">Slå på nu</button><button class="small" data-act="test-node" data-on="0">Stäng av nu</button></div>
      <div class="btns"><button class="danger small" data-act="del-node">Ta bort utrustning</button></div>`;
  }

  _linkEditor(n) {
    const cfg = this._draft;
    const nm = (id) => esc(cfg.nodes.find((x) => x.id === id)?.name || "?");
    const outs = cfg.edges.filter((e) => e.from === n.id).map((e) => e.to);
    const ins = cfg.edges.filter((e) => e.to === n.id).map((e) => e.from);
    const opts = (dir, have) => cfg.nodes.filter((x) => x.id !== n.id && !have.includes(x.id) && !(dir === "out" ? wouldCycle(cfg, n.id, x.id) : wouldCycle(cfg, x.id, n.id)))
      .map((x) => `<option value="${esc(x.id)}">${esc(x.name || "?")}</option>`).join("");
    const chips = (list, dir) => list.map((id) => `<span class="chip">${nm(id)}<button data-act="unlink" data-dir="${dir}" data-other="${esc(id)}" title="Ta bort koppling">×</button></span>`).join("");
    return `<div class="hint">Startas <b>efter</b> (och stängs av före):</div>
      <div class="chips" style="margin:4px 0 10px">${chips(ins, "in")}<select data-link="in"><option value="">+ Lägg till…</option>${opts("in", ins)}</select></div>
      <div class="hint">Startas <b>före</b> (och stängs av efter):</div>
      <div class="chips" style="margin-top:4px">${chips(outs, "out")}<select data-link="out"><option value="">+ Lägg till…</option>${opts("out", outs)}</select></div>`;
  }

  _learnBox(target, startLabel, useLabel) {
    const on = this._learn?.target === target;
    return `<div class="learnbox"><button class="small ${on ? "primary learn-on" : ""}" data-act="learn-toggle" data-target="${target}">
      ${on ? "Lyssnar… <span data-learn-left></span> s · Sluta" : startLabel}</button>
      ${on ? this._learnList("Tryck på knappen nu. Allt som ändrar läge visas här.", useLabel) : ""}</div>`;
  }

  _learnList(hint, useLabel) {
    const cands = this._learn?.cands || [];
    return `<div class="hint" style="margin:6px 0">${hint}</div>
      ${cands.map((c, i) => `<div class="cand"><span class="t">${this._candLabel(c)}</span><button class="small" data-act="use-learn" data-i="${i}">${useLabel}</button></div>`).join("")}`;
  }

  _chips(list, ctx) {
    return `<div class="chips">${(list || []).map((e, i) => `<span class="chip">${esc(this._friendly(e))}
      <button data-act="del-entity" data-ctx="${ctx}" data-i="${i}" title="${esc(e)}">×</button></span>`).join("")}
      <input class="entity-input" data-ctx="${ctx}" list="entities" placeholder="Lägg till entitet… (sök och tryck Enter)"></div>`;
  }

  _waitEditor(n, key, title) {
    const w = n[key];
    const conds = w?.conditions || [];
    const summary = conds.length ? ` (${conds.length} villkor)` : "";
    return `<details ${conds.length ? "open" : ""}><summary>${title}${summary}</summary>
      ${conds.map((c, i) => `<div class="cond" data-wpath="${key}" data-ci="${i}">
        <input class="grow" data-cf="entity_id" list="entities" value="${esc(c.entity_id || "")}" placeholder="entitet">
        <input data-cf="attribute" value="${esc(c.attribute || "")}" placeholder="attribut" style="width:84px">
        <span>=</span><input data-cf="state" value="${esc(c.state || "")}" placeholder="on" style="width:84px">
        <button class="icon" data-act="del-cond" title="Ta bort">✕</button></div>`).join("")}
      <button class="small" data-act="add-cond" data-wpath="${key}">+ Villkor</button>
      ${this._learnBox(`cond:${key}`, "🎧 Lyssna efter status", "Använd")}
      ${conds.length ? `<div class="row" style="margin-top:8px">
        <label>Krav<select data-wf="mode" data-wpath="${key}"><option value="all" ${w.mode !== "any" ? "selected" : ""}>Alla (X och Y)</option><option value="any" ${w.mode === "any" ? "selected" : ""}>Något (X eller Y)</option></select></label>
        <label>Max (s)<input type="number" min="1" data-wf="timeout" data-wpath="${key}" value="${esc(w.timeout ?? 60)}" style="width:76px"></label>
        <label>Om tiden går ut<select data-wf="on_timeout" data-wpath="${key}"><option value="continue" ${w.on_timeout !== "abort" ? "selected" : ""}>Fortsätt ändå</option><option value="abort" ${w.on_timeout === "abort" ? "selected" : ""}>Avbryt sekvensen</option></select></label></div>
        <div class="hint">Flera värden separeras med komma, t.ex. <code>on,playing</code>. Tomt värde = vad som helst utom otillgänglig. Attribut är valfritt.</div>` : ""}
    </details>`;
  }

  /* ----------------------------------------------------------- tab: rules */
  _rulesTab() {
    const cfg = this._draft;
    const name = (id) => esc(cfg.nodes.find((n) => n.id === id)?.name || "?");
    const opts = (sel) => cfg.nodes.map((n) => `<option value="${esc(n.id)}" ${sel === n.id ? "selected" : ""}>${esc(n.name || "?")}</option>`).join("");
    if (!cfg.nodes.length) return `<div class="content"><div class="card empty">Lägg till utrustning under <b>Flödesschema</b> först.</div></div>`;
    const waitText = (w) => w?.conditions?.length
      ? w.conditions.map((c) => `${esc(this._friendly(c.entity_id))}${c.attribute ? "." + esc(c.attribute) : ""} = ${esc(c.state || "något")}`).join(w.mode === "any" ? " <b>eller</b> " : " <b>och</b> ") + ` <small>(max ${fmtSec(w.timeout ?? 60)} s)</small>`
      : `<span class="hint">–</span>`;
    const ord = order(cfg);
    return `<div class="content">
      <div class="card"><h2>Ordning</h2>
        <div class="hint">"A startas före B" betyder också att A stängs av <i>efter</i> B. Reglerna är samma sak som pilarna i flödesschemat.</div>
        ${cfg.edges.map((e, i) => `<div class="rule"><span class="t"><b>${name(e.from)}</b> startas före <b>${name(e.to)}</b> och stängs av efter</span>
          <button class="small danger" data-act="del-rule" data-i="${i}">Ta bort</button></div>`).join("") || `<div class="hint" style="margin:10px 0">Inga regler ännu.</div>`}
        <div class="row" style="margin-top:12px">
          <label class="grow">Utrustning<select id="rule-a">${opts(cfg.nodes[0]?.id)}</select></label>
          <span style="padding-bottom:9px">startas alltid före</span>
          <label class="grow">Utrustning<select id="rule-b">${opts(cfg.nodes[1]?.id)}</select></label>
          <button class="primary" data-act="add-rule">Lägg till regel</button>
        </div>
      </div>
      <div class="card"><h2>Prioritet, fördröjningar och villkor</h2>
        <div class="hint">"Alltid först" passar t.ex. en mixer eller strömfördelare: den startas före allt annat och stängs av sist. "Alltid sist" passar slutsteg.</div>
        <div style="overflow-x:auto"><table class="rules"><tr><th>Utrustning</th><th>Prioritet</th><th>Vänta efter på (s)</th><th>Vänta efter av (s)</th><th>Väntar innan påslag på</th><th></th></tr>
        ${cfg.nodes.map((n) => `<tr data-rowid="${esc(n.id)}"><td><b>${esc(n.name || "?")}</b></td>
          <td data-label="Prioritet"><select data-rr="rank">${["first", "normal", "last"].map((r) => `<option value="${r}" ${(n.rank || "normal") === r ? "selected" : ""}>${RANK_LABEL[r]}</option>`).join("")}</select></td>
          <td data-label="Vänta efter på (s)"><input type="number" min="0" step="0.5" data-rr="delay_on" value="${esc(n.delay_on || 0)}"></td>
          <td data-label="Vänta efter av (s)"><input type="number" min="0" step="0.5" data-rr="delay_off" value="${esc(n.delay_off || 0)}"></td>
          <td data-label="Väntar på">${waitText(n.wait_on)}</td>
          <td><button class="small" data-act="edit-node" data-id="${esc(n.id)}">Villkor…</button></td></tr>`).join("")}
        </table></div>
      </div>
      <div class="card"><h2>Resultat</h2>
        <div class="preview"><b>Startordning (allt):</b> ${ord.map((id) => name(id)).join(" → ")}<br>
        <b>Avstängning (allt):</b> ${[...ord].reverse().map((id) => name(id)).join(" → ")}</div>
        <div class="hint" style="margin-top:8px">En grupp kör bara den del av ordningen som den behöver. Se fliken Grupper.</div>
      </div></div>`;
  }

  /* ----------------------------------------------------------- tab: zones */
  _zonesTab() {
    const cfg = this._draft;
    const z = cfg.zones.find((x) => x.id === this._sel.zone);
    const list = cfg.zones.map((x, i) => `<div class="list-item ${x.id === this._sel.zone ? "sel" : ""}" data-act-item="zone" data-id="${esc(x.id)}">
      <span class="sw" style="background:${x.color || ZONE_COLORS[i % 8]}"></span><span class="t">${esc(x.name)}<small>${closure(cfg, [x.id]).size} enheter</small></span></div>`).join("");
    const listCard = `<div class="card side-left"><h2>Grupper</h2>${list || `<div class="hint">Inga grupper ännu.</div>`}
        <div class="btns"><button class="primary" data-act="add-zone">+ Ny grupp</button></div></div>`;
    if (this._mobile) {
      return `<div class="content">${listCard}<div class="card pad0">${this._diagram("draft")}</div>
        ${z ? `<div class="sheet"><div class="sheet-head"><button data-act="close-zone">‹ Tillbaka</button><b>${esc(z.name)}</b></div>
          <div class="sheet-body">${this._zoneEditor(z)}<div class="card pad0">${this._diagram("draft", { highlight: z.id, dimOthers: true })}</div></div></div>` : ""}</div>`;
    }
    return `<div class="content wide"><div class="flow-layout">
      ${listCard}
      <div class="grow">${z ? this._zoneEditor(z) : `<div class="card empty">En grupp är t.ex. ett rum eller en zon. Välj vilken utrustning den behöver.
        Det som krävs före (enligt flödesschemat) tas med automatiskt, och utrustning som delas med en annan grupp som är igång stängs inte av.</div>`}
        <div class="card pad0">${this._diagram("draft", { highlight: z?.id, dimOthers: !!z })}</div></div>
    </div></div>`;
  }

  _zoneEditor(z) {
    const cfg = this._draft;
    const all = closure(cfg, [z.id]);
    const others = cfg.zones.filter((o) => o.id !== z.id);
    const sharedWith = (nid) => others.filter((o) => closure(cfg, [o.id]).has(nid)).map((o) => o.name);
    const nodes = Object.fromEntries(cfg.nodes.map((n) => [n.id, n]));
    const seq = order(cfg).filter((id) => all.has(id));
    const startTxt = seq.map((id, i) => `${esc(nodes[id].name || "?")}${i < seq.length - 1 && nodes[id].delay_on ? ` <small>(${fmtSec(nodes[id].delay_on)} s)</small>` : ""}`).join(" → ");
    const rev = [...seq].reverse();
    const stopTxt = rev.map((id, i) => {
      const sh = sharedWith(id);
      return `${esc(nodes[id].name || "?")}${sh.length ? ` <small>(bara om ${esc(sh.join("/"))} är av)</small>` : ""}${i < rev.length - 1 && nodes[id].delay_off ? ` <small>(${fmtSec(nodes[id].delay_off)} s)</small>` : ""}`;
    }).join(" → ");
    return `<div class="card">
      <div class="row"><label class="grow">Namn<input data-zf="name" value="${esc(z.name)}" placeholder="T.ex. Vardagsrum"></label>
        <label>Ikon<input data-zf="icon" value="${esc(z.icon || "")}" placeholder="mdi:sofa"></label></div>
      <div class="lbl">Färg</div>
      <div class="swatches">${ZONE_COLORS.map((c) => `<button class="swatch ${z.color === c ? "sel" : ""}" style="background:${c}" data-act="zone-color" data-color="${c}"></button>`).join("")}</div>
      <div class="lbl">Utrustning som gruppen behöver</div>
      <div class="hint" style="margin-bottom:8px">Välj det som är unikt för gruppen, t.ex. rummets slutsteg. Det som måste vara igång före tas med automatiskt (streckad ram).</div>
      <div class="pick-grid">${cfg.nodes.map((n) => {
        const on = z.nodes.includes(n.id); const auto = !on && all.has(n.id); const sh = sharedWith(n.id);
        return `<label class="pick ${on ? "on" : ""} ${auto ? "auto" : ""}"><input type="checkbox" data-zn="${esc(n.id)}" ${on ? "checked" : ""}>
          ${(IMAGES[n.image] || IMAGES.generic)[1]}<span>${esc(n.name || "?")}${auto ? "<small>automatiskt</small>" : ""}${sh.length ? `<small>delas med ${esc(sh.join(", "))}</small>` : ""}</span></label>`;
      }).join("")}</div>
      <div class="lbl">Status-LED (valfritt)</div>
      <div class="row"><label class="grow">LED-entitet (light/switch)<input data-zf="led" list="entities" value="${esc(z.led || "")}" placeholder="t.ex. switch.gpio_led_vardagsrum"></label>
        <label>Släck efter (min)<input type="number" min="0" step="1" data-zf="led_minutes" value="${esc(z.led_minutes ?? 30)}" style="width:90px"></label></div>
      <div class="hint">Blinkar långsamt medan sekvensen körs, lyser fast när allt gick bra (släcks efter angiven tid, 0 = lys tills nästa gång) och blinkar snabbt vid fel tills gruppen körs igen.</div>
      <div class="lbl">Så här körs gruppen</div>
      <div class="preview">${seq.length ? `<b>Start:</b> ${startTxt}<br><b>Avstängning:</b> ${stopTxt}` : "Välj utrustning ovan."}</div>
      <div class="hint" style="margin-top:6px">Det som redan är igång hoppas över vid start. Switch i HA: <code>switch.${esc((z.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "_"))}</code> (ungefär) när gruppen sparats.</div>
      <div class="btns"><button class="danger small" data-act="del-zone">Ta bort grupp</button></div>
    </div>`;
  }

  /* --------------------------------------------------------- tab: remotes */
  _remotesTab() {
    const cfg = this._draft;
    const r = cfg.remotes.find((x) => x.id === this._sel.remote);
    const zname = (id) => id === ALL ? "Alla grupper" : esc(cfg.zones.find((z) => z.id === id)?.name || "?");
    const list = cfg.remotes.map((x) => `<div class="list-item ${x.id === this._sel.remote ? "sel" : ""}" data-act-item="remote" data-id="${esc(x.id)}">
      <span class="t">${esc(x.name || "Namnlös knapp")}${x.enabled === false ? " <small style='display:inline'>(av)</small>" : ""}
      <small>${ZONE_ACTION_LABEL[x.action] || ""} ${zname(x.target)}</small><small data-rstat="${esc(x.id)}"></small></span></div>`).join("");
    if (this._mobile) {
      return `<div class="content"><div class="card"><h2>Fjärrkontroller</h2>${list || `<div class="hint">Inga knappar kopplade ännu. Koppla knappar på fjärrkontroller direkt till grupperna – tryck på Lyssna och sedan på knappen.</div>`}
        <div class="btns"><button class="primary" data-act="add-remote" ${cfg.zones.length ? "" : "disabled"}>+ Koppla en knapp</button></div>
        ${cfg.zones.length ? "" : `<div class="hint" style="margin-top:8px">Skapa en grupp först.</div>`}</div>
        ${r ? `<div class="sheet"><div class="sheet-head"><button data-act="close-remote">‹ Tillbaka</button><b>${esc(r.name || "Knapp")}</b></div>
          <div class="sheet-body">${this._remoteEditor(r)}</div></div>` : ""}</div>`;
    }
    return `<div class="content wide"><div class="flow-layout">
      <div class="card side-left"><h2>Fjärrkontroller</h2>${list || `<div class="hint">Inga knappar kopplade ännu.</div>`}
        <div class="btns"><button class="primary" data-act="add-remote" ${cfg.zones.length ? "" : "disabled"}>+ Koppla en knapp</button></div>
        ${cfg.zones.length ? "" : `<div class="hint" style="margin-top:8px">Skapa en grupp först.</div>`}</div>
      <div class="grow">${r ? this._remoteEditor(r) : `<div class="card empty">Koppla knappar på fjärrkontroller (Zigbee, Z-Wave, Hue, Shelly, IKEA …)
        direkt till grupperna. Enklast är <b>Lyssna</b>: tryck på knappen så hittar panelen den åt dig.</div>`}</div>
    </div></div>`;
  }

  _remoteEditor(r) {
    const cfg = this._draft;
    const kind = this._rkind || r.kind || "learn";
    const t = r.trigger;
    const kinds = [["learn", "🎧 Lyssna"], ["device", "Enhet"], ["entity", "Entitet"], ["event", "Händelse"]];
    let body = "";
    if (kind === "learn") {
      const on = this._learn?.target === "remote";
      body = `<button class="primary ${on ? "learn-on" : ""}" data-act="learn-toggle" data-target="remote">${on ? `Lyssnar… <span data-learn-left></span> s – klicka för att sluta` : "Börja lyssna"}</button>
        ${on ? this._learnList("Tryck på knappen på fjärrkontrollen. Allt som händer visas nedan – välj rätt rad.", "Använd") : ""}`;
    } else if (kind === "device") {
      const devs = Object.values(this._hass.devices || {}).filter((d) => !d.disabled_by)
        .map((d) => ({ id: d.id, name: d.name_by_user || d.name || d.id, area: this._hass.areas?.[d.area_id]?.name }))
        .sort((a, b) => a.name.localeCompare(b.name, "sv"));
      const devId = t?.platform === "device" || t?.trigger === "device" ? t.device_id : this._pendingDevice;
      const trigs = this._devTriggers;
      const curIdx = trigs ? trigs.findIndex((x) => devId === t?.device_id && ["type", "subtype", "domain", "entity_id"].every((k) => (x[k] ?? null) === (t?.[k] ?? null))) : -1;
      body = `<label>Enhet<select data-rdev><option value="">Välj enhet…</option>${devs.map((d) => `<option value="${esc(d.id)}" ${d.id === devId ? "selected" : ""}>${esc(d.name)}${d.area ? ` (${esc(d.area)})` : ""}</option>`).join("")}</select></label>
        ${devId ? (trigs ? (trigs.length ? `<label style="margin-top:8px">Knapp / händelse<select data-rtrig><option value="">Välj…</option>${trigs.map((x, i) => `<option value="${i}" ${i === curIdx ? "selected" : ""}>${esc(this._devTrigLabel(x))}</option>`).join("")}</select></label>`
          : `<div class="hint" style="margin-top:8px">Enheten har inga knapphändelser. Prova Lyssna eller Entitet.</div>`) : `<div class="hint" style="margin-top:8px">Hämtar…</div>`) : ""}`;
      if (devId && !trigs) this._loadDevTriggers(devId);
    } else if (kind === "entity") {
      const eid = t?.platform === "state" ? [].concat(t.entity_id)[0] : "";
      const st = this._hass.states[eid];
      const isEvent = eid.startsWith("event.");
      body = `<label>Entitet<input data-rent list="entities" value="${esc(eid)}" placeholder="t.ex. event.fjarr_knapp_1 eller sensor.fjarr_action"></label>
        ${eid && isEvent ? `<label style="margin-top:8px">Händelsetyp<select data-revt><option value="">Alla</option>${(st?.attributes.event_types || []).map((x) => `<option ${r.event_type === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></label>`
          : eid ? `<label style="margin-top:8px">När läget blir (tomt = varje ändring)<input data-rto value="${esc(t?.to ?? "")}" placeholder="t.ex. on, single, 1_single"></label>` : ""}`;
    } else {
      body = `<label>Händelsetyp<input data-revname value="${esc(t?.platform === "event" ? t.event_type : "")}" placeholder="t.ex. zha_event, deconz_event, hue_event"></label>
        <label style="margin-top:8px">Händelsedata som ska matcha (JSON)<textarea data-revdata placeholder='{"device_ieee": "…", "command": "on"}'>${esc(r._dataText || "")}</textarea></label>`;
    }
    return `<div class="card">
      <div class="row"><label class="grow">Namn<input data-rf="name" value="${esc(r.name || "")}" placeholder="T.ex. Fjärr vardagsrum – PÅ"></label>
        <label style="flex-direction:row;align-items:center;gap:6px;padding-bottom:8px"><input type="checkbox" data-rf="enabled" ${r.enabled !== false ? "checked" : ""}> Aktiv</label></div>
      <div class="lbl">När knappen trycks</div>
      <div class="row"><label>Gör<select data-rf="action">${["toggle", "start", "stop"].map((a) => `<option value="${a}" ${r.action === a ? "selected" : ""}>${ZONE_ACTION_LABEL[a]}</option>`).join("")}</select></label>
        <label class="grow">Grupp<select data-rf="target">${cfg.zones.map((z) => `<option value="${esc(z.id)}" ${r.target === z.id ? "selected" : ""}>${esc(z.name)}</option>`).join("")}<option value="${ALL}" ${r.target === ALL ? "selected" : ""}>Alla grupper</option></select></label></div>
      <div class="lbl">Knapp</div>
      <div class="current">${t ? esc(this._triggerText(r)) : `<span class="hint">Ingen knapp vald än</span>`}</div>
      <div class="hint" data-rstat="${esc(r.id)}" style="margin-top:4px"></div>
      <div class="seg">${kinds.map(([k, l]) => `<button class="${kind === k ? "sel" : ""}" data-act="rkind" data-kind="${k}">${l}</button>`).join("")}</div>
      ${body}
      <div class="btns" style="margin-top:20px"><button class="danger small" data-act="del-remote">Ta bort</button></div>
      <div class="hint" style="margin-top:8px">Ändringar börjar gälla när du sparar.</div></div>`;
  }

  _devTrigLabel(x) {
    const ent = x.entity_id && this._hass.states[x.entity_id] ? this._friendly(x.entity_id) + ": " : "";
    return `${ent}${pretty(x.type)}${x.subtype ? " – " + pretty(x.subtype) : ""}`;
  }

  _triggerText(r) {
    const t = r.trigger || {};
    const p = t.platform || t.trigger;
    if (p === "device") {
      const d = this._hass.devices?.[t.device_id];
      return `${d ? d.name_by_user || d.name : "Enhet"}: ${this._devTrigLabel(t)}`;
    }
    if (p === "state") {
      const id = [].concat(t.entity_id)[0];
      return `${this._friendly(id)}${r.event_type ? ` → ${r.event_type}` : t.to != null ? ` = ${t.to}` : " (varje ändring)"}`;
    }
    if (p === "event") return `Händelse ${t.event_type} ${t.event_data && Object.keys(t.event_data).length ? JSON.stringify(t.event_data) : ""}`;
    return JSON.stringify(t);
  }

  _candLabel(c) {
    if (c.kind === "entity") return `<b>${esc(c.name)}</b> <small>${esc(c.entity_id)}</small><br><small>${esc(c.from)} → ${esc(c.to)}</small>`;
    if (c.kind === "event_entity") return `<b>${esc(c.name)}</b> → ${esc(c.event_type || "händelse")}`;
    if (c.kind === "button") return `<b>${esc(c.name)}</b> tryckt`;
    if (c.kind === "state") return `<b>${esc(c.name)}</b> = ${esc(c.to)}`;
    const d = JSON.stringify(c.event_data);
    return `<b>${esc(c.event_type)}</b> <small>${esc(d.length > 160 ? d.slice(0, 160) + "…" : d)}</small>`;
  }

  async _loadDevTriggers(devId) {
    if (this._devTrigLoading === devId) return;
    this._devTrigLoading = devId;
    try {
      const res = await this._hass.callWS({ type: "device_automation/trigger/list", device_id: devId });
      this._devTriggers = res.map((x) => { const y = { ...x }; delete y.metadata; return y; });
    } catch (e) { this._devTriggers = []; }
    this._devTrigLoading = null;
    this._render();
  }

  /* ------------------------------------------------------------- learning */
  _startLearn(target) {
    this._stopLearn();
    const mode = target === "remote" ? "remote" : "entity";
    this._learn = { target, cands: [], keys: new Set(), until: Date.now() / 1000 + 60 };
    this._learn.unsubP = this._hass.connection.subscribeMessage((c) => {
      if (!this._learn) return;
      const key = c.kind === "entity" ? `${c.entity_id}` : JSON.stringify(c);
      if (this._learn.keys.has(key)) { if (c.kind === "entity") { const i = this._learn.cands.findIndex((x) => x.entity_id === c.entity_id); if (i >= 0) this._learn.cands[i] = c; } }
      else { this._learn.keys.add(key); this._learn.cands.unshift(c); }
      this._learn.cands = this._learn.cands.slice(0, 25);
      this._render();
    }, { type: "sequencer/learn", mode });
    this._learn.unsubP.catch((e) => { this._toast(e.message || String(e), true); this._learn = null; });
  }
  _stopLearn() {
    if (!this._learn) return;
    this._learn.unsubP?.then((u) => u()).catch(() => {});
    this._learn = null;
  }

  _useLearned(c) {
    const target = this._learn?.target;
    const d = this._draft;
    if (!c || !target) return;
    if (target === "remote") {
      this._useCandidate(c, d.remotes.find((x) => x.id === this._sel.remote));
    } else if (target === "new") {
      const exists = d.nodes.find((n) => (n.entities || []).includes(c.entity_id));
      if (exists) { this._sel.node = exists.id; this._toast(`${c.name} finns redan i schemat.`); }
      else {
        const n = { id: uid(), name: c.name, image: guessImage(c), entities: [c.entity_id], on: { action: "turn_on", _dataText: "" }, off: { action: "turn_off", _dataText: "" },
          delay_on: 2, delay_off: 1, rank: "normal", wait_on: null, wait_off: null, ...this._freeSpot() };
        d.nodes.push(n); this._sel.node = n.id;
      }
      this._stopLearn();
    } else if (target === "node") {
      const n = this._node(this._sel.node);
      if (!n.entities.includes(c.entity_id)) n.entities.push(c.entity_id);
      if (!n.name) n.name = c.name;
      if (!n.image || n.image === "generic") n.image = guessImage(c);
      this._stopLearn();
    } else if (target.startsWith("cond:")) {
      const k = target.slice(5); const n = this._node(this._sel.node);
      n[k] ||= { mode: "all", timeout: 60, on_timeout: "continue", conditions: [] };
      n[k].conditions.push({ entity_id: c.entity_id, attribute: "", state: c.to });
      this._stopLearn();
    }
    this._markDirty(); this._render();
  }

  _useCandidate(c, r) {
    if (c.kind === "event_entity") { r.kind = "entity"; r.trigger = { platform: "state", entity_id: [c.entity_id], to: null }; r.event_type = c.event_type || null; }
    else if (c.kind === "button") { r.kind = "entity"; r.trigger = { platform: "state", entity_id: [c.entity_id], to: null }; r.event_type = null; }
    else if (c.kind === "state") { r.kind = "entity"; r.trigger = { platform: "state", entity_id: [c.entity_id], to: c.to }; r.event_type = null; }
    else { r.kind = "event"; r.trigger = { platform: "event", event_type: c.event_type, event_data: c.event_data }; r.event_type = null; r._dataText = JSON.stringify(c.event_data, null, 2); }
    if (!r.name) r.name = c.name ? `${c.name}${c.event_type ? " " + c.event_type : c.to ? " " + c.to : ""}` : c.event_type;
    this._rkind = r.kind;
    this._stopLearn();
  }

  /* --------------------------------------------------------------- events */
  _node(id) { return this._draft.nodes.find((n) => n.id === id); }

  async _onClick(ev) {
    const t = ev.target;
    const item = t.closest("[data-act-item]");
    if (item) {
      const kind = item.dataset.actItem;
      if (kind === "zone") this._sel.zone = item.dataset.id;
      if (kind === "remote") { this._sel.remote = item.dataset.id; this._rkind = null; this._devTriggers = null; this._pendingDevice = null; this._stopLearn(); }
      this._render(); return;
    }

    // diagram clicks (editable)
    const canvas = t.closest(".canvas.editable");
    if (canvas && !t.closest("button")) {
      if (this._suppressClick) { this._suppressClick = false; return; }
      const hit = t.closest("[data-ehit]");
      const nodeEl = t.closest(".node");
      if (hit) { this._sel.edge = { from: hit.dataset.efrom, to: hit.dataset.eto }; this._sel.node = null; }
      else if (nodeEl) { if (this._sel.node !== nodeEl.dataset.id && this._learn?.target !== "new") this._stopLearn(); this._sel.node = nodeEl.dataset.id; this._sel.edge = null; }
      else { this._sel.node = null; this._sel.edge = null; }
      this._render(); return;
    }

    const btn = t.closest("button");
    if (!btn || btn.disabled) return;
    const act = btn.dataset.act;
    const d = this._draft;
    switch (act) {
      case "tab": this._tab = btn.dataset.tab; this._hl = null; this._stopLearn(); this._render(); window.scrollTo(0, 0); return;
      case "zone":
        try { await this._hass.callWS({ type: "sequencer/zone", zone_id: btn.dataset.id, action: btn.dataset.action }); }
        catch (e) { this._toast(e.message || String(e), true); }
        return;
      case "save": await this._save(); return;
      case "revert": this._resetDraft(); this._sel = { node: null, edge: null, zone: null, remote: null }; this._load(); return;
      case "close-bar": this._saveError = null; this._renderSaveBar(); return;

      case "add-node": {
        const n = { id: uid(), name: "", image: "generic", entities: [], on: { action: "turn_on", _dataText: "" }, off: { action: "turn_off", _dataText: "" },
          delay_on: 2, delay_off: 1, rank: "normal", wait_on: null, wait_off: null, ...this._freeSpot() };
        d.nodes.push(n); this._sel.node = n.id; this._sel.edge = null; this._markDirty(); this._render(); return;
      }
      case "close-node": this._sel.node = null; this._stopLearn(); this._render(); return;
      case "del-node": {
        const id = this._sel.node; const n = this._node(id);
        if (!confirm(`Ta bort "${n?.name || "utrustningen"}"?`)) return;
        d.nodes = d.nodes.filter((x) => x.id !== id);
        d.edges = d.edges.filter((e) => e.from !== id && e.to !== id);
        d.zones.forEach((z) => (z.nodes = z.nodes.filter((x) => x !== id)));
        this._sel.node = null; this._markDirty(); this._render(); return;
      }
      case "del-edge":
        d.edges = d.edges.filter((e) => !(e.from === this._sel.edge.from && e.to === this._sel.edge.to));
        this._sel.edge = null; this._markDirty(); this._render(); return;
      case "set-image": { const n = this._node(this._sel.node); n.image = btn.dataset.img; if (!n.name) n.name = IMAGES[n.image][0]; this._markDirty(); this._render(); return; }
      case "del-entity": {
        const list = this._entityList(btn.dataset.ctx); list.splice(Number(btn.dataset.i), 1); this._markDirty(); this._render(); return;
      }
      case "add-cond": {
        const n = this._node(this._sel.node); const k = btn.dataset.wpath;
        n[k] ||= { mode: "all", timeout: 60, on_timeout: "continue", conditions: [] };
        n[k].conditions.push({ entity_id: n.entities[0] || "", attribute: "", state: "on" });
        this._markDirty(); this._render(); return;
      }
      case "del-cond": {
        const c = btn.closest("[data-ci]"); const n = this._node(this._sel.node); const w = n[c.dataset.wpath];
        w.conditions.splice(Number(c.dataset.ci), 1); if (!w.conditions.length) n[c.dataset.wpath] = null;
        this._markDirty(); this._render(); return;
      }
      case "test-node": {
        const n = this._node(this._sel.node);
        try { await this._hass.callWS({ type: "sequencer/node/test", node: this._cleanNode(n), on: btn.dataset.on === "1" }); }
        catch (e) { this._toast(`Test misslyckades: ${e.message || e}`, true); }
        return;
      }
      case "edit-node": this._tab = "flow"; this._sel.node = btn.dataset.id; this._sel.edge = null; this._render(); return;

      case "add-rule": {
        const a = this.shadowRoot.getElementById("rule-a").value, b = this.shadowRoot.getElementById("rule-b").value;
        if (a === b) return this._toast("Välj två olika utrustningar.", true);
        if (d.edges.some((e) => e.from === a && e.to === b)) return this._toast("Den regeln finns redan.", true);
        if (wouldCycle(d, a, b)) return this._toast("Det går inte – då skulle reglerna motsäga varandra (en loop).", true);
        d.edges.push({ from: a, to: b }); this._markDirty(); this._render(); return;
      }
      case "del-rule": d.edges.splice(Number(btn.dataset.i), 1); this._markDirty(); this._render(); return;

      case "add-zone": {
        const z = { id: uid(), name: `Grupp ${d.zones.length + 1}`, icon: "", color: ZONE_COLORS[d.zones.length % ZONE_COLORS.length], nodes: [] };
        d.zones.push(z); this._sel.zone = z.id; this._markDirty(); this._render(); return;
      }
      case "del-zone": {
        const z = d.zones.find((x) => x.id === this._sel.zone);
        if (!confirm(`Ta bort gruppen "${z.name}"?`)) return;
        d.zones = d.zones.filter((x) => x.id !== z.id);
        d.remotes.forEach((r) => { if (r.target === z.id) r.target = ALL; });
        this._sel.zone = null; this._markDirty(); this._render(); return;
      }
      case "zone-color": d.zones.find((x) => x.id === this._sel.zone).color = btn.dataset.color; this._markDirty(); this._render(); return;

      case "add-remote": {
        const r = { id: uid(), name: "", enabled: true, kind: "learn", trigger: null, event_type: null, target: d.zones[0]?.id || ALL, action: "toggle", _dataText: "" };
        d.remotes.push(r); this._sel.remote = r.id; this._rkind = "learn"; this._devTriggers = null; this._markDirty(); this._render(); return;
      }
      case "del-remote":
        d.remotes = d.remotes.filter((x) => x.id !== this._sel.remote); this._sel.remote = null; this._stopLearn(); this._markDirty(); this._render(); return;
      case "rkind": this._rkind = btn.dataset.kind; if (this._rkind !== "learn") this._stopLearn(); this._render(); return;
      case "learn-toggle":
        if (this._learn?.target === btn.dataset.target) this._stopLearn(); else this._startLearn(btn.dataset.target);
        this._render(); return;
      case "use-learn": this._useLearned(this._learn.cands[Number(btn.dataset.i)]); return;
      case "zoom": {
        const sc = this._main.querySelector(".dg-scroll.zoomable .canvas");
        const cur = Number(sc?.dataset.k) || 1;
        this._zoom = btn.dataset.z === "fit" ? null : Math.max(0.3, Math.min(1.6, cur * (btn.dataset.z === "in" ? 1.25 : 0.8)));
        this._fitDiagrams(); return;
      }
      case "unlink": {
        const n = this._node(this._sel.node); const o = btn.dataset.other;
        d.edges = d.edges.filter((e) => !(btn.dataset.dir === "out" ? e.from === n.id && e.to === o : e.from === o && e.to === n.id));
        this._markDirty(); this._render(); return;
      }
      case "close-zone": this._sel.zone = null; this._render(); return;
      case "close-remote": this._sel.remote = null; this._stopLearn(); this._render(); return;
    }
  }

  _entityList(ctx) { return ctx === "node" ? this._node(this._sel.node).entities : []; }

  _freeSpot() {
    const taken = this._draft.nodes;
    for (let y = 40; y < 4000; y += 140) for (let x = 40; x < 1200; x += 200) {
      if (!taken.some((n) => Math.abs(n.x - x) < NODE_W + 20 && Math.abs(n.y - y) < NODE_H + 20)) return { x, y };
    }
    return { x: 40, y: 40 };
  }

  _addEntity(input) {
    let v = input.value.trim();
    if (!v) return;
    if (!this._hass.states[v]) {
      const m = Object.entries(this._hass.states).find(([, s]) => s.attributes.friendly_name === v);
      if (m) v = m[0];
    }
    if (!ENTITY_RE.test(v)) return;
    const list = this._entityList(input.dataset.ctx);
    if (!list.includes(v)) list.push(v);
    const n = this._node(this._sel.node);
    if (n && !n.name) n.name = this._friendly(v);
    this._markDirty(); this._render();
    this._main.querySelector(`.entity-input[data-ctx="${input.dataset.ctx}"]`)?.focus();
  }

  _onKey(ev) {
    if (ev.key === "Enter" && ev.target.classList?.contains("entity-input")) { ev.preventDefault(); this._addEntity(ev.target); return; }
    if ((ev.key === "Delete" || ev.key === "Backspace") && this._tab === "flow" && this._sel.edge && !["INPUT", "TEXTAREA", "SELECT"].includes(ev.target.tagName)) {
      ev.preventDefault(); this._onClick({ target: this.shadowRoot.querySelector('[data-act="del-edge"]') || this._main });
    }
  }

  _setPath(obj, path, val) {
    const parts = path.split("."); let o = obj;
    for (const p of parts.slice(0, -1)) o = o[p] ||= {};
    o[parts[parts.length - 1]] = val;
  }

  _onInput(ev) {
    const t = ev.target; const d = this._draft;
    if (!d) return;
    if (t.dataset.nf) {
      const n = this._node(this._sel.node); if (!n) return;
      const num = ["delay_on", "delay_off"].includes(t.dataset.nf);
      this._setPath(n, t.dataset.nf, num ? Number(t.value || 0) : t.value);
      if (t.dataset.nf === "name") { const el = this._main.querySelector(`.node[data-id="${CSS.escape(n.id)}"] .nname`); if (el) el.textContent = t.value || IMAGES[n.image]?.[0]; }
      this._markDirty();
    } else if (t.dataset.cf) {
      const c = t.closest("[data-ci]"); const n = this._node(this._sel.node);
      n[c.dataset.wpath].conditions[Number(c.dataset.ci)][t.dataset.cf] = t.value; this._markDirty();
    } else if (t.dataset.wf && t.dataset.wf === "timeout") {
      this._node(this._sel.node)[t.dataset.wpath].timeout = Number(t.value || 60); this._markDirty();
    } else if (t.dataset.rr && t.type === "number") {
      const n = this._node(t.closest("[data-rowid]").dataset.rowid); n[t.dataset.rr] = Number(t.value || 0); this._markDirty();
    } else if (t.dataset.zf) {
      d.zones.find((z) => z.id === this._sel.zone)[t.dataset.zf] = t.dataset.zf === "led_minutes" ? Number(t.value || 0) : t.value; this._markDirty();
    } else if (t.dataset.rf === "name") {
      d.remotes.find((r) => r.id === this._sel.remote).name = t.value; this._markDirty();
    } else if (t.hasAttribute("data-revdata")) {
      const r = d.remotes.find((x) => x.id === this._sel.remote); r._dataText = t.value;
      try { const data = t.value.trim() ? JSON.parse(t.value) : {}; r.trigger = { platform: "event", event_type: r.trigger?.event_type || "", event_data: data }; } catch (e) { /* validated on save */ }
      this._markDirty();
    }
  }

  _onChange(ev) {
    const t = ev.target; const d = this._draft;
    if (!d) return;
    if (t.classList.contains("entity-input")) { if (this._hass.states[t.value.trim()]) this._addEntity(t); return; }
    if (t.dataset.nf && (t.tagName === "SELECT" || t.dataset.nf === "name")) {
      const n = this._node(this._sel.node); this._setPath(n, t.dataset.nf, t.value); this._markDirty(); this._render(); return;
    }
    if (t.dataset.cf === "entity_id") { this._render(); return; }
    if (t.dataset.link && t.value) {
      const n = this._node(this._sel.node);
      const e = t.dataset.link === "out" ? { from: n.id, to: t.value } : { from: t.value, to: n.id };
      if (wouldCycle(d, e.from, e.to)) { this._toast("Det skulle skapa en loop.", true); this._render(); return; }
      d.edges.push(e); this._markDirty(); this._render(); return;
    }
    if (t.dataset.wf && t.tagName === "SELECT") { this._node(this._sel.node)[t.dataset.wpath][t.dataset.wf] = t.value; this._markDirty(); return; }
    if (t.dataset.rr === "rank") { this._node(t.closest("[data-rowid]").dataset.rowid).rank = t.value; this._markDirty(); this._render(); return; }
    if (t.dataset.rr) { this._render(); return; }
    if (t.dataset.zf === "name") { this._render(); return; }
    if (t.dataset.zn) {
      const z = d.zones.find((x) => x.id === this._sel.zone);
      z.nodes = t.checked ? [...new Set([...z.nodes, t.dataset.zn])] : z.nodes.filter((x) => x !== t.dataset.zn);
      this._markDirty(); this._render(); return;
    }
    const r = d.remotes.find((x) => x.id === this._sel.remote);
    if (!r) return;
    if (t.dataset.rf) {
      r[t.dataset.rf] = t.type === "checkbox" ? t.checked : t.value; this._markDirty(); this._render(); return;
    }
    if (t.hasAttribute("data-rdev")) { this._pendingDevice = t.value; this._devTriggers = null; if (r.trigger?.platform === "device") r.trigger = null; this._render(); return; }
    if (t.hasAttribute("data-rtrig")) {
      if (t.value === "") return;
      r.kind = "device"; r.trigger = clone(this._devTriggers[Number(t.value)]); r.event_type = null;
      if (!r.name) r.name = this._triggerText(r);
      this._markDirty(); this._render(); return;
    }
    if (t.hasAttribute("data-rent")) {
      const v = t.value.trim(); if (!ENTITY_RE.test(v)) return;
      r.kind = "entity"; r.trigger = { platform: "state", entity_id: [v], to: null }; r.event_type = null;
      if (!r.name) r.name = this._friendly(v);
      this._markDirty(); this._render(); return;
    }
    if (t.hasAttribute("data-revt")) { r.event_type = t.value || null; this._markDirty(); this._render(); return; }
    if (t.hasAttribute("data-rto")) { r.trigger.to = t.value.trim() === "" ? null : t.value.trim(); this._markDirty(); this._render(); return; }
    if (t.hasAttribute("data-revname")) {
      r.kind = "event"; r.trigger = { platform: "event", event_type: t.value.trim(), event_data: r.trigger?.event_data || {} };
      this._markDirty(); this._render(); return;
    }
  }

  _onHover(ev) {
    if (this._tab !== "control") return;
    const card = ev.target.closest?.(".zone-card");
    const id = card ? card.dataset.zone : null;
    if (id === this._hl) return;
    if (!card && ev.target.closest?.(".zone-grid")) return; // gap between cards
    this._hl = id;
    this._main.querySelectorAll(".zone-card").forEach((c) => c.classList.toggle("hl", c.dataset.zone === id));
    const canvas = this._main.querySelector(".canvas");
    if (!canvas) return;
    const cfg = this._config;
    const set = id ? closure(cfg, [id]) : null;
    const z = cfg.zones.find((x) => x.id === id);
    canvas.querySelectorAll(".node").forEach((el) => {
      el.classList.toggle("hl", !!set?.has(el.dataset.id));
      el.classList.toggle("dim", !!set && !set.has(el.dataset.id));
      if (z) el.style.setProperty("--hlc", z.color);
    });
  }

  /* ------------------------------------------------------- drag & connect */
  _onPointerDown(ev) {
    if (this._tab !== "flow" || ev.button > 0) return;
    const canvas = ev.target.closest(".canvas.editable");
    if (!canvas) return;
    const nodeEl = ev.target.closest(".node");
    if (!nodeEl) return;
    const port = ev.target.closest(".port-out");
    const n = this._node(nodeEl.dataset.id);
    ev.preventDefault();
    const rect = () => canvas.getBoundingClientRect();
    const k = Number(canvas.dataset.k) || 1;
    const drag = { canvas, n, nodeEl, sx: ev.clientX, sy: ev.clientY, ox: n.x, oy: n.y, moved: false, port: !!port };
    const move = (e) => {
      const dx = (e.clientX - drag.sx) / k, dy = (e.clientY - drag.sy) / k;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
      if (drag.port) {
        const r = rect();
        this._drawEdges(canvas, { x1: n.x + NODE_W, y1: n.y + NODE_H / 2, x2: (e.clientX - r.left) / k, y2: (e.clientY - r.top) / k });
      } else if (drag.moved) {
        n.x = snap(drag.ox + dx); n.y = snap(drag.oy + dy);
        nodeEl.style.left = `${n.x}px`; nodeEl.style.top = `${n.y}px`;
        this._drawEdges(canvas);
      }
    };
    const up = (e) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (drag.port) {
        this._suppressClick = true;
        const target = this.shadowRoot.elementFromPoint(e.clientX, e.clientY)?.closest(".node");
        const to = target?.dataset.id;
        if (to && to !== n.id) {
          if (this._draft.edges.some((x) => x.from === n.id && x.to === to)) this._toast("Kopplingen finns redan.");
          else if (wouldCycle(this._draft, n.id, to)) this._toast("Det skulle skapa en loop – något kan inte startas före sig självt.", true);
          else { this._draft.edges.push({ from: n.id, to }); this._markDirty(); }
        }
        this._render();
        setTimeout(() => (this._suppressClick = false), 0);
      } else if (drag.moved) {
        this._suppressClick = true;
        this._markDirty();
        this._render();
        setTimeout(() => (this._suppressClick = false), 0);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  /* ----------------------------------------------------------------- save */
  _parseData(text, label) {
    if (!text || !text.trim()) return {};
    let v;
    try { v = JSON.parse(text); } catch (e) { throw new Error(`${label}: ogiltig JSON.`); }
    if (typeof v !== "object" || v === null || Array.isArray(v)) throw new Error(`${label}: extra data måste vara ett JSON-objekt.`);
    return v;
  }

  _cleanNode(n) {
    const label = n.name || "Utrustning";
    const spec = (s, def) => {
      const action = s?.action || def;
      if (action === "service" && !ENTITY_RE.test(s.service || "")) throw new Error(`${label}: ange tjänst som domän.tjänst.`);
      return { action, service: action === "service" ? s.service : "", data: action === "none" ? {} : this._parseData(s?._dataText, label) };
    };
    const wait = (w) => {
      if (!w || !w.conditions?.length) return null;
      const conditions = w.conditions.filter((c) => c.entity_id).map((c) => {
        if (!ENTITY_RE.test(c.entity_id)) throw new Error(`${label}: ogiltig entitet "${c.entity_id}" i villkor.`);
        return { entity_id: c.entity_id, attribute: c.attribute || "", state: c.state || "" };
      });
      return conditions.length ? { mode: w.mode || "all", timeout: Number(w.timeout || 60), on_timeout: w.on_timeout || "continue", conditions } : null;
    };
    return {
      id: n.id, name: n.name || "", image: n.image || "generic", entities: n.entities || [],
      on: spec(n.on, "turn_on"), off: spec(n.off, "turn_off"),
      delay_on: Number(n.delay_on || 0), delay_off: Number(n.delay_off || 0), rank: n.rank || "normal",
      wait_on: wait(n.wait_on), wait_off: wait(n.wait_off), x: n.x, y: n.y,
    };
  }

  async _save() {
    const d = this._draft;
    let cfg;
    try {
      cfg = {
        nodes: d.nodes.map((n) => this._cleanNode(n)),
        edges: d.edges.map((e) => ({ from: e.from, to: e.to })),
        zones: d.zones.map((z) => {
          if (!z.name.trim()) throw new Error("En grupp saknar namn.");
          const led = (z.led || "").trim();
          if (led && !ENTITY_RE.test(led)) throw new Error(`${z.name}: ogiltig LED-entitet.`);
          return { id: z.id, name: z.name.trim(), icon: z.icon || "", color: z.color, nodes: z.nodes, led, led_minutes: Number(z.led_minutes ?? 30) };
        }),
        remotes: d.remotes.map((r) => {
          if (r.kind === "event" || r.trigger?.platform === "event") {
            const data = this._parseData(r._dataText, r.name || "Fjärrkontroll");
            if (!r.trigger?.event_type) throw new Error(`${r.name || "Fjärrkontroll"}: ange händelsetyp.`);
            r.trigger = { platform: "event", event_type: r.trigger.event_type, event_data: data };
          }
          return { id: r.id, name: r.name || "", enabled: r.enabled !== false, kind: r.kind || "event", trigger: r.trigger || null,
            event_type: r.event_type || null, target: r.target, action: r.action || "toggle" };
        }),
      };
    } catch (e) { this._saveError = e.message; this._renderSaveBar(); return; }

    this._saving = true;
    try {
      const res = await this._hass.callWS({ type: "sequencer/config/save", config: cfg });
      this._config = res.config; this._live = res.state;
      this._resetDraft();
      this._render();
      this._toast("Sparat ✓");
    } catch (e) {
      this._saveError = `Kunde inte spara: ${e.message || e}`; this._renderSaveBar();
    } finally { this._saving = false; }
  }
}

customElements.define("sequencer-panel", SequencerPanel);
console.info(`%c SEQUENCER %c ${VERSION} `, "background:#2196f3;color:#fff", "");
