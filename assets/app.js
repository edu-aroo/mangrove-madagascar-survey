/* =====================================================================
   SURVEY ENGINE — renders questions.js, validates, saves draft, submits
   You should not need to edit this file.
   ===================================================================== */
(function () {
  "use strict";
  const CFG = window.SURVEY_CONFIG;
  const SV = window.SURVEY;
  const DRAFT_KEY = "mangrove_survey_draft_v1";
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------------- State ---------------- */
  let state = { id: uid(), started: new Date().toISOString(), general: {}, methods: [], step: 0, maxStep: 0 };
  const files = {}; // key "k|qid" -> [{name, mime, size, data(base64), preview}]

  function uid() {
    const d = new Date(), p = (n) => String(n).padStart(2, "0");
    return `MG-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  }

  // Normalise question specs
  const prep = (q) => {
    if (q.other) q.specify = Array.from(new Set([...(q.specify || []), "Autre"]));
    return q;
  };
  SV.general.forEach((s) => s.questions.forEach(prep));
  SV.method.forEach(prep);
  SV.final.questions.forEach(prep);
  const allGeneralQs = [...SV.general.flatMap((s) => s.questions), ...SV.final.questions].filter((q) => q.id);

  /* ---------------- Steps ---------------- */
  function nMethods() {
    const g = state.general;
    if (!["Oui", "Auparavant, mais plus actuellement"].includes(g.q11)) return 0;
    const n = parseInt(g.q12, 10);
    return Number.isFinite(n) && n > 0 ? Math.min(n, 10) : 0;
  }
  function steps() {
    const st = SV.general.map((s) => ({ kind: "g", sec: s, title: s.title, short: s.short }));
    for (let k = 0; k < nMethods(); k++) {
      const m = state.methods[k] || {};
      const name = m.q13 ? (m.q13_precision && m.q13_precision.trim() ? m.q13_precision : m.q13) : "";
      st.push({ kind: "m", k, title: `Méthode ${k + 1}${name ? " : " + name : ""}`, short: `Méthode ${k + 1}` });
    }
    st.push({ kind: "g", sec: SV.final, title: SV.final.title, short: SV.final.short, last: true });
    return st;
  }
  const scopeOf = (step) => {
    if (step.kind === "m") { state.methods[step.k] = state.methods[step.k] || {}; return { obj: state.methods[step.k], k: step.k, qs: SV.method }; }
    return { obj: state.general, k: "g", qs: step.sec.questions };
  };

  /* ---------------- Visibility & values ---------------- */
  function visible(q, obj) {
    if (!q.showIf) return true;
    const v = obj[q.showIf.q];
    if (q.showIf.any) return Array.isArray(v) ? v.length > 0 : !!v;
    if (Array.isArray(v)) return v.some((x) => q.showIf.in.includes(x));
    return q.showIf.in.includes(v);
  }
  function empty(q, obj, k) {
    if (q.type === "file") return !(files[`${k}|${q.id}`] || []).length;
    if (q.type === "top3") return !obj[q.id + "_1"];
    const v = obj[q.id];
    return v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length);
  }

  /* ---------------- Rendering ---------------- */
  function renderHeader() {
    $("#logos").innerHTML = CFG.logos.map((l) => `<img src="${esc(l.src)}" alt="${esc(l.alt)}" title="${esc(l.alt)}">`).join("");
    $("#title").textContent = CFG.title;
    $("#subtitle").textContent = CFG.subtitle;
    $("#intro").innerHTML = CFG.intro.map((p) => `<p>${esc(p)}</p>`).join("");
    const facts = [];
    if (CFG.duration) facts.push(`<div><span>Durée estimée</span><strong>${esc(CFG.duration)}</strong></div>`);
    if (CFG.deadline) facts.push(`<div><span>Date limite</span><strong>${esc(CFG.deadline)}</strong></div>`);
    if (CFG.contact && CFG.contact.email) facts.push(`<div><span>Contact</span><strong>${esc(CFG.contact.name)} <a href="mailto:${esc(CFG.contact.email)}">${esc(CFG.contact.email)}</a></strong></div>`);
    facts.push(`<div><span>Langue</span><strong>Français</strong></div>`);
    $("#facts").innerHTML = facts.join("");
    $("#consentText").textContent = CFG.consent;
    if (!CFG.SCRIPT_URL) $("#testBanner").hidden = false;
  }

  function renderStepper() {
    const st = steps();
    $("#stepper").innerHTML = st.map((s, i) => {
      const cls = i === state.step ? "current" : i < state.maxStep || i < state.step ? "done" : i <= state.maxStep ? "reach" : "";
      return `<li class="${cls}"><button type="button" data-go="${i}" ${i > state.maxStep ? "disabled" : ""}>
        <span class="dot">${i < state.step ? "✓" : i + 1}</span><span class="lbl">${esc(s.short)}</span></button></li>`;
    }).join("");
    const pct = Math.round((state.step / (st.length - 1)) * 100);
    $("#progressBar").style.width = pct + "%";
    $("#progressTxt").textContent = `Étape ${state.step + 1} sur ${st.length}`;
  }

  function qHTML(q, obj, k) {
    if (q.sub) return `<h3 class="sub">${esc(q.sub)}</h3>${q.note ? `<p class="note">${esc(q.note)}</p>` : ""}`;
    const name = `${k}__${q.id}`;
    const v = obj[q.id];
    const req = q.req ? `<span class="req" aria-hidden="true">*</span>` : "";
    let body = "";
    const textType = { text: "text", email: "email", tel: "tel", number: "number", year: "number", date: "date" }[q.type];
    if (textType) {
      const extra = q.type === "year" ? `min="1950" max="${new Date().getFullYear()}" step="1" placeholder="AAAA"`
        : q.type === "number" ? `step="any" ${q.min != null ? `min="${q.min}"` : 'min="0"'} ${q.max != null ? `max="${q.max}"` : ""}` : "";
      body = `<div class="inwrap ${q.unit ? "hasunit" : ""}"><input id="${name}" name="${name}" data-q="${q.id}" type="${textType}" ${extra} value="${esc(v ?? "")}">${q.unit ? `<span class="unit">${esc(q.unit)}</span>` : ""}</div>`;
    } else if (q.type === "textarea") {
      body = `<textarea id="${name}" name="${name}" data-q="${q.id}" rows="3">${esc(v ?? "")}</textarea>`;
    } else if (q.type === "radio" || q.type === "checkbox") {
      const sel = q.type === "checkbox" ? v || [] : [v];
      body = `<div class="opts ${q.opts.length > 6 ? "cols" : ""}">` + q.opts.map((o, i) =>
        `<label class="opt"><input type="${q.type}" name="${name}" data-q="${q.id}" value="${esc(o)}" ${sel.includes(o) ? "checked" : ""}><span>${esc(o)}</span></label>`).join("") + `</div>`;
      if (q.specify) {
        const show = sel.some((x) => q.specify.includes(x));
        body += `<div class="specify" ${show ? "" : "hidden"}><input type="text" data-q="${q.id}_precision" name="${name}_precision"
          placeholder="${esc(q.specifyLabel || "Précisez")}" aria-label="${esc(q.specifyLabel || "Précisez")}" value="${esc(obj[q.id + "_precision"] ?? "")}"></div>`;
      }
    } else if (q.type === "likert") {
      body = `<div class="likert">` + q.opts.map((o, i) => {
        const [num, ...rest] = o.split(" = ");
        return `<label class="lk"><input type="radio" name="${name}" data-q="${q.id}" value="${i + 1}" ${String(v) === String(i + 1) ? "checked" : ""}>
          <span class="num">${esc(num)}</span><span class="lt">${esc(rest.join(" = "))}</span></label>`;
      }).join("") + `</div>`;
    } else if (q.type === "top3") {
      body = `<div class="top3" data-from="${q.from}">` + [1, 2, 3].map((r) =>
        `<label><span class="rank">${r}</span><select data-q="${q.id}_${r}" name="${name}_${r}"></select></label>`).join("") + `</div>`;
    } else if (q.type === "file") {
      const accept = q.kind === "image" ? "image/jpeg,image/png" : ".pdf,.doc,.docx,.odt,.txt,application/pdf";
      body = `<label class="drop"><input type="file" data-file="${q.id}" accept="${accept}" ${q.kind === "image" ? "multiple" : ""}>
        <span class="dropicon">${q.kind === "image" ? "📷" : "📄"}</span>
        <span>${q.kind === "image" ? `Cliquez pour choisir jusqu’à ${CFG.maxPhotosPerMethod} photos` : `Cliquez pour choisir un fichier (max ${CFG.maxDocMB} Mo)`}</span></label>
        <ul class="filelist" data-list="${q.id}"></ul>`;
    }
    return `<div class="q" data-qid="${q.id}" ${visible(q, obj) ? "" : "hidden"}>
      <label class="qlabel" for="${name}"><span class="qn">${q.n}</span><span>${esc(q.label)}${req}</span></label>
      ${q.hint ? `<p class="hint">${esc(q.hint)}</p>` : ""}${body}<p class="err" role="alert"></p></div>`;
  }

  function renderStep() {
    const st = steps();
    if (state.step >= st.length) state.step = st.length - 1;
    const step = st[state.step];
    const sc = scopeOf(step);
    let intro = "";
    if (step.kind === "m") intro = `<p class="lead">Répondez aux questions suivantes pour <strong>une seule méthode</strong>. Les autres méthodes ont chacune leur propre étape.</p>`;
    $("#stepTitle").textContent = step.title;
    $("#stepBody").innerHTML = intro + sc.qs.map((q) => qHTML(q, sc.obj, sc.k)).join("");
    $("#consentBox").hidden = !step.last;
    $("#prevBtn").hidden = state.step === 0;
    $("#nextBtn").hidden = !!step.last;
    $("#submitBtn").hidden = !step.last;
    refreshTop3(sc);
    sc.qs.filter((q) => q.type === "file").forEach((q) => renderFiles(sc.k, q.id));
    renderStepper();
  }

  function refreshTop3(sc) {
    document.querySelectorAll(".top3").forEach((box) => {
      const from = box.dataset.from;
      const q = sc.qs.find((x) => x.id === from);
      let items = (sc.obj[from] || []).slice();
      if (items.includes("Autre")) items = items.map((x) => x === "Autre" ? `Autre : ${sc.obj[from + "_precision"] || "…"}` : x);
      box.querySelectorAll("select").forEach((s) => {
        const key = s.dataset.q;
        let cur = sc.obj[key] || "";
        if (cur && !items.includes(cur)) { cur = ""; delete sc.obj[key]; }
        s.innerHTML = `<option value="">${items.length ? "— choisir —" : "Cochez d’abord des contraintes ci-dessus"}</option>` +
          items.map((o) => `<option ${o === cur ? "selected" : ""}>${esc(o)}</option>`).join("");
      });
    });
  }

  function refreshVisibility(sc) {
    sc.qs.forEach((q) => {
      if (!q.id) return;
      const el = document.querySelector(`.q[data-qid="${q.id}"]`);
      if (el) el.hidden = !visible(q, sc.obj);
      if (q.specify && el) {
        const v = sc.obj[q.id];
        const sel = Array.isArray(v) ? v : [v];
        $(".specify", el).hidden = !sel.some((x) => q.specify.includes(x));
      }
    });
  }

  /* ---------------- Input handling ---------------- */
  function onInput(e) {
    const t = e.target;
    if (!t.dataset.q) return;
    const sc = scopeOf(steps()[state.step]);
    const key = t.dataset.q;
    if (t.type === "checkbox") {
      sc.obj[key] = Array.from(document.querySelectorAll(`input[name="${t.name}"]:checked`)).map((x) => x.value);
    } else if (t.type === "radio") {
      sc.obj[key] = t.value;
    } else {
      sc.obj[key] = t.value;
    }
    const qel = t.closest(".q");
    if (qel) { qel.classList.remove("invalid"); $(".err", qel).textContent = ""; }
    refreshVisibility(sc);
    if (sc.qs.some((q) => q.type === "top3" && (key === q.from || key === q.from + "_precision"))) refreshTop3(sc);
    if (["q11", "q12", "q13", "q13_precision"].includes(key)) renderStepper();
    saveDraft();
  }

  /* ---------------- Files ---------------- */
  async function onFile(e) {
    const t = e.target;
    if (!t.dataset.file) return;
    const step = steps()[state.step];
    const sc = scopeOf(step);
    const q = sc.qs.find((x) => x.id === t.dataset.file);
    const key = `${sc.k}|${q.id}`;
    files[key] = files[key] || [];
    const list = Array.from(t.files);
    const qel = t.closest(".q");
    for (const f of list) {
      try {
        if (q.kind === "image") {
          if (files[key].length >= CFG.maxPhotosPerMethod) { toast(`Maximum ${CFG.maxPhotosPerMethod} photos.`); break; }
          if (!/^image\//.test(f.type)) { toast(`${f.name} n’est pas une image.`); continue; }
          files[key].push(await compressImage(f));
        } else {
          if (f.size > CFG.maxDocMB * 1024 * 1024) { toast(`${f.name} dépasse ${CFG.maxDocMB} Mo.`); continue; }
          files[key] = [await readFile(f)];
        }
      } catch (err) { toast(`Impossible de lire ${f.name}.`); }
    }
    t.value = "";
    if (qel) { qel.classList.remove("invalid"); $(".err", qel).textContent = ""; }
    renderFiles(sc.k, q.id);
  }
  function renderFiles(k, qid) {
    const ul = document.querySelector(`[data-list="${qid}"]`);
    if (!ul) return;
    const arr = files[`${k}|${qid}`] || [];
    ul.innerHTML = arr.map((f, i) => `<li>${f.preview ? `<img src="${f.preview}" alt="">` : `<span class="ficon">📄</span>`}
      <span class="fname">${esc(f.name)}<small>${(f.size / 1024 / 1024).toFixed(2)} Mo</small></span>
      <button type="button" class="rm" data-rm="${qid}" data-i="${i}" aria-label="Retirer">✕</button></li>`).join("");
  }
  function readFile(f) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res({ name: f.name, mime: f.type || "application/octet-stream", size: f.size, data: String(r.result).split(",")[1] });
      r.onerror = rej;
      r.readAsDataURL(f);
    });
  }
  function compressImage(f) {
    return new Promise((res, rej) => {
      const img = new Image();
      const url = URL.createObjectURL(f);
      img.onload = () => {
        const s = Math.min(1, CFG.maxPhotoSidePx / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        const dataUrl = c.toDataURL("image/jpeg", 0.82);
        URL.revokeObjectURL(url);
        const data = dataUrl.split(",")[1];
        res({ name: f.name.replace(/\.[^.]+$/, "") + ".jpg", mime: "image/jpeg", size: Math.round(data.length * 0.75), data, preview: dataUrl });
      };
      img.onerror = rej;
      img.src = url;
    });
  }

  /* ---------------- Validation ---------------- */
  function validateStep() {
    const step = steps()[state.step];
    const sc = scopeOf(step);
    let first = null;
    sc.qs.forEach((q) => {
      if (!q.id || !visible(q, sc.obj)) return;
      const el = document.querySelector(`.q[data-qid="${q.id}"]`);
      let msg = "";
      if (q.req && empty(q, sc.obj, sc.k)) msg = "Cette question est obligatoire.";
      const v = sc.obj[q.id];
      if (!msg && q.specify && (Array.isArray(v) ? v : [v]).some((x) => q.specify.includes(x)) && !(sc.obj[q.id + "_precision"] || "").trim())
        msg = "Merci de préciser votre réponse.";
      if (!msg && q.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = "Adresse e-mail non valide.";
      if (!msg && (q.type === "number" || q.type === "year") && v !== undefined && v !== "") {
        const x = Number(v);
        if (!Number.isFinite(x)) msg = "Veuillez saisir un nombre.";
        else if (q.min != null && x < q.min) msg = `Valeur minimale : ${q.min}.`;
        else if (q.max != null && x > q.max) msg = `Valeur maximale : ${q.max}.`;
        else if (q.type === "year" && (x < 1950 || x > new Date().getFullYear())) msg = "Année non valide.";
        else if (q.type === "number" && q.min == null && x < 0) msg = "La valeur doit être positive.";
      }
      if (!msg && q.type === "top3") {
        const picks = [1, 2, 3].map((r) => sc.obj[`${q.id}_${r}`]).filter(Boolean);
        if (new Set(picks).size !== picks.length) msg = "Chaque contrainte ne peut être choisie qu’une fois.";
      }
      if (el) { el.classList.toggle("invalid", !!msg); $(".err", el).textContent = msg; }
      if (msg && !first) first = el;
    });
    if (step.last && !$("#consent").checked) {
      $("#consentBox").classList.add("invalid");
      first = first || $("#consentBox");
    }
    if (first) { first.scrollIntoView({ behavior: "smooth", block: "center" }); toast("Certaines réponses sont manquantes ou à corriger."); }
    return !first;
  }

  /* ---------------- Navigation ---------------- */
  function go(i) {
    state.step = i;
    state.maxStep = Math.max(state.maxStep, i);
    renderStep();
    saveDraft();
    $("#formCard").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------------- Draft ---------------- */
  let saveT;
  function saveDraft() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state)); $("#saved").textContent = "Brouillon enregistré sur cet appareil"; } catch (e) { /* storage unavailable */ }
    }, 400);
  }
  function loadDraft() {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (d && d.general) { state = Object.assign(state, d); return true; }
    } catch (e) { /* ignore */ }
    return false;
  }

  /* ---------------- Payload & submit ---------------- */
  const join = (v) => Array.isArray(v) ? v.join(" | ") : v ?? "";
  function flatten(qs, obj) {
    const out = {};
    qs.forEach((q) => {
      if (!q.id || q.type === "file") return;
      const vis = visible(q, obj);
      if (q.type === "top3") { [1, 2, 3].forEach((r) => out[`${q.id}_${r}`] = vis ? obj[`${q.id}_${r}`] || "" : ""); return; }
      out[q.id] = vis ? join(obj[q.id]) : "";
      if (q.specify) {
        const sel = Array.isArray(obj[q.id]) ? obj[q.id] : [obj[q.id]];
        out[q.id + "_precision"] = vis && sel.some((x) => q.specify.includes(x)) ? obj[q.id + "_precision"] || "" : "";
      }
    });
    return out;
  }
  function buildPayload() {
    const n = nMethods();
    const general = flatten(allGeneralQs, state.general);
    const methods = [];
    const fileList = [];
    for (let k = 0; k < n; k++) {
      methods.push(Object.assign({ method_index: k + 1 }, flatten(SV.method, state.methods[k] || {})));
      SV.method.filter((q) => q.type === "file").forEach((q) =>
        (files[`${k}|${q.id}`] || []).forEach((f) => fileList.push({ method_index: k + 1, field: q.id, name: f.name, mime: f.mime, data: f.data })));
    }
    return {
      meta: { response_id: state.id, started_at: state.started, submitted_at: new Date().toISOString(),
              n_methods: n, user_agent: navigator.userAgent, form_version: "1.0" },
      general, methods, files: fileList
    };
  }
  function downloadJSON(payload) {
    const p = JSON.parse(JSON.stringify(payload));
    p.files = p.files.map((f) => ({ ...f, data: "[non inclus]" }));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(p, null, 2)], { type: "application/json" }));
    a.download = `reponses_${state.id}.json`;
    a.click();
  }

  async function submit() {
    if (!validateStep()) return;
    const payload = buildPayload();
    window.__lastPayload = payload; // for debugging / tests
    const ov = $("#overlay");
    ov.hidden = false;
    $("#ovMsg").textContent = payload.files.length ? `Envoi des réponses et de ${payload.files.length} fichier(s)…` : "Envoi des réponses…";
    try {
      if (!CFG.SCRIPT_URL) {
        await new Promise((r) => setTimeout(r, 600));
        console.log("TEST MODE payload", payload);
        done(true, payload);
        return;
      }
      const res = await fetch(CFG.SCRIPT_URL, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "text/plain;charset=utf-8" } });
      const out = await res.json();
      if (!out.ok) throw new Error(out.error || "Erreur serveur");
      done(false, payload);
    } catch (err) {
      ov.hidden = true;
      $("#errorBox").hidden = false;
      $("#errorDetail").textContent = String(err.message || err);
      $("#errorBox").scrollIntoView({ behavior: "smooth", block: "center" });
      $("#dlBtn").onclick = () => downloadJSON(payload);
    }
  }
  function done(test, payload) {
    $("#overlay").hidden = true;
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
    $("#app").hidden = true;
    $("#thanks").hidden = false;
    $("#refId").textContent = state.id;
    if (test) { $("#testNote").hidden = false; $("#dlTest").onclick = () => downloadJSON(payload); }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------------- Misc ---------------- */
  let toastT;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 3500);
  }

  /* ---------------- Init ---------------- */
  function init() {
    renderHeader();
    const resumed = loadDraft();
    if (resumed) $("#resume").hidden = false;
    renderStep();

    const form = $("#form");
    form.addEventListener("input", onInput);
    form.addEventListener("change", (e) => { if (e.target.dataset.file) onFile(e); else onInput(e); });
    form.addEventListener("click", (e) => {
      const rm = e.target.closest("[data-rm]");
      if (rm) {
        const k = scopeOf(steps()[state.step]).k;
        files[`${k}|${rm.dataset.rm}`].splice(+rm.dataset.i, 1);
        renderFiles(k, rm.dataset.rm);
      }
    });
    form.addEventListener("submit", (e) => e.preventDefault());
    $("#stepper").addEventListener("click", (e) => {
      const b = e.target.closest("[data-go]");
      if (!b) return;
      const i = +b.dataset.go;
      if (i > state.step && !validateStep()) return;
      go(i);
    });
    $("#nextBtn").addEventListener("click", () => { if (validateStep()) go(state.step + 1); });
    $("#prevBtn").addEventListener("click", () => go(state.step - 1));
    $("#submitBtn").addEventListener("click", submit);
    $("#retryBtn").addEventListener("click", () => { $("#errorBox").hidden = true; submit(); });
    $("#consent").addEventListener("change", () => $("#consentBox").classList.remove("invalid"));
    $("#startBtn").addEventListener("click", () => { $("#formCard").scrollIntoView({ behavior: "smooth" }); });
    $("#resetBtn").addEventListener("click", () => {
      if (!window.confirm("Effacer toutes les réponses enregistrées et recommencer ?")) return;
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
      location.reload();
    });
    window.addEventListener("beforeunload", (e) => {
      if (Object.keys(files).some((k) => files[k].length) && $("#thanks").hidden) { e.preventDefault(); e.returnValue = ""; }
    });
  }
  document.addEventListener("DOMContentLoaded", init);
})();
