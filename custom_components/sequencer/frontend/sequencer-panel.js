/* Sequencer – sidebar panel for Home Assistant (plain web component, no build step). */

const VERSION = "2.4.0";
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
  console: ["Ljusbord", IMG(`<rect x="18" y="4" width="28" height="14" rx="1.5"/><path d="M24 14l4-5 4 3 4-4 4 6"/><path d="M3 42l7-18h44l7 18z"/><path d="M15 38v-9M22 38v-9M29 38v-9M36 38v-9M43 38v-9M50 38v-9"/><path d="M13 33h4M20 31h4M27 35h4M34 32h4M41 30h4M48 34h4"/>`)],
  spot: ["Strålkastare", IMG(`<rect x="10" y="13" width="26" height="18" rx="3"/><path d="M36 11l12-5v32l-12-5z"/><path d="M23 31v7M15 42h16"/><path d="M53 14l6-3M54 22h7M53 30l6 3"/>`)],
  par: ["PAR-lampa", IMG(`<path d="M10 14h22l8 10-8 10H10z"/><ellipse cx="42" cy="24" rx="4" ry="12"/><path d="M18 34v6M12 42h14M10 14V8h22v6"/>`)],
  movinghead: ["Moving head", IMG(`<rect x="16" y="38" width="32" height="7" rx="2"/><path d="M20 38V20a4 4 0 0 1 4-4M44 38V20a4 4 0 0 0-4-4"/><circle cx="32" cy="21" r="10"/><circle cx="32" cy="21" r="4"/>`)],
  dimmer: ["Dimmerrack", IMG(`<rect x="3" y="12" width="58" height="24" rx="2"/><circle cx="13" cy="24" r="4.5"/><circle cx="26" cy="24" r="4.5"/><circle cx="39" cy="24" r="4.5"/><path d="M13 24l2.5-3M26 24l2.5-3M39 24l2.5-3"/><path d="M50 18v12M55 18v12"/>`)],
  dmxnode: ["DMX-nod", IMG(`<rect x="6" y="12" width="52" height="24" rx="3"/><circle cx="22" cy="24" r="7"/><circle cx="42" cy="24" r="7"/><path d="M19.5 22h.01M24.5 22h.01M22 27h.01M39.5 22h.01M44.5 22h.01M42 27h.01"/><path d="M12 8l6 4M52 8l-6 4"/>`)],
  cross: ["Kors", IMG(`<path d="M28 3h8v11h11v8H36v23h-8V22H17v-8h11z"/>`)],
  pc: ["Dator", IMG(`<rect x="4" y="7" width="36" height="25" rx="2"/><path d="M15 41h14M22 32v9"/><rect x="46" y="7" width="14" height="35" rx="2"/><path d="M50 13h6M50 18h6"/><circle cx="53" cy="35" r="2"/>`)],
  generic: ["Övrigt", IMG(`<rect x="10" y="10" width="44" height="28" rx="4"/><path d="M32 16v8"/><path d="M26 19.5a8 8 0 1 0 12 0"/>`)],
};

const ICON_PRESS = `<ha-icon class="bi" icon="mdi:gesture-tap-button"></ha-icon>`;
const ICON_WATCH = `<ha-icon class="bi" icon="mdi:eye-outline"></ha-icon>`;
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
function autoStart(cfg, zid) { const need = closure(cfg, [zid]); return order(cfg).filter((n) => need.has(n)); }
function zoneNeeds(cfg, zid) {
  const z = cfg.zones.find((x) => x.id === zid);
  if (z?.custom) { const ids = new Set(cfg.nodes.map((n) => n.id)); return new Set(z.custom.start.map((s) => s.node).filter((n) => ids.has(n))); }
  return closure(cfg, [zid]);
}
function zoneSteps(cfg, z, which) {
  if (z.custom) return z.custom[which];
  const a = autoStart(cfg, z.id);
  const base = (which === "start" ? a : [...a].reverse()).map((n) => ({ node: n, delay: null, force: false }));
  return mergeExtras(base, z.extras?.[which] || []);
}
function mergeExtras(base, extras) {
  const anchors = new Set(base.map((s) => s.node));
  const out = extras.filter((e) => !e.after).map((e) => e.step);
  for (const st of base) { out.push(st); out.push(...extras.filter((e) => e.after && e.after === st.node).map((e) => e.step)); }
  out.push(...extras.filter((e) => e.after && !anchors.has(e.after)).map((e) => e.step));
  return out;
}
const isMoment = (st) => st?.kind === "action";
function momentType(st) {
  if (st.wait?.conditions?.length) return "wait";
  const a = st.spec?.action || "none";
  return a === "none" ? "pause" : a;
}
const MOMENT_TYPES = [["light", "💡 Ljus: färg / dimning"], ["turn_on", "⏻ Slå på entitet"], ["turn_off", "⭘ Stäng av entitet"], ["pause", "⏸ Paus"],
  ["wait", "⏳ Vänta tills…"], ["dmx", "🎚 DMX-scen"], ["service", "⚙ Tjänst"]];
const MOMENT_ICON = { light: "💡", light_off: "💡", turn_on: "⏻", turn_off: "⭘", pause: "⏸", wait: "⏳", dmx: "🎚", service: "⚙", wol: "🖥", rpc_shutdown: "🖥" };
function seqOutdated(cfg, z) {
  if (!z.custom || z.standalone) return false;
  const a = autoStart(cfg, z.id);
  return JSON.stringify(a) !== JSON.stringify(z.custom.base_start || []);
}
function ruleWarnings(cfg, steps, which) {
  const idx = Object.fromEntries(steps.map((s, i) => [s.node, i]).filter(([n]) => n));
  const name = (id) => cfg.nodes.find((n) => n.id === id)?.name || "?";
  const warn = {};
  for (const e of cfg.edges) {
    if (!(e.from in idx) || !(e.to in idx)) continue;
    if (which === "start" && idx[e.to] < idx[e.from]) (warn[e.to] ||= []).push(`Regeln säger att ${name(e.from)} startas före`);
    if (which === "stop" && idx[e.from] < idx[e.to]) (warn[e.from] ||= []).push(`Regeln säger att ${name(e.to)} stängs av före`);
  }
  return warn;
}
function wouldCycle(cfg, from, to) {
  if (from === to) return true;
  return descendants(childrenMap(cfg), to).has(from);
}
function guessImage(c) {
  const t = `${c.entity_id} ${c.name || ""}`.toLowerCase();
  const rules = [[/ljusbord|console|grandma|chamsys|eos/, "console"], [/kors|cross/, "cross"], [/moving/, "movinghead"], [/strålkast|stralkast|spot|fresnel|profil/, "spot"],
    [/\bpar\b|par-|par_/, "par"], [/dimmer/, "dimmer"], [/dmx|artnet|art-net|sacn/, "dmxnode"], [/dator|pc\b|windows|desktop|computer|_pc/, "pc"], [/mixer|mixerbord/, "mixer"], [/slutsteg|amp|förstärk|forstark/, "amp"], [/dsp|processor/, "dsp"], [/receiver|reciever/, "receiver"],
    [/sub/, "sub"], [/tak|ceiling/, "ceiling"], [/högtal|hogtal|speaker/, "speaker"], [/projekt/, "projector"], [/tv|skärm|display|monitor/, "tv"],
    [/mic|mikrofon/, "mic"], [/switch|nätverk|router|poe/, "network"], [/stream|sonos|spelare|player|chromecast|apple/, "streamer"],
    [/uttag|plug|ström|power|socket|grenuttag/, "power"]];
  for (const [re, img] of rules) if (re.test(t)) return img;
  if (c.domain === "light") return "light";
  if (c.domain === "media_player") return "streamer";
  return "generic";
}
const ENTITY_STATE_ACTIONS = ["turn_on", "light", "wol"];
const entityBased = (n) => (n.entities || []).length > 0 && ENTITY_STATE_ACTIONS.includes((n.on || {}).action || "turn_on");
const MAC_RE = /^([0-9a-f]{2}[:-]?){5}[0-9a-f]{2}$/i;
function parseChannels(text) {
  const out = {};
  for (let part of String(text || "").split(/[,;\n]+/)) {
    part = part.trim(); if (!part) continue;
    const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?\s*[=:]\s*(\d+(?:[.,]\d+)?)\s*(%)?$/);
    if (!m) throw new Error(`Kan inte tolka "${part}" – skriv t.ex. 1=255, 2-4=50%`);
    const a = +m[1], b = +(m[2] || m[1]); let v = parseFloat(m[3].replace(",", ".")); if (m[4]) v = v * 255 / 100;
    if (!(a >= 1 && a <= b && b <= 512)) throw new Error(`Kanal utanför 1–512 i "${part}"`);
    if (!(v >= 0 && v <= 255)) throw new Error(`Värde utanför 0–255 i "${part}"`);
    for (let c = a; c <= b; c++) out[c] = Math.round(v);
  }
  return out;
}

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

