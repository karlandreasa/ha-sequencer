/* Sequencer – sidebar panel for Home Assistant (no build step, plain web component). */

const STATE_LABELS = {
  off: "Av",
  on: "På",
  starting: "Startar…",
  stopping: "Stänger av…",
};

const ACTIONS = [
  ["turn_on", "Slå på"],
  ["turn_off", "Stäng av"],
  ["toggle", "Växla"],
  ["service", "Annan tjänst…"],
];
const ACTION_LABEL = Object.fromEntries(ACTIONS);
const INVERSE = { turn_on: "turn_off", turn_off: "turn_on", toggle: "toggle" };

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const uid = () => Math.random().toString(36).slice(2, 12);
const newStep = (action = "turn_on") => ({
  id: uid(), name: "", entities: [], action, service: "", data: {}, _dataText: "", delay: 2,
});
const fmtSec = (s) => (Number.isInteger(s) ? `${s}` : s.toFixed(1)).replace(".", ",");

/** Same logic as build_stop_steps() in manager.py, used for the preview. */
function reverseSteps(steps) {
  const rev = [...steps].reverse();
  const out = [];
  rev.forEach((s, i) => {
    const delay = i + 1 < rev.length ? Number(rev[i + 1].delay || 0) : 0;
    const inv = INVERSE[s.action];
    if (!inv) {
      if (out.length) out[out.length - 1].delay += delay;
      return;
    }
    out.push({ ...s, action: inv, delay });
  });
  return out;
}

const STYLE = `
  :host { display:block; min-height:100vh; background:var(--primary-background-color); color:var(--primary-text-color);
          font-family:var(--paper-font-body1_-_font-family, Roboto, sans-serif); }
  .toolbar { display:flex; align-items:center; height:var(--header-height,56px); padding:0 12px; box-sizing:border-box;
             background:var(--app-header-background-color, var(--primary-color)); color:var(--app-header-text-color, #fff);
             border-bottom:var(--app-header-border-bottom, none); font-size:20px; gap:8px; }
  .toolbar .title { flex:1; margin-left:8px; }
  .content { max-width:960px; margin:0 auto; padding:16px; box-sizing:border-box; }
  .card { background:var(--card-background-color, #fff); border-radius:var(--ha-card-border-radius, 12px);
          box-shadow:var(--ha-card-box-shadow, 0 1px 3px rgba(0,0,0,.2)); border:var(--ha-card-border-width,1px) solid var(--ha-card-border-color, var(--divider-color,#e0e0e0));
          padding:16px; margin-bottom:16px; }
  .seq-head { display:flex; align-items:center; gap:12px; }
  .seq-head ha-icon { color:var(--state-icon-color, var(--primary-color)); }
  .seq-name { font-size:18px; font-weight:500; flex:1; }
  .meta { color:var(--secondary-text-color); font-size:13px; margin-top:4px; }
  .badge { font-size:12px; padding:3px 10px; border-radius:12px; background:var(--divider-color,#ddd); white-space:nowrap; }
  .badge.on { background:var(--success-color,#43a047); color:#fff; }
  .badge.starting, .badge.stopping { background:var(--warning-color,#ffa600); color:#fff; }
  .progress { height:4px; background:var(--divider-color,#ddd); border-radius:2px; margin-top:10px; overflow:hidden; }
  .progress > div { height:100%; background:var(--primary-color); transition:width .3s; }
  .running-info { font-size:13px; margin-top:6px; }
  .errors { color:var(--error-color,#db4437); font-size:13px; margin-top:6px; }
  .btns { display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }
  button { font:inherit; font-size:14px; border-radius:8px; padding:8px 14px; cursor:pointer;
           border:1px solid var(--divider-color,#ccc); background:transparent; color:var(--primary-text-color); }
  button:hover { background:var(--secondary-background-color, rgba(0,0,0,.05)); }
  button.primary { background:var(--primary-color); color:var(--text-primary-color,#fff); border-color:var(--primary-color); }
  button.danger { color:var(--error-color,#db4437); border-color:var(--error-color,#db4437); }
  button.icon { padding:4px 8px; border:none; }
  button:disabled { opacity:.4; cursor:default; }
  .empty { text-align:center; color:var(--secondary-text-color); padding:32px 16px; }
  label { display:flex; flex-direction:column; font-size:12px; color:var(--secondary-text-color); gap:4px; }
  input, select, textarea { font:inherit; font-size:14px; padding:8px; border-radius:6px; box-sizing:border-box;
           border:1px solid var(--divider-color,#ccc); background:var(--input-fill-color, var(--card-background-color));
           color:var(--primary-text-color); }
  textarea { font-family:monospace; min-height:60px; width:100%; }
  .row { display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end; margin-bottom:10px; }
  .grow { flex:1; min-width:180px; }
  h3 { margin:20px 0 8px; font-weight:500; }
  .step { border:1px solid var(--divider-color,#ddd); border-radius:10px; padding:12px; margin-bottom:6px; }
  .step-head { display:flex; gap:8px; align-items:center; margin-bottom:10px; }
  .num { width:26px; height:26px; border-radius:50%; background:var(--primary-color); color:var(--text-primary-color,#fff);
         display:flex; align-items:center; justify-content:center; font-size:13px; flex:none; }
  .chips { display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin-bottom:10px; }
  .chip { display:inline-flex; align-items:center; gap:4px; background:var(--secondary-background-color,#eee);
          border-radius:16px; padding:3px 4px 3px 10px; font-size:13px; }
  .chip small { color:var(--secondary-text-color); }
  .chip button { border:none; padding:0 6px; font-size:16px; line-height:1; }
  .chips input { flex:1; min-width:200px; }
  .delay-row { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--secondary-text-color); }
  .delay-row input { width:80px; }
  .connector { text-align:center; color:var(--secondary-text-color); font-size:12px; margin:2px 0 6px; }
  .radio { flex-direction:row; align-items:center; font-size:14px; color:var(--primary-text-color); gap:8px; margin:6px 0; }
  .preview { font-size:13px; color:var(--secondary-text-color); background:var(--secondary-background-color,#f5f5f5);
             border-radius:8px; padding:10px 14px; }
  .preview ol { margin:4px 0; padding-left:20px; }
  .actions { display:flex; gap:8px; justify-content:flex-end; margin-top:20px; flex-wrap:wrap; }
  .actions .spacer { flex:1; }
  .msg-error { color:var(--error-color,#db4437); margin-top:10px; }
  details summary { cursor:pointer; font-size:12px; color:var(--secondary-text-color); margin-bottom:6px; }
`;

class SequencerPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._sequences = [];
    this._status = {};
    this._draft = null;
    this._unsubP = null;
    this._ticker = null;
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (this._menu) this._menu.hass = hass;
    if (first) {
      this._build();
      this._connect();
    }
  }
  get hass() { return this._hass; }

  set narrow(v) {
    this._narrow = v;
    if (this._menu) this._menu.narrow = v;
  }
  set panel(p) { this._panel = p; }
  set route(r) { this._route = r; }

  connectedCallback() {
    if (this._hass && !this._unsubP) this._connect();
  }

  disconnectedCallback() {
    if (this._unsubP) {
      this._unsubP.then((unsub) => unsub()).catch(() => {});
      this._unsubP = null;
    }
    clearInterval(this._ticker);
    this._ticker = null;
  }

  /* ------------------------------------------------------------------ setup */
  _build() {
    const root = this.shadowRoot;
    root.innerHTML = `
      <style>${STYLE}</style>
      <div class="toolbar"><span id="menu"></span><div class="title">Sekvensstyrning</div></div>
      <div class="content">
        <div id="list"></div>
        <div id="editor" hidden></div>
      </div>
      <datalist id="entities"></datalist>
      <datalist id="services"></datalist>`;
    this._menu = document.createElement("ha-menu-button");
    this._menu.hass = this._hass;
    this._menu.narrow = this._narrow;
    root.getElementById("menu").appendChild(this._menu);
    this._listEl = root.getElementById("list");
    this._editorEl = root.getElementById("editor");

    root.addEventListener("click", (ev) => this._onClick(ev));
    root.addEventListener("input", (ev) => this._onInput(ev));
    root.addEventListener("change", (ev) => this._onChange(ev));
    root.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && ev.target.classList?.contains("entity-input")) {
        ev.preventDefault();
        this._addEntityFromInput(ev.target);
      }
    });
    this._renderList();
  }

  _connect() {
    if (this._unsubP || !this._hass) return;
    this._unsubP = this._hass.connection.subscribeMessage(
      (ev) => this._onStatus(ev),
      { type: "sequencer/subscribe" },
    );
    this._unsubP.catch((err) => this._showListError(err));
    this._load();
  }

  async _load() {
    try {
      const res = await this._hass.callWS({ type: "sequencer/list" });
      this._sequences = res.sequences;
      this._status = res.status;
      this._listError = null;
    } catch (err) {
      this._listError = err.message || String(err);
    }
    this._renderList();
  }

  _onStatus({ sequence_id, status }) {
    if (status) this._status[sequence_id] = status;
    else delete this._status[sequence_id];
    const known = this._sequences.some((s) => s.id === sequence_id);
    if (status && !known) { this._load(); return; }
    if (!status && known) { this._load(); return; }
    this._renderList();
  }

  _showListError(err) {
    this._listError = err.message || String(err);
    this._renderList();
  }

  _fillDatalists() {
    const root = this.shadowRoot;
    const states = this._hass.states;
    root.getElementById("entities").innerHTML = Object.keys(states).sort()
      .map((id) => `<option value="${esc(id)}">${esc(states[id].attributes.friendly_name || "")}</option>`).join("");
    const services = [];
    for (const [domain, svcs] of Object.entries(this._hass.services || {})) {
      for (const svc of Object.keys(svcs)) services.push(`${domain}.${svc}`);
    }
    root.getElementById("services").innerHTML = services.sort()
      .map((s) => `<option value="${esc(s)}"></option>`).join("");
  }

  /* ------------------------------------------------------------------- list */
  _renderList() {
    if (!this._listEl) return;
    let html = "";
    if (this._listError) {
      html += `<div class="card msg-error">Kunde inte ladda sekvenser: ${esc(this._listError)}</div>`;
    }
    if (!this._sequences.length && !this._listError) {
      html += `<div class="card empty">Inga sekvenser ännu.<br><br>
        Skapa en sekvens för att till exempel slå på mixer → DSP → slutsteg i tur och ordning,
        med en paus mellan varje del.</div>`;
    }
    for (const seq of this._sequences) html += this._seqCard(seq);
    html += `<div class="btns"><button class="primary" data-act="new">+ Ny sekvens</button></div>`;
    this._listEl.innerHTML = html;
    this._updateTicker();
  }

  _seqCard(seq) {
    const st = this._status[seq.id] || { state: "off" };
    const running = st.state === "starting" || st.state === "stopping";
    const startDur = seq.start_steps.reduce((a, s, i, arr) => a + (i < arr.length - 1 ? Number(s.delay || 0) : 0), 0);
    const pct = running && st.total ? Math.round(((st.step - 1) / st.total) * 100) : 0;
    const entityId = this._entityIdFor(seq.id);
    const stopCount = seq.stop_mode === "custom" ? seq.stop_steps.length : reverseSteps(seq.start_steps).length;
    return `
      <div class="card">
        <div class="seq-head">
          <ha-icon icon="${esc(seq.icon || "mdi:playlist-play")}"></ha-icon>
          <div class="seq-name">${esc(seq.name)}</div>
          <span class="badge ${esc(st.state)}">${esc(STATE_LABELS[st.state] || st.state)}</span>
        </div>
        <div class="meta">
          Start: ${seq.start_steps.length} steg (ca ${fmtSec(startDur)} s) ·
          Stopp: ${stopCount} steg ${seq.stop_mode === "custom" ? "(egen)" : "(omvänd)"}
          ${entityId ? ` · <code>${esc(entityId)}</code>` : ""}
        </div>
        ${running ? `
          <div class="progress"><div style="width:${pct}%"></div></div>
          <div class="running-info">Steg ${st.step}/${st.total}: ${esc(st.step_name || "")}
            ${st.wait_until ? ` · väntar <span data-until="${st.wait_until}"></span> s` : ""}</div>` : ""}
        ${st.errors && st.errors.length ? `<div class="errors">⚠ ${st.errors.map(esc).join("<br>⚠ ")}</div>` : ""}
        <div class="btns">
          <button class="primary" data-act="run" data-dir="start" data-id="${esc(seq.id)}">▶ Starta</button>
          <button data-act="run" data-dir="stop" data-id="${esc(seq.id)}">■ Stäng av</button>
          <span style="flex:1"></span>
          <button data-act="edit" data-id="${esc(seq.id)}">Redigera</button>
        </div>
      </div>`;
  }

  _entityIdFor(seqId) {
    const ents = this._hass?.entities;
    if (!ents) return null;
    for (const [id, e] of Object.entries(ents)) {
      if (e.platform === "sequencer" && id.startsWith("switch.") && this._hass.states[id]?.attributes.sequence_id === seqId) return id;
    }
    return null;
  }

  _updateTicker() {
    const tick = () => {
      const els = this._listEl.querySelectorAll("[data-until]");
      if (!els.length) { clearInterval(this._ticker); this._ticker = null; return; }
      const now = Date.now() / 1000;
      els.forEach((el) => { el.textContent = fmtSec(Math.max(0, Math.ceil((Number(el.dataset.until) - now) * 10) / 10)); });
    };
    if (this._listEl.querySelector("[data-until]") && !this._ticker) this._ticker = setInterval(tick, 100);
    tick();
  }

  /* ----------------------------------------------------------------- editor */
  _openEditor(seq) {
    const clone = JSON.parse(JSON.stringify(seq || {
      name: "", icon: "mdi:speaker", stop_mode: "reverse", start_steps: [newStep()], stop_steps: [],
    }));
    for (const key of ["start_steps", "stop_steps"]) {
      clone[key] = (clone[key] || []).map((s) => ({
        ...newStep(), ...s,
        _dataText: s.data && Object.keys(s.data).length ? JSON.stringify(s.data, null, 2) : "",
      }));
    }
    this._draft = clone;
    this._editorError = null;
    this._fillDatalists();
    this._listEl.hidden = true;
    this._editorEl.hidden = false;
    this._renderEditor();
    window.scrollTo(0, 0);
  }

  _closeEditor() {
    this._draft = null;
    this._editorEl.hidden = true;
    this._editorEl.innerHTML = "";
    this._listEl.hidden = false;
    this._renderList();
  }

  _renderEditor(focus) {
    const d = this._draft;
    const custom = d.stop_mode === "custom";
    let stopPart;
    if (custom) {
      stopPart = this._stepsHtml("stop_steps") +
        `<button data-act="add-step" data-list="stop_steps">+ Lägg till steg</button>
         <button data-act="copy-reverse">Fyll i från omvänd startsekvens</button>`;
    } else {
      const rev = reverseSteps(d.start_steps);
      stopPart = `<div class="preview">Avstängning körs så här:
        <ol>${rev.map((s, i) => `<li>${esc(s.name || "Steg")} – ${ACTION_LABEL[s.action].toLowerCase()}
          ${s.entities.length ? `(${s.entities.map((e) => esc(this._friendly(e))).join(", ")})` : ""}
          ${i < rev.length - 1 && s.delay ? `, vänta ${fmtSec(s.delay)} s` : ""}</li>`).join("")}</ol>
        ${d.start_steps.some((s) => s.action === "service") ? "<div>Steg med “Annan tjänst” hoppas över – välj egen sekvens om de behövs.</div>" : ""}
      </div>`;
    }

    this._editorEl.innerHTML = `
      <div class="card">
        <div class="row">
          <label class="grow">Namn<input data-f="name" value="${esc(d.name)}" placeholder="T.ex. Ljudanläggning stora salen"></label>
          <label>Ikon<input data-f="icon" value="${esc(d.icon || "")}" placeholder="mdi:speaker"></label>
        </div>

        <h3>Startsekvens</h3>
        ${this._stepsHtml("start_steps")}
        <button data-act="add-step" data-list="start_steps">+ Lägg till steg</button>

        <h3>Avstängning</h3>
        <label class="radio"><input type="radio" name="stopmode" data-f="stop_mode" value="reverse" ${custom ? "" : "checked"}>
          Omvänd ordning (samma fördröjningar, åtgärden inverteras)</label>
        <label class="radio"><input type="radio" name="stopmode" data-f="stop_mode" value="custom" ${custom ? "checked" : ""}>
          Egen avstängningssekvens</label>
        <div style="margin-top:8px">${stopPart}</div>

        ${this._editorError ? `<div class="msg-error">${esc(this._editorError)}</div>` : ""}
        <div class="actions">
          ${d.id ? `<button class="danger" data-act="delete">Ta bort</button>` : ""}
          <span class="spacer"></span>
          <button data-act="cancel">Avbryt</button>
          <button class="primary" data-act="save">Spara</button>
        </div>
      </div>`;

    if (focus) {
      const el = this._editorEl.querySelector(`.step[data-list="${focus.list}"][data-idx="${focus.idx}"] .entity-input`);
      el?.focus();
    }
  }

  _friendly(id) {
    return this._hass.states[id]?.attributes.friendly_name || id;
  }

  _stepsHtml(list) {
    const steps = this._draft[list];
    if (!steps.length) return `<div class="meta" style="margin-bottom:8px">Inga steg.</div>`;
    return steps.map((s, i) => {
      const last = i === steps.length - 1;
      return `
      <div class="step" data-list="${list}" data-idx="${i}">
        <div class="step-head">
          <span class="num">${i + 1}</span>
          <input class="grow" data-sf="name" value="${esc(s.name)}" placeholder="Namn på steget (t.ex. Mixer)">
          <button class="icon" data-act="up" ${i === 0 ? "disabled" : ""} title="Flytta upp">▲</button>
          <button class="icon" data-act="down" ${last ? "disabled" : ""} title="Flytta ned">▼</button>
          <button class="icon" data-act="del-step" title="Ta bort steg">✕</button>
        </div>
        <div class="row">
          <label>Åtgärd<select data-sf="action">
            ${ACTIONS.map(([v, l]) => `<option value="${v}" ${s.action === v ? "selected" : ""}>${l}</option>`).join("")}
          </select></label>
          ${s.action === "service" ? `<label class="grow">Tjänst
            <input data-sf="service" list="services" value="${esc(s.service)}" placeholder="t.ex. media_player.volume_set"></label>` : ""}
        </div>
        <div class="chips">
          ${s.entities.map((e, ei) => `<span class="chip">${esc(this._friendly(e))} <small>${esc(e)}</small>
            <button data-act="del-entity" data-ei="${ei}" title="Ta bort">×</button></span>`).join("")}
          <input class="entity-input" list="entities" placeholder="Lägg till entitet… (sök och tryck Enter)">
        </div>
        <details ${s._dataText ? "open" : ""}>
          <summary>Extra data till tjänsten (JSON, valfritt)</summary>
          <textarea data-sf="_dataText" placeholder='{"volume_level": 0.3}'>${esc(s._dataText)}</textarea>
        </details>
        ${last ? "" : `<div class="delay-row" style="margin-top:8px">Vänta
          <input type="number" min="0" step="0.5" data-sf="delay" value="${esc(s.delay)}"> sekunder innan nästa steg</div>`}
      </div>
      ${last ? "" : `<div class="connector">↓</div>`}`;
    }).join("");
  }

  _stepFromEvent(target) {
    const el = target.closest(".step");
    if (!el) return null;
    return { list: el.dataset.list, idx: Number(el.dataset.idx), step: this._draft[el.dataset.list][Number(el.dataset.idx)] };
  }

  _addEntityFromInput(input) {
    const ref = this._stepFromEvent(input);
    let v = input.value.trim();
    if (!ref || !v) return;
    if (!this._hass.states[v]) {
      // allow typing a friendly name
      const match = Object.entries(this._hass.states).find(([, st]) => st.attributes.friendly_name === v);
      if (match) v = match[0];
    }
    if (!/^[a-z0-9_]+\.[a-z0-9_]+$/.test(v)) return;
    if (!ref.step.entities.includes(v)) ref.step.entities.push(v);
    this._renderEditor({ list: ref.list, idx: ref.idx });
  }

  /* ---------------------------------------------------------------- events */
  _onInput(ev) {
    if (!this._draft) return;
    const t = ev.target;
    if (t.dataset.f && t.type !== "radio") this._draft[t.dataset.f] = t.value;
    if (t.dataset.sf) {
      const ref = this._stepFromEvent(t);
      if (ref) ref.step[t.dataset.sf] = t.dataset.sf === "delay" ? Number(t.value || 0) : t.value;
    }
  }

  _onChange(ev) {
    if (!this._draft) return;
    const t = ev.target;
    if (t.classList.contains("entity-input")) {
      // picking from the datalist fires "change" – only add exact entity ids
      if (this._hass.states[t.value.trim()]) this._addEntityFromInput(t);
      return;
    }
    if (t.dataset.f === "stop_mode") {
      this._draft.stop_mode = t.value;
      if (t.value === "custom" && !this._draft.stop_steps.length) this._copyReverse();
      this._renderEditor();
    }
    if (t.dataset.sf === "action") {
      this._renderEditor();
    }
    if (t.dataset.sf === "delay" && this._draft.stop_mode !== "custom") {
      this._renderEditor();
    }
  }

  _copyReverse() {
    this._draft.stop_steps = reverseSteps(this._draft.start_steps).map((s) => ({ ...s, id: uid(), entities: [...s.entities], _dataText: "" }));
  }

  async _onClick(ev) {
    const btn = ev.target.closest("button");
    if (!btn || btn.disabled) return;
    const act = btn.dataset.act;
    const d = this._draft;

    switch (act) {
      case "new": this._openEditor(null); return;
      case "edit": this._openEditor(this._sequences.find((s) => s.id === btn.dataset.id)); return;
      case "run":
        try {
          await this._hass.callWS({ type: "sequencer/run", sequence_id: btn.dataset.id, direction: btn.dataset.dir });
        } catch (err) { this._showListError(err); }
        return;
      case "cancel": this._closeEditor(); return;
      case "save": await this._save(); return;
      case "delete":
        if (!confirm(`Ta bort sekvensen "${d.name}"?`)) return;
        try {
          await this._hass.callWS({ type: "sequencer/delete", sequence_id: d.id });
          this._closeEditor();
          await this._load();
        } catch (err) { this._editorError = err.message; this._renderEditor(); }
        return;
      case "add-step": d[btn.dataset.list].push(newStep(btn.dataset.list === "stop_steps" ? "turn_off" : "turn_on")); this._renderEditor(); return;
      case "copy-reverse": this._copyReverse(); this._renderEditor(); return;
    }

    const ref = this._stepFromEvent(btn);
    if (!ref) return;
    const arr = d[ref.list];
    if (act === "del-step") arr.splice(ref.idx, 1);
    else if (act === "up" && ref.idx > 0) [arr[ref.idx - 1], arr[ref.idx]] = [arr[ref.idx], arr[ref.idx - 1]];
    else if (act === "down" && ref.idx < arr.length - 1) [arr[ref.idx + 1], arr[ref.idx]] = [arr[ref.idx], arr[ref.idx + 1]];
    else if (act === "del-entity") ref.step.entities.splice(Number(btn.dataset.ei), 1);
    else return;
    this._renderEditor();
  }

  async _save() {
    const d = this._draft;
    this._editorError = null;
    const fail = (msg) => { this._editorError = msg; this._renderEditor(); };
    if (!d.name.trim()) return fail("Ange ett namn på sekvensen.");

    const clean = (steps, label) => {
      return steps.map((s, i) => {
        let data = {};
        if (s._dataText && s._dataText.trim()) {
          try { data = JSON.parse(s._dataText); } catch (e) { throw new Error(`${label} steg ${i + 1}: ogiltig JSON i extra data.`); }
          if (typeof data !== "object" || Array.isArray(data) || data === null) throw new Error(`${label} steg ${i + 1}: extra data måste vara ett JSON-objekt.`);
        }
        if (s.action === "service" && !/^[a-z0-9_]+\.[a-z0-9_]+$/.test(s.service || "")) {
          throw new Error(`${label} steg ${i + 1}: ange en tjänst som domän.tjänst.`);
        }
        if (s.action !== "service" && !s.entities.length) {
          throw new Error(`${label} steg ${i + 1}: lägg till minst en entitet.`);
        }
        return {
          id: s.id, name: s.name || "", entities: s.entities, action: s.action,
          service: s.action === "service" ? s.service : "", data, delay: Number(s.delay || 0),
        };
      });
    };

    let payload;
    try {
      payload = {
        ...(d.id ? { id: d.id } : {}),
        name: d.name.trim(),
        icon: (d.icon || "").trim(),
        stop_mode: d.stop_mode,
        start_steps: clean(d.start_steps, "Start,"),
        stop_steps: d.stop_mode === "custom" ? clean(d.stop_steps, "Avstängning,") : [],
      };
    } catch (err) { return fail(err.message); }

    try {
      await this._hass.callWS({ type: "sequencer/save", sequence: payload });
      this._closeEditor();
      await this._load();
    } catch (err) {
      fail(err.message || String(err));
    }
  }
}

customElements.define("sequencer-panel", SequencerPanel);