.img-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(64px,1fr)); gap:6px; }
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
.dotw { display:inline-block; width:10px; height:10px; border-radius:50%; vertical-align:middle; flex:none; }
.dotw.y { background:#f9b800; } .dotw.o { background:#ef6c00; }
.banner { border-radius:10px; padding:10px 12px; margin:10px 0; font-size:14px; line-height:1.5; }
.banner.o { background:color-mix(in srgb, #ef6c00 14%, transparent); border:1px solid color-mix(in srgb, #ef6c00 45%, transparent); }
.banner.y { background:color-mix(in srgb, #f9b800 14%, transparent); border:1px solid color-mix(in srgb, #f9b800 50%, transparent); }
.steps { border:1px solid var(--divider-color); border-radius:10px; overflow:hidden; }
.step { display:flex; align-items:center; gap:8px; padding:8px 10px; border-bottom:1px solid var(--divider-color); flex-wrap:wrap; }
.step:last-child { border-bottom:none; }
.step .num { width:22px; height:22px; border-radius:50%; background:var(--primary-color); color:var(--text-primary-color,#fff); font-size:12px; display:flex; align-items:center; justify-content:center; flex:none; }
.step svg { width:34px; height:26px; color:var(--secondary-text-color); flex:none; }
.step .t { flex:1; min-width:140px; font-size:14px; }
.step .t small { display:block; color:var(--secondary-text-color); font-size:12px; }
.step .t .w { color:#ef6c00; }
.step input[type=number] { width:72px; }
.step input[type=number]:not(:placeholder-shown) { border-color:#f9b800; }
.sub-nav { display:flex; max-width:340px; margin:0 0 12px; }
/* ---- learn box */
.learnbox { margin:8px 0; }
ha-icon.bi { --mdc-icon-size:18px; vertical-align:-4px; margin-right:6px; }
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
:host([mobile]) .img-grid { grid-template-columns:repeat(auto-fill,minmax(70px,1fr)); }
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
    root.addEventListener("value-changed", (e) => this._onPicked(e));
    this._loadPicker();
    this._ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      const m = w > 0 && w < 760;
      requestAnimationFrame(() => {
        if (m !== this._mobile) { this._mobile = m; this.toggleAttribute("mobile", m); this._render(); }
        else this._fitDiagrams();
      });
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
    if (this._usePicker && this._main && Date.now() - (this._pickerHassT || 0) > 2000) {
      this._pickerHassT = Date.now();
      this._main.querySelectorAll("ha-entity-picker[data-ep]").forEach((el) => (el.hass = this._hass));
    }
  }

  _resetDraft() {
    const d = clone(this._config);
    for (const n of d.nodes) for (const k of ["on", "off"]) {
      n[k] = n[k] || {};
      n[k]._dataText = n[k].data && Object.keys(n[k].data).length ? JSON.stringify(n[k].data, null, 2) : "";
    }
    for (const r of d.remotes) r._dataText = r.trigger?.event_data ? JSON.stringify(r.trigger.event_data, null, 2) : "";
    const prepMoment = (st) => { if (isMoment(st) && st.spec) st.spec._dataText = st.spec.data && Object.keys(st.spec.data).length ? JSON.stringify(st.spec.data, null, 2) : ""; };
    for (const z of d.zones) {
      for (const w of ["start", "stop"]) { (z.custom?.[w] || []).forEach(prepMoment); (z.extras?.[w] || []).forEach((e) => prepMoment(e.step)); }
    }
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
    // Replacing innerHTML blurs the focused input, which can fire "change" and re-enter here.
    if (this._inRender) { this._renderAgain = true; return; }
    this._inRender = true;
    try { this._doRender(); } finally { this._inRender = false; }
    if (this._renderAgain) { this._renderAgain = false; queueMicrotask(() => this._render()); }
  }

  _doRender() {
    const tabs = [["control", "Styrning", "Styrning", "mdi:play-circle-outline"], ["flow", "Utrustning & regler", "Utrustning", "mdi:sitemap-outline"],
      ["zones", "Grupper", "Grupper", "mdi:speaker-multiple"], ["seqs", "Sekvenser", "Sekvenser", "mdi:playlist-play"], ["remotes", "Fjärrkontroller", "Fjärrar", "mdi:remote"]];
    this.shadowRoot.getElementById("tabs").innerHTML = tabs
      .map(([k, l, short, icon]) => `<button class="tab ${this._tab === k ? "sel" : ""}" data-act="tab" data-tab="${k}"><ha-icon icon="${icon}"></ha-icon><span>${this._mobile ? short : l}</span></button>`).join("");

    // keep scroll + focus across re-renders
    const scrolls = [...this._main.querySelectorAll(".dg-scroll")].map((el) => [el.dataset.dg, el.scrollLeft, el.scrollTop]);
    const focus = this._focusKey();
    const winY = window.scrollY;

    if (this._tab !== "control" && !this._draft) this._resetDraft();
    if (this._tab !== "control") this._fillDatalistsOnce();
    const html = { control: () => this._controlTab(), flow: () => (this._sub === "rules" ? this._rulesTab() : this._flowTab()), zones: () => this._zonesTab(), seqs: () => this._seqsTab(), remotes: () => this._remotesTab() }[this._tab]();
    this._main.innerHTML = html;
    this.toggleAttribute("sheet", !!this._main.querySelector(".sheet"));

    this._main.querySelectorAll(".canvas").forEach((c) => this._drawEdges(c));
    this._fitDiagrams();
    this._initPickers();
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
    if (!el || !this._main.contains(el) || el.tagName === "HA-ENTITY-PICKER") return null;
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
      for (const nid of zoneNeeds(cfg, z.id)) (zoneDots[nid] ||= []).push(col);
    });
    const hlSet = highlight ? zoneNeeds(cfg, highlight) : null;
    const hlZone = highlight ? cfg.zones.find((z) => z.id === highlight) : null;
    const hlColor = hlZone ? hlZone.color || ZONE_COLORS[cfg.zones.indexOf(hlZone) % ZONE_COLORS.length] : "";
    const nodes = cfg.nodes.map((n) => {
      const img = IMAGES[n.image] || IMAGES.generic;
      const one = (n.entities || []).length === 1 ? (this._friendly(n.entities[0]) === n.name ? n.entities[0] : this._friendly(n.entities[0])) : "";
      const sub = (n.entities || []).length ? (one || `${n.entities.length} entiteter`)
        : n.on?.action === "service" ? n.on.service
        : n.on?.action === "dmx" ? `DMX ${n.on.protocol === "sacn" ? "sACN" : "Art-Net"} U${n.on.universe ?? 0}${n.on.host ? " · " + n.on.host : ""}`
        : n.on?.action === "wol" ? "Wake on LAN" : "endast i schemat";
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
        <p><b>1. Utrustning</b> – lägg till din utrustning (mixer, DSP, slutsteg …) och dra pilar mellan dem.
        En pil betyder att något <i>startas före</i> nästa sak och <i>stängs av efter</i>.</p>
        <p><b>2. Regler</b> (under Utrustning) – finjustera ordning, prioritet ("alltid först"), fördröjningar och villkor som "vänta tills slutsteget rapporterar på".</p>
        <p><b>3. Grupper</b> – skapa t.ex. ett rum per grupp och välj vilken utrustning rummet behöver. Delad utrustning (t.ex. en gemensam mixer) startas när första gruppen startar och stängs av först när sista gruppen stängs av.</p>
        <p><b>4. Sekvenser</b> – varje grupp får en sekvens automatiskt. Justera den för hand om du vill, eller gör egna sekvenser utan grupper.</p>
        <p><b>5. Fjärrkontroller</b> – koppla knappar direkt till grupper och sekvenser, utan automationer.</p></div>
        <div class="btns"><button class="primary" data-act="tab" data-tab="flow">Öppna flödesschemat</button></div></div>
        ${cfg.nodes.length ? `<div class="card pad0">${this._diagram("config")}</div>` : ""}</div>`;
    }
    const cards = cfg.zones.map((z, i) => {
      const col = z.color || ZONE_COLORS[i % ZONE_COLORS.length];
      const n = zoneNeeds(cfg, z.id).size;
      return `<div class="card zone-card ${this._hl === z.id ? "hl" : ""}" data-zone="${esc(z.id)}" style="--zc:${col}">
        <div class="zc-head"><ha-icon icon="${esc(z.icon || (z.standalone ? "mdi:playlist-play" : "mdi:speaker-multiple"))}"></ha-icon><span class="zc-name">${esc(z.name)}</span>${z.led ? `<span class="led" data-zled="${esc(z.id)}" title="Status-LED"></span>` : ""}<span class="badge" data-zbadge="${esc(z.id)}"></span></div>
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
  _subNav() {
    const sub = this._sub || "schema";
    return `<div class="seg sub-nav"><button class="${sub === "schema" ? "sel" : ""}" data-act="sub" data-sub="schema">Schema</button><button class="${sub === "rules" ? "sel" : ""}" data-act="sub" data-sub="rules">Regler</button></div>`;
  }

  _flowTab() {
    const node = this._draft.nodes.find((n) => n.id === this._sel.node);
    return `<div class="content wide">${this._subNav()}
      <div class="tools">
        <button class="primary" data-act="add-node">+ Lägg till utrustning</button>
        <button data-act="learn-toggle" data-target="new" class="${this._learn?.target === "new" ? "primary learn-on" : ""}">${this._learn?.target === "new" ? "Lyssnar… <span data-learn-left></span> s" : `${ICON_PRESS}Lägg till med knapptryck`}</button>
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
    const zonesUsing = cfg.zones.filter((z) => zoneNeeds(cfg, z.id).has(n.id));
    const actSel = (path, opts, cur) => `<select data-nf="${path}">${opts.map(([v, l]) => `<option value="${v}" ${cur === v ? "selected" : ""}>${l}</option>`).join("")}</select>`;
    const spec = (k) => {
      const s = n[k] || {};
      const def = k === "on" ? "turn_on" : "turn_off";
      const cur = s.action || def;
      const opts = k === "on"
        ? [["turn_on", "Slå på entiteterna"], ["light", "Tänd / dimma ljus"], ["wol", "Wake on LAN (starta dator)"], ["dmx", "DMX (Art-Net / sACN)"], ["service", "Anropa tjänst…"], ["none", "Ingen åtgärd"]]
        : [["turn_off", "Stäng av entiteterna"], ["light_off", "Släck / dimma ner ljus"], ["rpc_shutdown", "Stäng av Windows-dator (RPC)"], ["dmx_off", "DMX – släck samma kanaler"], ["dmx", "DMX – egna värden"], ["service", "Anropa tjänst…"], ["none", "Ingen åtgärd"]];
      return `<div class="row"><label class="grow">${actSel(`${k}.action`, opts, cur)}</label>
        ${cur === "service" ? `<label class="grow"><input data-nf="${k}.service" list="services" value="${esc(s.service || "")}" placeholder="t.ex. media_player.select_source"></label>` : ""}</div>
        ${this._actionFields(n, k, cur, s)}
        ${["turn_on", "turn_off", "service", "light"].includes(cur) ? `<details ${s._dataText ? "open" : ""}><summary>Extra data (JSON)</summary>
          <textarea data-nf="${k}._dataText" placeholder='{"source": "TV"}'>${esc(s._dataText || "")}</textarea></details>` : ""}`;
    };
    return `<div class="side-head"><b>Utrustning</b><button class="icon" data-act="close-node" title="Stäng">✕</button></div>
      <label>Namn<input data-nf="name" value="${esc(n.name)}" placeholder="T.ex. Slutsteg kök"></label>
      <div class="lbl">Bild</div>
      <div class="img-grid">${Object.entries(IMAGES).map(([k, [l, svg]]) => `<button class="img-opt ${n.image === k ? "sel" : ""}" data-act="set-image" data-img="${k}" title="${l}">${svg}<span>${l}</span></button>`).join("")}</div>
      <div class="lbl">Entiteter som styrs</div>
      ${this._chips(n.entities, "node")}
      ${this._learnBox("node", `${ICON_PRESS}Lyssna – tryck på knappen på enheten`, "Lägg till")}
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

  _actionFields(n, k, cur, s, attr = "data-nf") {
    const num = (f, label, v, attrs = "") => `<label>${label}<input type="number" ${attr}="${k}.${f}" value="${esc(v ?? "")}" ${attrs} style="width:100px"></label>`;
    const txt = (f, label, v, ph = "", type = "text") => `<label class="grow">${label}<input type="${type}" ${attr}="${k}.${f}" value="${esc(v ?? "")}" placeholder="${esc(ph)}" autocomplete="off"></label>`;
    const chk = (f, label, v) => `<label style="flex-direction:row;align-items:center;gap:6px;font-size:13px;color:var(--primary-text-color)"><input type="checkbox" ${attr}="${k}.${f}" ${v ? "checked" : ""}>${label}</label>`;
    const presets = (f, list) => `<div class="chips" style="margin:2px 0 6px">${list.map(([v, l]) => `<button class="small ${Number(s[f] ?? 0) === v ? "primary" : ""}" data-act="preset" data-pattr="${attr}" data-path="${k}.${f}" data-v="${v}">${l}</button>`).join("")}</div>`;
    const fadeList = [[0, "Direkt"], [1, "Snabbt 1 s"], [3, "Mjukt 3 s"], [10, "Långsamt 10 s"], [30, "30 s"]];
    if (cur === "light") {
      const lights = (n.entities || []).filter((e) => e.startsWith("light."));
      return `${lights.length ? "" : `<div class="err" style="margin-bottom:6px">Lägg till minst en light-entitet ovan.</div>`}
        <label>Ljusstyrka: <b data-show="${k}.brightness">${esc(s.brightness ?? 100)} %</b><input type="range" min="0" max="100" step="1" ${attr}="${k}.brightness" value="${esc(s.brightness ?? 100)}"></label>
        <div class="lbl" style="margin:8px 0 2px">Övergång</div>${presets("transition", fadeList)}
        <div class="row">${num("transition", "Sekunder", s.transition ?? 0, 'min="0" step="0.5"')}</div>
        <div class="row"><label>Färg<select ${attr}="${k}.color_mode">${[["none", "Behåll"], ["rgb", "Välj färg"], ["temp", "Färgtemperatur"]].map(([v, l]) => `<option value="${v}" ${(s.color_mode || "none") === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
          ${s.color_mode === "rgb" ? `<label>Färg<input type="color" ${attr}="${k}.rgb" value="${esc(s.rgb || "#ffffff")}" style="width:64px;height:38px;padding:2px"></label>` : ""}
          ${s.color_mode === "temp" ? `<label class="grow">Temperatur: <b data-show="${k}.kelvin">${esc(s.kelvin || 3000)} K</b><input type="range" min="2000" max="6500" step="100" ${attr}="${k}.kelvin" value="${esc(s.kelvin || 3000)}"></label>` : ""}</div>
        ${chk("wait", "Vänta tills övergången är klar innan nästa steg", s.wait)}`;
    }
    if (cur === "light_off") {
      return `<div class="lbl" style="margin:8px 0 2px">Övergång</div>${presets("transition", fadeList)}
        <div class="row">${num("transition", "Sekunder", s.transition ?? 0, 'min="0" step="0.5"')}</div>${chk("wait", "Vänta tills övergången är klar", s.wait)}`;
    }
    if (cur === "wol") {
      return `<div class="row">${txt("mac", "MAC-adress", s.mac, "AA:BB:CC:DD:EE:FF")}</div>
        <div class="row">${txt("broadcast", "Broadcast-adress (valfritt)", s.broadcast, "255.255.255.255")}${num("port", "Port", s.port ?? 9, 'min="1" max="65535"')}</div>
        <div class="hint">Tips: lägg till en ping-sensor (binary_sensor) för datorn som entitet ovan. Då visas om den är igång, och du kan använda "vänta tills" för nästa steg.</div>`;
    }
    if (cur === "rpc_shutdown") {
      return `<div class="row">${txt("host", "Dator (IP eller namn)", s.host, "192.168.1.50")}</div>
        <div class="row">${txt("username", "Användare", s.username, "admin")}${txt("password", "Lösenord", s.password, "", "password")}</div>
        <div class="row">${txt("domain", "Domän (valfritt)", s.domain, "")}${num("timeout", "Fördröjning (s)", s.timeout ?? 0, 'min="0" max="600"')}</div>
        ${chk("force", "Tvinga stängning av öppna program", s.force !== false)} ${chk("reboot", "Starta om i stället för att stänga av", s.reboot)}
        <details><summary>Så förbereder du Windows-datorn</summary><div class="hint" style="line-height:1.6">
          1. Kontot ska vara administratör på datorn.<br>
          2. Tillåt <i>Fil- och skrivardelning</i> i Windows-brandväggen (port 445).<br>
          3. För ett <b>lokalt</b> konto (inte domän/Microsoft-konto): kör som admin<br><code>reg add HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System /v LocalAccountTokenFilterPolicy /t REG_DWORD /d 1 /f</code><br>
          Samma krav som för <code>shutdown /s /m \\dator</code>. Första gången installeras ett hjälpbibliotek i HA (kan ta en minut).
          Lösenordet sparas i HA:s lagring.</div></details>`;
    }
    if (cur === "dmx") {
      return `<div class="row"><label>Protokoll<select ${attr}="${k}.protocol">${[["artnet", "Art-Net"], ["sacn", "sACN (E1.31)"]].map(([v, l]) => `<option value="${v}" ${(s.protocol || "artnet") === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
          ${num("universe", "Universum", s.universe ?? (s.protocol === "sacn" ? 1 : 0), 'min="0" max="63999"')}</div>
        <div class="row">${txt("host", "IP till DMX-noden (tomt = broadcast/multicast)", s.host, s.protocol === "sacn" ? "multicast" : "255.255.255.255")}</div>
        <label>Kanaler och värden<textarea ${attr}="${k}.channels" placeholder="1=255, 2-4=50%, 10=128" style="font-family:monospace">${esc(s.channels || "")}</textarea></label>
        <div class="hint">Värde 0–255 eller procent. Intervall med bindestreck, t.ex. <code>1-12=100%</code>.</div>
        <div class="lbl" style="margin:8px 0 2px">Fade</div>${presets("fade", fadeList)}
        <div class="row">${num("fade", "Sekunder", s.fade ?? 0, 'min="0" step="0.5"')}</div>${chk("wait", "Vänta tills faden är klar", s.wait)}`;
    }
    if (cur === "dmx_off") {
      return `<div class="hint">Släcker kanalerna som påslaget tänder.</div><div class="lbl" style="margin:8px 0 2px">Fade</div>${presets("fade", fadeList)}
        <div class="row">${num("fade", "Sekunder", s.fade ?? 0, 'min="0" step="0.5"')}</div>${chk("wait", "Vänta tills faden är klar", s.wait)}`;
    }
    return "";
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

  /** HA's own entity picker (icon, name, area, device) – falls back to a plain search box. */
  _entityField(attrs, value, { domains = null, placeholder = "Välj entitet…", grow = true } = {}) {
    if (this._usePicker) {
      return `<ha-entity-picker data-ep="1" ${attrs} data-value="${esc(value || "")}" ${domains ? `data-domains="${esc(domains.join(","))}"` : ""}
        data-label="${esc(placeholder)}" style="display:block;${grow ? "flex:1;min-width:220px;" : ""}"></ha-entity-picker>`;
    }
    return `<input ${attrs} list="entities" value="${esc(value || "")}" placeholder="${esc(placeholder)}" ${grow ? 'style="flex:1;min-width:180px"' : ""}>`;
  }

  async _loadPicker() {
    if (!customElements.get("ha-entity-picker")) {
      try {
        // Loading the entities-card editor makes HA define ha-entity-picker.
        const helpers = await window.loadCardHelpers?.();
        if (helpers) {
          const card = await helpers.createCardElement({ type: "entities", entities: [] });
          await card?.constructor?.getConfigElement?.();
        }
      } catch (e) { /* fall back below */ }
      await Promise.race([customElements.whenDefined("ha-entity-picker"), new Promise((r) => setTimeout(r, 6000))]);
    }
    const ok = !!customElements.get("ha-entity-picker");
    if (ok !== this._usePicker) { this._usePicker = ok; this._render(); }
  }

  _initPickers() {
    this._main.querySelectorAll("ha-entity-picker[data-ep]").forEach((el) => {
      if (el._seqInit) { el.hass = this._hass; return; }
      el._seqInit = true;
      el.hass = this._hass;
      el.value = el.dataset.value || "";
      el.label = el.dataset.label || "";
      el.allowCustomEntity = true;
      if (el.dataset.domains) el.includeDomains = el.dataset.domains.split(",");
    });
  }

  _onPicked(ev) {
    const el = ev.target?.closest?.("ha-entity-picker[data-ep]");
    if (!el || ev.detail?.value === undefined) return;
    const v = ev.detail.value || "";
    if (el._seqLast === v && Date.now() - (el._seqLastT || 0) < 300) return; // de-duplicate nested events
    el._seqLast = v; el._seqLastT = Date.now();
    el.value = v;
    this._onInput({ target: el });
    this._onChange({ target: el });
  }

  _chips(list, ctx, domains = null) {
    return `<div class="chips">${(list || []).map((e, i) => `<span class="chip">${esc(this._friendly(e))}
      <button data-act="del-entity" data-ctx="${ctx}" data-i="${i}" title="${esc(e)}">×</button></span>`).join("")}
      ${this._entityField(`class="entity-input" data-ctx="${ctx}"`, "", { domains, placeholder: "Lägg till entitet…" })}</div>`;
  }

  _waitEditor(n, key, title) {
    const w = n[key];
    const conds = w?.conditions || [];
    const summary = conds.length ? ` (${conds.length} villkor)` : "";
    return `<details ${conds.length ? "open" : ""}><summary>${title}${summary}</summary>
      ${conds.map((c, i) => `<div class="cond" data-wpath="${key}" data-ci="${i}">
        ${this._entityField('data-cf="entity_id"', c.entity_id, { placeholder: "Entitet" })}
        <input data-cf="attribute" value="${esc(c.attribute || "")}" placeholder="attribut" style="width:84px">
        <span>=</span><input data-cf="state" value="${esc(c.state || "")}" placeholder="on" style="width:84px">
        <button class="icon" data-act="del-cond" title="Ta bort">✕</button></div>`).join("")}
      <button class="small" data-act="add-cond" data-wpath="${key}">+ Villkor</button>
      ${this._learnBox(`cond:${key}`, `${ICON_WATCH}Bevaka status`, "Använd")}
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
    if (!cfg.nodes.length) return `<div class="content">${this._subNav()}<div class="card empty">Lägg till utrustning i <b>Schema</b> först.</div></div>`;
    const waitText = (w) => w?.conditions?.length
      ? w.conditions.map((c) => `${esc(this._friendly(c.entity_id))}${c.attribute ? "." + esc(c.attribute) : ""} = ${esc(c.state || "något")}`).join(w.mode === "any" ? " <b>eller</b> " : " <b>och</b> ") + ` <small>(max ${fmtSec(w.timeout ?? 60)} s)</small>`
      : `<span class="hint">–</span>`;
    const ord = order(cfg);
    return `<div class="content">${this._subNav()}
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
        <div class="hint" style="margin-top:8px">En grupp kör bara den del av ordningen som den behöver. Se fliken Sekvenser.</div>
      </div></div>`;
  }

  /* ----------------------------------------------------------- tab: zones */
  _zonesTab() {
    const cfg = this._draft;
    const z = cfg.zones.find((x) => x.id === this._sel.zone && !x.standalone);
    const list = cfg.zones.filter((x) => !x.standalone).map((x, i) => `<div class="list-item ${x.id === this._sel.zone ? "sel" : ""}" data-act-item="zone" data-id="${esc(x.id)}">
      <span class="sw" style="background:${x.color || ZONE_COLORS[i % 8]}"></span><span class="t">${esc(x.name)}<small>${zoneNeeds(cfg, x.id).size} enheter${x.custom ? " · sekvens anpassad" : ""}</small></span>
      ${x.custom ? `<span class="dotw ${seqOutdated(cfg, x) ? "o" : "y"}"></span>` : ""}</div>`).join("");
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
    const sharedWith = (nid) => others.filter((o) => zoneNeeds(cfg, o.id).has(nid)).map((o) => o.name);
    const nodes = Object.fromEntries(cfg.nodes.map((n) => [n.id, n]));
    const seq = zoneSteps(cfg, z, "start").map((s) => s.node).filter((id) => nodes[id]);
    const startTxt = seq.map((id) => esc(nodes[id].name || "?")).join(" → ");
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
      <div class="row"><label class="grow">LED-entitet (light/switch)${this._entityField('data-zf="led"', z.led, { domains: ["light", "switch"], placeholder: "Välj LED" })}</label>
        <label>Släck efter (min)<input type="number" min="0" step="1" data-zf="led_minutes" value="${esc(z.led_minutes ?? 30)}" style="width:90px"></label></div>
      <div class="hint">Blinkar långsamt medan sekvensen körs, lyser fast när allt gick bra (släcks efter angiven tid, 0 = lys tills nästa gång) och blinkar snabbt vid fel tills gruppen körs igen.</div>
      <div class="lbl">Sekvens</div>
      <div class="preview">${z.custom ? `<span class="dotw ${seqOutdated(cfg, z) ? "o" : "y"}"></span> <b>Anpassad för hand</b>${seqOutdated(cfg, z) ? " – gruppen har ändrats sedan dess" : ""}` : "<b>Automatisk</b> – byggs av reglerna"}<br>
        ${seq.length ? `Start: ${startTxt}` : "Välj utrustning ovan."}
        <div class="btns" style="margin-top:8px"><button class="small" data-act="goto-seq" data-id="${esc(z.id)}">Visa och ändra sekvensen →</button></div></div>
      <div class="hint" style="margin-top:6px">Det som redan är igång hoppas över vid start. Switch i HA: <code>switch.${esc((z.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "_"))}</code> (ungefär) när gruppen sparats.</div>
      <div class="btns"><button class="danger small" data-act="del-zone">Ta bort grupp</button></div>
    </div>`;
  }

  /* ------------------------------------------------------ tab: sequences */
  _seqsTab() {
    const cfg = this._draft;
    const z = cfg.zones.find((x) => x.id === this._sel.seq);
    const item = (x, i) => {
      const dot = x.custom && !x.standalone ? `<span class="dotw ${seqOutdated(cfg, x) ? "o" : "y"}" title="${seqOutdated(cfg, x) ? "Gruppen har ändrats" : "Anpassad för hand"}"></span>` : "";
      const sub = x.standalone ? "Egen sekvens" : x.custom ? "Grupp · anpassad" : "Grupp · automatisk";
      return `<div class="list-item ${x.id === this._sel.seq ? "sel" : ""}" data-act-item="seq" data-id="${esc(x.id)}">
        <span class="sw" style="background:${x.color || ZONE_COLORS[i % 8]}"></span><span class="t">${esc(x.name)}<small>${sub} · ${zoneSteps(cfg, x, "start").length} steg</small></span>${dot}</div>`;
    };
    const groups = cfg.zones.map((x, i) => [x, i]).filter(([x]) => !x.standalone);
    const own = cfg.zones.map((x, i) => [x, i]).filter(([x]) => x.standalone);
    const listCard = `<div class="card side-left"><h2>Sekvenser</h2>
      ${groups.length ? `<div class="lbl" style="margin-top:0">Från grupper</div>${groups.map(([x, i]) => item(x, i)).join("")}` : ""}
      ${own.length ? `<div class="lbl">Egna</div>${own.map(([x, i]) => item(x, i)).join("")}` : ""}
      ${!cfg.zones.length ? `<div class="hint">Skapa grupper så får de sekvenser automatiskt, eller gör en egen sekvens för hand.</div>` : ""}
      <div class="btns"><button class="primary" data-act="add-seq">+ Ny egen sekvens</button></div>
      <div class="hint" style="margin-top:10px"><span class="dotw y"></span> ändrad för hand &nbsp; <span class="dotw o"></span> gruppen har ändrats sedan dess</div></div>`;
    const editor = z ? this._seqEditor(z) : `<div class="card empty">Varje grupp får en sekvens automatiskt utifrån reglerna. Du kan justera den för hand –
      då markeras den med en gul prick. Du kan också skapa egna sekvenser helt utan grupper.</div>`;
    if (this._mobile) {
      return `<div class="content">${listCard}${z ? `<div class="sheet"><div class="sheet-head"><button data-act="close-seq">‹ Tillbaka</button><b>${esc(z.name)}</b></div>
        <div class="sheet-body">${editor}</div></div>` : ""}</div>`;
    }
    return `<div class="content wide"><div class="flow-layout">${listCard}<div class="grow">${editor}</div></div></div>`;
  }

  _seqEditor(z) {
    const cfg = this._draft;
    const nodes = Object.fromEntries(cfg.nodes.map((n) => [n.id, n]));
    let head = "";
    if (z.standalone) {
      head = `<div class="row"><label class="grow">Namn<input data-zf="name" value="${esc(z.name)}" placeholder="T.ex. Gudstjänst"></label>
          <label>Ikon<input data-zf="icon" value="${esc(z.icon || "")}" placeholder="mdi:church"></label></div>
        <div class="swatches" style="margin-bottom:6px">${ZONE_COLORS.map((c) => `<button class="swatch ${z.color === c ? "sel" : ""}" style="background:${c}" data-act="zone-color" data-color="${c}"></button>`).join("")}</div>
        <details><summary>Status-LED</summary><div class="row"><label class="grow">LED-entitet${this._entityField('data-zf="led"', z.led, { domains: ["light", "switch"], placeholder: "Välj LED" })}</label>
          <label>Släck efter (min)<input type="number" min="0" data-zf="led_minutes" value="${esc(z.led_minutes ?? 30)}" style="width:90px"></label></div></details>`;
    } else {
      head = `<div class="row-between"><h2 style="margin:0">${esc(z.name)}</h2><button class="small" data-act="goto-zone" data-id="${esc(z.id)}">Gruppens utrustning →</button></div>`;
      if (!z.custom) head += `<div class="banner" style="background:var(--secondary-background-color)"><b>Automatisk.</b> Byggs av reglerna och gruppens utrustning och uppdateras av sig själv. Ändrar du något nedan blir den anpassad.</div>`;
      else if (seqOutdated(cfg, z)) {
        const auto = autoStart(cfg, z.id); const have = new Set(z.custom.start.filter((s) => !isMoment(s)).map((s) => s.node));
        const missing = auto.filter((n) => !have.has(n)); const extra = [...have].filter((n) => !auto.includes(n));
        head += `<div class="banner o"><span class="dotw o"></span> <b>Gruppen eller reglerna har ändrats</b> sedan du anpassade sekvensen.
          ${missing.length ? `<br>Saknas: ${missing.map((n) => esc(nodes[n]?.name || "?")).join(", ")}` : ""}
          ${extra.length ? `<br>Ingår inte längre automatiskt: ${extra.map((n) => esc(nodes[n]?.name || "?")).join(", ")}` : ""}
          ${!missing.length && !extra.length ? "<br>Den automatiska ordningen har ändrats." : ""}
          <div class="btns" style="margin-top:6px">${missing.length ? `<button class="small primary" data-act="seq-addmissing">Lägg till saknade på föreslagen plats</button>` : ""}
          <button class="small" data-act="seq-ignore">Behåll min version</button><button class="small" data-act="seq-reset">Återställ till automatisk</button></div></div>`;
      } else head += `<div class="banner y"><span class="dotw y"></span> <b>Anpassad för hand.</b> Uppdateras inte längre automatiskt. <button class="small" data-act="seq-reset" style="margin-left:6px">Återställ till automatisk</button></div>`;
    }
    const section = (which, title, hint) => {
      const steps = zoneSteps(cfg, z, which);
      const warns = ruleWarnings(cfg, steps, which);
      const others = cfg.zones.filter((o) => o.id !== z.id);
      const rows = steps.map((st, i) => {
        const last = i === steps.length - 1;
        if (isMoment(st)) return this._momentRow(z, st, which, i, last, steps);
        const n = nodes[st.node]; if (!n) return "";
        const def = which === "start" ? n.delay_on : n.delay_off;
        const wait = which === "start" ? n.wait_on : n.wait_off;
        const shared = which === "stop" ? others.filter((o) => zoneNeeds(cfg, o.id).has(n.id)).map((o) => o.name) : [];
        return `<div class="step" data-which="${which}" data-i="${i}"><span class="num">${i + 1}</span>${(IMAGES[n.image] || IMAGES.generic)[1]}
          <span class="t">${esc(n.name || "?")}
            ${wait?.conditions?.length ? `<small>⏳ väntar på villkor först</small>` : ""}
            ${(warns[n.id] || []).map((w) => `<small class="w">⚠ ${esc(w)} – körs ändå i din ordning</small>`).join("")}
            ${shared.length ? `<small>Delas med ${esc(shared.join(", "))} – ${st.force ? "<b>stängs alltid av</b>" : "hoppas över om den är igång"}</small>` : ""}</span>
          ${last ? "" : `<label style="flex-direction:row;align-items:center;gap:4px">vänta<input type="number" min="0" step="0.5" data-sd="1" value="${st.delay ?? ""}" placeholder="${fmtSec(def || 0)}">s</label>`}
          ${which === "stop" && shared.length ? `<label style="flex-direction:row;align-items:center;gap:4px;font-size:12px"><input type="checkbox" data-sforce="1" ${st.force ? "checked" : ""}>stäng alltid av</label>` : ""}
          <button class="icon" data-act="seq-up" ${i === 0 ? "disabled" : ""} title="Flytta upp">▲</button>
          <button class="icon" data-act="seq-down" ${last ? "disabled" : ""} title="Flytta ned">▼</button>
          <button class="icon" data-act="seq-del" title="Ta bort steg">✕</button></div>`;
      }).join("");
      const have = new Set(steps.map((s) => s.node));
      const avail = cfg.nodes.filter((n) => !have.has(n.id));
      return `<h3>${title}</h3><div class="hint" style="margin-bottom:6px">${hint}</div>
        <div class="steps">${rows || `<div class="step"><span class="hint">Inga steg.</span></div>`}</div>
        <div class="row" style="margin-top:8px">
          ${avail.length ? `<select data-seqadd="${which}"><option value="">+ Lägg till utrustning…</option>${avail.map((n) => `<option value="${esc(n.id)}">${esc(n.name || "?")}</option>`).join("")}</select>` : ""}
          <select data-momadd="${which}"><option value="">+ Lägg till moment…</option>${MOMENT_TYPES.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></div>`;
    };
    return `<div class="card">${head}
      <div class="hint">Moment (färg, paus, DMX-scen …) följer inga regler och ger aldrig varningar. I en automatisk sekvens låser de den inte heller – den fortsätter följa reglerna.</div>
      ${section("start", "Start", "Det som redan är igång (t.ex. från ett annat rum) hoppas över, och sekvensen fortsätter direkt. Tomt väntefält = utrustningens standard.")}
      ${section("stop", "Avstängning", "Utrustning som en annan grupp eller sekvens fortfarande använder hoppas över – om du inte kryssar i ”stäng alltid av”.")}
      ${z.standalone ? `<div class="btns" style="margin-top:16px"><button class="danger small" data-act="del-seq">Ta bort sekvensen</button></div>` : ""}</div>`;
  }

  _momentRow(z, st, which, i, last, steps) {
    const type = momentType(st);
    const open = this._openStep === st.id;
    const auto = !z.custom;
    let summary = "";
    if (type === "pause") summary = `${fmtSec(st.delay ?? 0)} s`;
    else if (type === "wait") { const c = st.wait.conditions[0] || {}; summary = `${this._friendly(c.entity_id || "?")} = ${c.state || "något"} (max ${fmtSec(st.wait.timeout ?? 60)} s)`; }
    else if (type === "light") summary = `${(st.entities || []).map((e) => this._friendly(e)).join(", ") || "ingen lampa vald"} · ${st.spec.brightness ?? 100} %${st.spec.color_mode === "rgb" ? ` · <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${esc(st.spec.rgb)}"></span>` : st.spec.color_mode === "temp" ? ` · ${st.spec.kelvin} K` : ""}`;
    else if (type === "dmx") summary = `${esc(st.spec.channels || "inga kanaler")}`;
    else if (type === "service") summary = esc(st.spec.service || "ingen tjänst vald");
    else summary = (st.entities || []).map((e) => esc(this._friendly(e))).join(", ") || "ingen entitet vald";
    const row = `<div class="step" data-which="${which}" data-i="${i}" data-mid="${esc(st.id)}" style="background:color-mix(in srgb, var(--primary-color) 5%, transparent)">
      <span class="num" style="background:var(--secondary-text-color)">${i + 1}</span><span style="font-size:20px;width:34px;text-align:center">${MOMENT_ICON[type] || "•"}</span>
      <span class="t">${esc(st.name || "Moment")}<small>Moment · ${summary}</small></span>
      ${type !== "pause" && !last ? `<label style="flex-direction:row;align-items:center;gap:4px">vänta<input type="number" min="0" step="0.5" data-sd="1" value="${st.delay ?? ""}" placeholder="0">s</label>` : ""}
      ${type === "pause" ? `<label style="flex-direction:row;align-items:center;gap:4px">längd<input type="number" min="0" step="0.5" data-sd="1" value="${st.delay ?? 0}">s</label>` : ""}
      <button class="small" data-act="mom-edit">${open ? "Klar" : "Ändra"}</button>
      ${auto ? "" : `<button class="icon" data-act="seq-up" ${i === 0 ? "disabled" : ""}>▲</button><button class="icon" data-act="seq-down" ${last ? "disabled" : ""}>▼</button>`}
      <button class="icon" data-act="seq-del" title="Ta bort moment">✕</button></div>`;
    if (!open) return row;
    let body = `<label>Namn<input data-mf="name" value="${esc(st.name || "")}"></label>`;
    if (auto) {
      const base = steps.filter((x) => !isMoment(x));
      const entry = (z.extras?.[which] || []).find((e) => e.step === st || e.step.id === st.id);
      body += `<label style="margin-top:8px">Placering<select data-mf="__after"><option value="">Först</option>${base.map((b) => `<option value="${esc(b.node)}" ${entry?.after === b.node ? "selected" : ""}>Efter ${esc(this._draft.nodes.find((n) => n.id === b.node)?.name || "?")}</option>`).join("")}</select></label>`;
    }
    if (type === "wait") {
      const c = st.wait.conditions[0];
      body += `<div class="row" style="margin-top:8px"><label class="grow">Entitet${this._entityField('data-mf="wait.conditions.0.entity_id"', c.entity_id)}</label>
        <label>Attribut<input data-mf="wait.conditions.0.attribute" value="${esc(c.attribute || "")}" style="width:100px"></label>
        <label>= värde<input data-mf="wait.conditions.0.state" value="${esc(c.state || "")}" style="width:100px"></label>
        <label>Max (s)<input type="number" min="1" data-mf="wait.timeout" value="${esc(st.wait.timeout ?? 60)}" style="width:80px"></label></div>`;
    } else if (type !== "pause") {
      if (type !== "dmx" && type !== "service") body += `<div class="lbl">Entiteter</div>${this._chips(st.entities, "step", type === "light" ? ["light"] : null)}`;
      if (type === "service") body += `<label style="margin-top:8px">Tjänst<input data-mf="spec.service" list="services" value="${esc(st.spec.service || "")}" placeholder="t.ex. scene.turn_on"></label>
        <label style="margin-top:8px">Data (JSON)<textarea data-mf="spec._dataText">${esc(st.spec._dataText || "")}</textarea></label>`;
      body += this._actionFields(st, "spec", st.spec.action, st.spec, "data-mf");
    }
    return row + `<div class="step" style="display:block;padding:10px 14px 14px 52px">${body}</div>`;
  }

  _openStepObj() {
    const z = this._curZone(); if (!z || !this._openStep) return null;
    for (const which of ["start", "stop"]) {
      const list = z.custom ? z.custom[which] : (z.extras?.[which] || []).map((e) => e.step);
      const st = list.find((x) => x.id === this._openStep); if (st) return st;
    }
    return null;
  }

  _newMoment(type) {
    const st = { kind: "action", id: uid(), name: "", entities: [], spec: { action: "none" }, wait: null, delay: null };
    if (type === "light") Object.assign(st, { name: "Ljus", spec: { action: "light", brightness: 100, transition: 2, color_mode: "rgb", rgb: "#ffffff" } });
    if (type === "turn_on") Object.assign(st, { name: "Slå på", spec: { action: "turn_on" } });
    if (type === "turn_off") Object.assign(st, { name: "Stäng av", spec: { action: "turn_off" } });
    if (type === "pause") Object.assign(st, { name: "Paus", delay: 5 });
    if (type === "wait") Object.assign(st, { name: "Vänta tills…", wait: { mode: "all", timeout: 60, on_timeout: "continue", conditions: [{ entity_id: "", attribute: "", state: "on" }] } });
    if (type === "dmx") Object.assign(st, { name: "DMX-scen", spec: { action: "dmx", protocol: "artnet", universe: 0, host: "", channels: "", fade: 2 } });
    if (type === "service") Object.assign(st, { name: "Tjänst", spec: { action: "service", service: "", _dataText: "" } });
    return st;
  }

  _ensureCustom(z) {
    if (z.custom) return;
    const a = autoStart(this._draft, z.id);
    const mk = (ids, which) => mergeExtras(ids.map((n) => ({ node: n, delay: null, force: false })), z.extras?.[which] || []);
    z.custom = { start: mk(a, "start"), stop: mk([...a].reverse(), "stop"), base_start: a, base_stop: [...a].reverse() };
    z.extras = null;
  }

  _momWhich(z, id) { return (z.extras?.start || []).some((e) => e.step.id === id) ? "start" : "stop"; }

  _curZone() {
    const id = this._tab === "seqs" ? this._sel.seq : this._sel.zone;
    return this._draft.zones.find((x) => x.id === id);
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
    const kinds = [["learn", `${ICON_PRESS}Lyssna`], ["device", "Enhet"], ["entity", "Entitet"], ["event", "Händelse"]];
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
      body = `<label>Entitet${this._entityField("data-rent", eid, { placeholder: "Välj knapp, event eller action-sensor" })}</label>
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
        <label class="grow">Grupp / sekvens<select data-rf="target">${cfg.zones.map((z) => `<option value="${esc(z.id)}" ${r.target === z.id ? "selected" : ""}>${z.standalone ? "Sekvens: " : ""}${esc(z.name)}</option>`).join("")}<option value="${ALL}" ${r.target === ALL ? "selected" : ""}>Alla grupper</option></select></label></div>
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
      if (kind === "seq") this._sel.seq = item.dataset.id;
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
        d.zones.forEach((z) => {
          z.nodes = z.nodes.filter((x) => x !== id);
          if (z.custom) for (const k of ["start", "stop"]) z.custom[k] = z.custom[k].filter((st) => st.node !== id);
        });
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
        if (btn.dataset.on !== "1" && n.off?.action === "rpc_shutdown" && !confirm(`Stänga av datorn ${n.off.host || ""} nu?`)) return;
        try { await this._hass.callWS({ type: "sequencer/node/test", node: this._cleanNode(n), on: btn.dataset.on === "1" }); }
        catch (e) { this._toast(`Test misslyckades: ${e.message || e}`, true); }
        return;
      }
      case "edit-node": this._tab = "flow"; this._sub = "schema"; this._sel.node = btn.dataset.id; this._sel.edge = null; this._render(); return;

      case "add-rule": {
        const a = this.shadowRoot.getElementById("rule-a").value, b = this.shadowRoot.getElementById("rule-b").value;
        if (a === b) return this._toast("Välj två olika utrustningar.", true);
        if (d.edges.some((e) => e.from === a && e.to === b)) return this._toast("Den regeln finns redan.", true);
        if (wouldCycle(d, a, b)) return this._toast("Det går inte – då skulle reglerna motsäga varandra (en loop).", true);
        d.edges.push({ from: a, to: b }); this._markDirty(); this._render(); return;
      }
      case "del-rule": d.edges.splice(Number(btn.dataset.i), 1); this._markDirty(); this._render(); return;

      case "add-zone": {
        const z = { id: uid(), name: `Grupp ${d.zones.filter((x) => !x.standalone).length + 1}`, icon: "", color: ZONE_COLORS[d.zones.length % ZONE_COLORS.length], nodes: [], standalone: false, custom: null };
        d.zones.push(z); this._sel.zone = z.id; this._markDirty(); this._render(); return;
      }
      case "del-zone": {
        const z = d.zones.find((x) => x.id === this._sel.zone);
        if (!confirm(`Ta bort gruppen "${z.name}"?`)) return;
        d.zones = d.zones.filter((x) => x.id !== z.id);
        d.remotes.forEach((r) => { if (r.target === z.id) r.target = ALL; });
        this._sel.zone = null; this._markDirty(); this._render(); return;
      }
      case "zone-color": this._curZone().color = btn.dataset.color; this._markDirty(); this._render(); return;

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
      case "preset": {
        const obj = btn.dataset.pattr === "data-mf" ? this._openStepObj() : this._node(this._sel.node);
        this._setPath(obj, btn.dataset.path, Number(btn.dataset.v)); this._markDirty(); this._render(); return;
      }
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
      case "close-seq": this._sel.seq = null; this._render(); return;
      case "sub": this._sub = btn.dataset.sub; this._render(); return;
      case "goto-seq": this._tab = "seqs"; this._sel.seq = btn.dataset.id; this._render(); window.scrollTo(0, 0); return;
      case "goto-zone": this._tab = "zones"; this._sel.zone = btn.dataset.id; this._render(); window.scrollTo(0, 0); return;
      case "add-seq": {
        const z = { id: uid(), name: `Sekvens ${d.zones.filter((x) => x.standalone).length + 1}`, icon: "", standalone: true, nodes: [],
          color: ZONE_COLORS[d.zones.length % ZONE_COLORS.length], custom: { start: [], stop: [], base_start: [], base_stop: [] }, led: "", led_minutes: 30 };
        d.zones.push(z); this._sel.seq = z.id; this._markDirty(); this._render(); return;
      }
      case "del-seq": {
        const z = this._curZone(); if (!confirm(`Ta bort sekvensen "${z.name}"?`)) return;
        d.zones = d.zones.filter((x) => x.id !== z.id); d.remotes.forEach((r) => { if (r.target === z.id) r.target = ALL; });
        this._sel.seq = null; this._markDirty(); this._render(); return;
      }
      case "seq-reset": { const z = this._curZone(); if (!confirm("Återställa till den automatiska sekvensen? Dina ändringar försvinner.")) return; z.custom = null; this._markDirty(); this._render(); return; }
      case "seq-ignore": { const z = this._curZone(); const a = autoStart(d, z.id); z.custom.base_start = a; z.custom.base_stop = [...a].reverse(); this._markDirty(); this._render(); return; }
      case "seq-addmissing": {
        const z = this._curZone(); const a = autoStart(d, z.id);
        for (const [which, auto] of [["start", a], ["stop", [...a].reverse()]]) {
          const list = z.custom[which];
          auto.forEach((nid, ai) => {
            if (list.some((s) => s.node === nid)) return;
            let pos = 0;
            for (let k = ai - 1; k >= 0; k--) { const j = list.findIndex((s) => s.node === auto[k]); if (j >= 0) { pos = j + 1; break; } }
            list.splice(pos, 0, { node: nid, delay: null, force: false });
          });
        }
        z.custom.base_start = a; z.custom.base_stop = [...a].reverse(); this._markDirty(); this._render(); return;
      }
      case "mom-edit": { const id = btn.closest("[data-mid]").dataset.mid; this._openStep = this._openStep === id ? null : id; this._render(); return; }
      case "seq-up": case "seq-down": case "seq-del": {
        const row = btn.closest("[data-which]"); const z = this._curZone();
        if (act === "seq-del" && row.dataset.mid && !z.custom) {
          z.extras[row.dataset.which] = z.extras[row.dataset.which].filter((e) => e.step.id !== row.dataset.mid);
          this._markDirty(); this._render(); return;
        }
        this._ensureCustom(z);
        const list = z.custom[row.dataset.which]; const i = Number(row.dataset.i);
        if (act === "seq-del") list.splice(i, 1);
        else { const j = act === "seq-up" ? i - 1 : i + 1; [list[i], list[j]] = [list[j], list[i]]; }
        this._markDirty(); this._render(); return;
      }
      case "close-remote": this._sel.remote = null; this._stopLearn(); this._render(); return;
    }
  }

  _entityList(ctx) {
    if (ctx === "node") return this._node(this._sel.node).entities;
    if (ctx === "step") { const st = this._openStepObj(); return st ? (st.entities ||= []) : []; }
    return [];
  }

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
    const n = input.dataset.ctx === "node" ? this._node(this._sel.node) : null;
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
      if (t.type === "checkbox" || t.type === "color") return; // handled on change
      const num = ["delay_on", "delay_off"].includes(t.dataset.nf) || t.type === "number" || t.type === "range";
      this._setPath(n, t.dataset.nf, num ? (t.value === "" ? "" : Number(t.value)) : t.value);
      const show = this._main.querySelector(`[data-show="${t.dataset.nf}"]`);
      if (show) show.textContent = `${t.value}${t.dataset.nf.endsWith("kelvin") ? " K" : " %"}`;
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
      this._curZone()[t.dataset.zf] = t.dataset.zf === "led_minutes" ? Number(t.value || 0) : t.value; this._markDirty();
    } else if (t.dataset.sd) {
      const row = t.closest("[data-which]"); const z = this._curZone();
      const val = t.value === "" ? null : Number(t.value);
      if (row.dataset.mid && !z.custom) { const e = z.extras[row.dataset.which].find((x) => x.step.id === row.dataset.mid); e.step.delay = val; this._markDirty(); return; }
      this._ensureCustom(z);
      z.custom[row.dataset.which][Number(row.dataset.i)].delay = val; this._markDirty();
    } else if (t.dataset.mf && t.type !== "checkbox" && t.type !== "color" && t.tagName !== "SELECT") {
      const st = this._openStepObj(); if (!st) return;
      const num = t.type === "number" || t.type === "range";
      this._setPath(st, t.dataset.mf, num ? (t.value === "" ? "" : Number(t.value)) : t.value); this._markDirty();
      const show = this._main.querySelector(`[data-show="${t.dataset.mf}"]`);
      if (show) show.textContent = `${t.value}${t.dataset.mf.endsWith("kelvin") ? " K" : " %"}`;
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
    if (t.dataset.nf && (t.type === "checkbox" || t.type === "color")) {
      const n = this._node(this._sel.node); this._setPath(n, t.dataset.nf, t.type === "checkbox" ? t.checked : t.value); this._markDirty(); return;
    }
    if (t.dataset.nf && (t.tagName === "SELECT" || t.dataset.nf === "name")) {
      const n = this._node(this._sel.node); this._setPath(n, t.dataset.nf, t.value);
      if (t.dataset.nf === "name" && (!n.image || n.image === "generic")) n.image = guessImage({ entity_id: n.entities[0] || "", name: n.name, domain: (n.entities[0] || "").split(".")[0] });
      if (t.dataset.nf.endsWith("color_mode")) { const sp = n[t.dataset.nf.split(".")[0]]; if (t.value === "temp") sp.kelvin ??= 3000; if (t.value === "rgb") sp.rgb ??= "#ffffff"; }
      if (t.dataset.nf === "on.action") this._applyActionDefaults(n, t.value);
      if (t.dataset.nf === "off.action" && t.value === "rpc_shutdown") n.off.force ??= true;
      this._markDirty(); this._render(); return;
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
    if (t.dataset.zf === "name" || t.dataset.sd) { this._render(); return; }
    if (t.dataset.sforce) {
      const row = t.closest("[data-which]"); const z = this._curZone(); this._ensureCustom(z);
      z.custom[row.dataset.which][Number(row.dataset.i)].force = t.checked; this._markDirty(); this._render(); return;
    }
    if (t.dataset.mf) {
      const st = this._openStepObj(); if (!st) return;
      if (t.dataset.mf === "__after") {
        const z = this._curZone(); const list = z.extras[this._momWhich(z, st.id)];
        const idx = list.findIndex((e) => e.step.id === st.id); const [e] = list.splice(idx, 1); e.after = t.value || null; list.push(e);
      } else {
        this._setPath(st, t.dataset.mf, t.type === "checkbox" ? t.checked : t.value);
        if (t.dataset.mf.endsWith("color_mode")) { if (t.value === "temp") st.spec.kelvin ??= 3000; if (t.value === "rgb") st.spec.rgb ??= "#ffffff"; }
      }
      this._markDirty(); this._render(); return;
    }
    if (t.dataset.momadd && t.value) {
      const z = this._curZone(); const which = t.dataset.momadd; const st = this._newMoment(t.value);
      if (z.custom) z.custom[which].push(st);
      else {
        const base = zoneSteps(this._draft, { ...z, extras: null }, which);
        z.extras ||= { start: [], stop: [] }; z.extras[which] ||= [];
        z.extras[which].push({ after: base.length ? base[base.length - 1].node : null, step: st });
      }
      this._openStep = st.id; this._markDirty(); this._render(); return;
    }
    if (t.dataset.seqadd && t.value) {
      const z = this._curZone(); this._ensureCustom(z);
      z.custom[t.dataset.seqadd].push({ node: t.value, delay: null, force: false }); this._markDirty(); this._render(); return;
    }
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

  _applyActionDefaults(n, action) {
    const on = n.on; const off = (n.off ||= {});
    const offDefault = !off.action || off.action === "turn_off";
    if (action === "light") { on.brightness ??= 100; on.transition ??= 2; on.color_mode ??= "none"; if (offDefault) { off.action = "light_off"; off.transition ??= 2; } if (n.image === "generic") n.image = "spot"; }
    if (action === "wol") { on.port ??= 9; if (offDefault) { off.action = "rpc_shutdown"; off.force ??= true; off.timeout ??= 0; } if (n.image === "generic") n.image = "pc"; }
    if (action === "dmx") { on.protocol ??= "artnet"; on.universe ??= 0; on.fade ??= 2; if (offDefault) { off.action = "dmx_off"; off.fade ??= 2; } if (n.image === "generic") n.image = "dmxnode"; }
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
    const set = id ? zoneNeeds(cfg, id) : null;
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
      s = s || {};
      const action = s.action || def;
      if (action === "service" && !ENTITY_RE.test(s.service || "")) throw new Error(`${label}: ange tjänst som domän.tjänst.`);
      const withData = ["turn_on", "turn_off", "service", "light"].includes(action);
      const out = { action, service: action === "service" ? s.service : "", data: withData ? this._parseData(s._dataText, label) : {} };
      const pick = (keys) => { for (const k of keys) if (s[k] !== undefined && s[k] !== "") out[k] = s[k]; };
      if (action === "light") pick(["brightness", "transition", "color_mode", "rgb", "kelvin", "wait"]);
      if (action === "light_off") pick(["transition", "wait"]);
      if (action === "wol") { if (!MAC_RE.test(s.mac || "")) throw new Error(`${label}: ogiltig MAC-adress.`); pick(["mac", "broadcast", "port"]); }
      if (action === "rpc_shutdown") { if (!s.host || !s.username) throw new Error(`${label}: ange dator och användare för Windows-avstängning.`); pick(["host", "username", "password", "domain", "timeout", "force", "reboot"]); }
      if (action === "dmx") {
        try { if (!Object.keys(parseChannels(s.channels)).length) throw new Error("ange minst en kanal"); } catch (e) { throw new Error(`${label} (DMX): ${e.message}`); }
        pick(["protocol", "host", "universe", "channels", "fade", "wait"]);
      }
      if (action === "dmx_off") pick(["fade", "wait"]);
      return out;
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
          if (!z.name.trim()) throw new Error(z.standalone ? "En sekvens saknar namn." : "En grupp saknar namn.");
          const delayOf = (st) => (st.delay === "" || st.delay == null ? null : Number(st.delay));
          const step = (st) => {
            if (!isMoment(st)) return { node: st.node, delay: delayOf(st), force: !!st.force };
            const label = `${z.name}: ${st.name || "moment"}`;
            const clean = this._cleanNode({ id: st.id, name: label, entities: st.entities || [], on: { ...st.spec, _dataText: st.spec._dataText }, off: { action: "none" }, wait_on: st.wait });
            if (momentType(st) === "wait" && !clean.wait_on) throw new Error(`${label}: välj entitet att vänta på.`);
            return { kind: "action", id: st.id, name: st.name || "", entities: st.entities || [], spec: clean.on, wait: clean.wait_on, delay: delayOf(st) };
          };
          const custom = z.custom ? { start: z.custom.start.map(step), stop: z.custom.stop.map(step), base_start: z.custom.base_start || [], base_stop: z.custom.base_stop || [] } : null;
          const extras = !z.custom && z.extras ? Object.fromEntries(["start", "stop"].map((w) => [w, (z.extras[w] || []).map((e) => ({ after: e.after || null, step: step(e.step) }))])) : null;
          const led = (z.led || "").trim();
          if (led && !ENTITY_RE.test(led)) throw new Error(`${z.name}: ogiltig LED-entitet.`);
          return { id: z.id, name: z.name.trim(), icon: z.icon || "", color: z.color, nodes: z.standalone ? [] : z.nodes, standalone: !!z.standalone, custom, extras, led, led_minutes: Number(z.led_minutes ?? 30) };
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
