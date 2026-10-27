/* =====================================================================
   Moteur du formulaire — généré à partir de survey-config.js
   Normalement, aucune modification n'est nécessaire ici.
   ===================================================================== */
(function () {
  "use strict";

  const META = SURVEY.META;
  const MAX_METHODS = SURVEY.MAX_METHODS || 3;
  const STORE_KEY = (META.storeKey || "enquete-draft-v") + META.version;
  const LOOP = SURVEY.LOOP || null;                           // blocs répétés par méthode (voir survey-config.js)
  const HAS_METHODS = !!LOOP;
  const QDEF = {};
  SURVEY.STEPS.forEach(s => s.questions.forEach(q => { QDEF[q.id] = q; }));
  const PHOTOS = SURVEY.PHOTOS || [];
  const photoByKey = k => PHOTOS.find(p => p.key === k);
  const SEP = " | ";
  const LOOP_KEY = (LOOP && LOOP.key) || "element";            // préfixe des colonnes de la boucle (methode_index…)
  const DEFAULT_EXT = ["pdf", "doc", "docx", "xls", "xlsx", "csv", "jpg", "jpeg", "png"];
  const FMT_NAMES = { pdf: "PDF", doc: "Word", docx: "Word", xls: "Excel", xlsx: "Excel", csv: "CSV", jpg: "JPG", jpeg: "JPG", png: "PNG" };
  const acceptOf = q => q.accept || DEFAULT_EXT;
  const formatsOf = q => Array.from(new Set(acceptOf(q).map(e => FMT_NAMES[e] || e.toUpperCase()))).join(", ");

  /* ------------------------------------------------------------ état */
  let state = freshState();
  let files = {};             // fichiers joints par question {qid: [{name, type, dataUrl, kb, isImage}]} — non sauvegardés dans le brouillon
  const filesOf = qid => (files[qid] = files[qid] || []);
  let steps = [];
  let saveTimer = null;

  function freshState() {
    return {
      responseId: uuid(),
      startedAt: new Date().toISOString(),
      consent: false,
      general: {},
      methods: {},            // nom de méthode -> réponses
      current: 0,
      maxReached: 0
    };
  }

  /* --------------------------------------------------------- helpers */
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const isEmpty = v => v == null || v === "" || (Array.isArray(v) && (v.length === 0 || v.every(x => x === "" || x == null)));
  const isOther = o => /^Autre/.test(o) || /\(préciser\)/.test(o);
  const isExclusive = o => /^(Aucun|Ne sait pas)/.test(o);
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function optionsOf(q) {
    if (q.optionsFrom) return SURVEY[q.optionsFrom];
    return q.options || [];
  }
  function optionLabel(o) { return o === "Autre" ? "Autre (préciser)" : o; }

  /* ---------------------------------------------- méthodes décrites */
  function selectedMethodNames() {
    if (!HAS_METHODS) return [];
    const src = LOOP.source;
    const sel = state.general[src] || [];
    return sel.map(v => isOther(v)
      ? (state.general[src + "_autre"] ? "Autre : " + state.general[src + "_autre"].trim() : (LOOP.otherName || "Autre"))
      : v);
  }
  function methodNames() {
    if (!HAS_METHODS) return [];
    if (!condDeep(LOOP.active, state.general)) return [];
    return selectedMethodNames();
  }
  function methodAnswers(name) {
    if (!state.methods[name]) state.methods[name] = {};
    return state.methods[name];
  }

  /* ---------------------------------------------------- conditions */
  function cond(c, ans) {
    if (!c) return true;
    if (c.all) return c.all.every(x => cond(x, ans));
    const v = ans[c.q];
    if ("eq" in c) return Array.isArray(v) ? v.includes(c.eq) : v === c.eq;
    if ("ne" in c) return Array.isArray(v) ? !v.includes(c.ne) : v !== c.ne;
    if ("in" in c) return c.in.includes(v);
    const arr = Array.isArray(v) ? v : (isEmpty(v) ? [] : [v]);
    if ("starts" in c) return arr.some(x => String(x).startsWith(c.starts));
    if ("any" in c) return arr.some(x => c.any.includes(x));
    if ("notOnly" in c) return !(arr.length === 1 && arr[0] === c.notOnly);
    if (c.filled) return (QDEF[c.q] && QDEF[c.q].type === "file") ? filesOf(c.q).length > 0 : !isEmpty(v);
    return true;
  }
  // Condition + visibilité de la question dont elle dépend (conditions en cascade : Q13 ← Q12 ← Q11)
  function condDeep(c, ans, self) {
    if (!c) return true;
    if (c.all) return c.all.every(x => condDeep(x, ans, self));
    const parent = QDEF[c.q];
    if (parent && parent !== self && !questionVisible(parent, ans)) return false;
    return cond(c, ans);
  }
  function questionVisible(q, ans) {
    if (!q.showIf) return true;
    return condDeep(q.showIf, ans, q);
  }

  /* --------------------------------------------------------- étapes */
  function buildSteps() {
    const out = [{ id: "intro", kind: "intro", title: "Bienvenue", short: "Présentation", group: null }];
    let methodBlockDone = false;
    const perMethod = SURVEY.STEPS.filter(s => s.perMethod);
    for (const s of SURVEY.STEPS) {
      if (s.perMethod) {
        if (methodBlockDone) continue;
        methodBlockDone = true;
        methodNames().forEach((name, i) => {
          const merged = Object.assign({}, state.general, methodAnswers(name));
          const active = perMethod.filter(pm => condDeep(pm.showIf, merged));
          active.forEach((pm, j) => {
            out.push({
              id: "m" + i + "-" + pm.key, kind: "questions", def: pm, title: pm.title, short: pm.short,
              scope: { method: name, index: i }, group: LOOP.label + " " + (i + 1) + " · " + name,
              sub: (j + 1) + "/" + active.length
            });
          });
        });
        continue;
      }
      if (!condDeep(s.showIf, state.general)) continue;
      out.push({ id: s.key, kind: "questions", def: s, title: s.title, short: s.short, scope: null, group: null });
    }
    out.push({ id: "recap", kind: "recap", title: "Vérification et envoi", short: "Vérification et envoi", group: null });
    return out;
  }
  function scopeAnswers(step) {
    return step.scope ? methodAnswers(step.scope.method) : state.general;
  }
  function condAnswers(step) {
    return step.scope ? Object.assign({}, state.general, methodAnswers(step.scope.method)) : state.general;
  }

  /* ------------------------------------------------------ photos */
  // Fichier local (assets/img/photos) en priorité ; à défaut, copie hébergée sur Wikimedia Commons
  function photoImg(p, cls, sizes) {
    if (!p) return "";
    return `<img class="${cls || ""}" src="${esc(p.src)}" data-remote="${esc(p.remote)}" alt="${esc(p.caption)}" loading="lazy" ${sizes ? `sizes="${sizes}"` : ""}
      onerror="if(this.dataset.remote&&this.src!==this.dataset.remote){this.src=this.dataset.remote}else{this.closest('figure,.photo-slot')&&this.closest('figure,.photo-slot').classList.add('no-photo')}">`;
  }
  function photoFigure(p, cls) {
    if (!p) return "";
    return `<figure class="photo ${cls || ""}">${photoImg(p)}
      <figcaption><span>${esc(p.caption)}</span><a href="${esc(p.page)}" target="_blank" rel="noopener">© ${esc(p.credit)} · ${esc(p.license)}</a></figcaption></figure>`;
  }

  /* ------------------------------------------------- rendu en-tête */
  function renderChrome() {
    const hero = photoByKey(META.heroPhoto);
    if (hero) {
      $("#heroPhoto").innerHTML = photoImg(hero, "hero-img");
      $("#heroCredit").innerHTML = `${esc(hero.caption)} · <a href="${esc(hero.page)}" target="_blank" rel="noopener">© ${esc(hero.credit)}, ${esc(hero.license)}</a>`;
    }
    if (META.photoCreditNote) $("#photoCredits").textContent = META.photoCreditNote;
    document.title = META.title;
    $("#heroTitle").textContent = META.title;
    $("#heroSubtitle").textContent = META.subtitle;
    $("#heroOrganizer").textContent = META.organizer;
    $("#chipTime").textContent = META.estimatedTime;
    $("#chipDeadline").textContent = META.deadline;
    $("#footerOrganizer").textContent = META.organizer;
    const mail = $("#footerContact");
    mail.textContent = META.contactName + " — " + META.contactEmail;
    mail.href = "mailto:" + META.contactEmail;
    $("#footerYear").textContent = new Date().getFullYear();
    $("#headerYear").textContent = new Date().getFullYear();

    const logos = $("#logos");
    logos.innerHTML = META.logos.map(l => {
      const img = `<img src="${esc(l.src)}" alt="${esc(l.alt)}" loading="eager" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'logo-fallback',textContent:this.alt}))">`;
      return `<li class="logo">${l.url ? `<a href="${esc(l.url)}" target="_blank" rel="noopener">${img}</a>` : img}</li>`;
    }).join("");
  }

  /* ------------------------------------------------------ sidebar */
  function renderSidebar() {
    const list = $("#stepList");
    let html = "", lastGroup = null;
    steps.forEach((s, i) => {
      if (s.group !== lastGroup) {
        if (lastGroup !== null) html += "</ol></li>";
        if (s.group) html += `<li class="step-group"><span class="group-title">${esc(s.group)}</span><ol>`;
        lastGroup = s.group;
      }
      const cls = ["step-link", i === state.current ? "is-current" : "", i < state.current ? "is-done" : "", i > state.maxReached ? "is-locked" : ""].join(" ");
      html += `<li><button type="button" class="${cls}" data-step="${i}" ${i > state.maxReached ? "disabled" : ""}>
        <span class="step-dot" aria-hidden="true"></span><span class="step-name">${esc(s.short)}</span></button></li>`;
    });
    if (lastGroup !== null) html += "</ol></li>";
    list.innerHTML = html;

    const pct = Math.round(100 * state.current / Math.max(1, steps.length - 1));
    $("#progressBar").style.width = pct + "%";
    $("#progressBar").parentElement.setAttribute("aria-valuenow", pct);
    $("#progressLabel").textContent = "Étape " + (state.current + 1) + " sur " + steps.length;
    $("#progressPct").textContent = pct + " %";
    $("#mobileStepName").textContent = steps[state.current].short;
  }

  /* ---------------------------------------------- rendu questions */
  function uidFor(step, q) { return step.id + "__" + q.id; }

  function renderQuestion(step, q) {
    const ans = scopeAnswers(step);
    const uid = uidFor(step, q);
    const v = ans[q.id];
    const req = q.required ? `<span class="req" title="Obligatoire">*</span>` : "";
    const num = `<span class="q-num">Q${esc(q.n)}</span>`;
    let field = "";

    switch (q.type) {
      case "text": case "email": case "tel": {
        const t = q.type === "text" ? "text" : q.type;
        const ac = q.autocomplete || "off";
        field = `<input class="input" type="${t}" id="${uid}" name="${uid}" value="${esc(v || "")}" autocomplete="${ac}">`;
        break;
      }
      case "textarea":
        field = `<textarea class="input" id="${uid}" name="${uid}" rows="4">${esc(v || "")}</textarea>`;
        break;
      case "number": case "year": {
        const yr = new Date().getFullYear();
        const min = q.type === "year" ? 1950 : (q.min != null ? q.min : "");
        const max = q.type === "year" ? yr : (q.max != null ? q.max : "");
        const unitSel = q.units ? `<select class="input input-unit" name="${uid}__unite" data-sub="unite" aria-label="Unité">${q.units.map(u =>
            `<option value="${esc(u)}" ${(ans[q.id + "_unite"] || q.units[0]) === u ? "selected" : ""}>${esc(u)}</option>`).join("")}</select>` : "";
        field = `<div class="num-wrap"><input class="input input-num" type="number" inputmode="${q.type === "year" ? "numeric" : "decimal"}" step="${q.type === "year" ? 1 : "any"}"
          id="${uid}" name="${uid}" value="${v == null ? "" : esc(v)}" ${min !== "" ? `min="${min}"` : ""} ${max !== "" ? `max="${max}"` : ""} ${q.type === "year" ? 'placeholder="AAAA"' : ""}>
          ${q.unit ? `<span class="unit">${esc(q.unit)}</span>` : ""}${unitSel}</div>`;
        break;
      }
      case "grid": {
        const g = v || {};
        field = `<div class="grid-rows">` + q.rows.map(r => `<label class="grid-row" for="${uid}__${r.key}"><span>${esc(r.label)}</span>
            <span class="num-wrap"><input class="input input-num" type="number" min="0" step="1" inputmode="numeric" id="${uid}__${r.key}" data-row="${r.key}" value="${g[r.key] == null ? "" : esc(g[r.key])}">
            ${q.unit ? `<span class="unit">${esc(q.unit)}</span>` : ""}</span></label>`).join("") + `</div>`;
        break;
      }
      case "date":
        field = `<input class="input" type="date" id="${uid}" name="${uid}" value="${esc(v || "")}" max="${new Date().toISOString().slice(0, 10)}" style="max-width:220px">`;
        break;
      case "datetime":
        field = `<input class="input" type="datetime-local" id="${uid}" name="${uid}" value="${esc(v || "")}">`;
        break;
      case "radio": case "checkbox": case "methodpick": {
        const multi = q.type !== "radio";
        const opts = q.type === "methodpick" ? selectedMethodNames() : optionsOf(q);
        const sel = multi ? (v || []) : v;
        const lim = q.max || (q.type === "methodpick" ? MAX_METHODS : 0);
        const full = lim && multi && sel.length >= lim;
        const one = o => {
          const checked = multi ? sel.includes(o) : sel === o;
          const dis = full && !checked;
          return `<label class="choice${dis ? " is-disabled" : ""}"><input type="${multi ? "checkbox" : "radio"}" name="${uid}" value="${esc(o)}" ${checked ? "checked" : ""} ${dis ? "disabled" : ""}>
            <span class="mark" aria-hidden="true"></span><span class="choice-text">${esc(q.type === "methodpick" ? o : optionLabel(o))}</span></label>`;
        };
        const block = list => `<div class="choices${list.length > (q.groups ? 2 : 6) ? " choices-2col" : ""}" role="${multi ? "group" : "radiogroup"}">${list.map(one).join("")}</div>`;
        field = q.groups
          ? `<div class="choice-groups">` + q.groups.map(g => `<div class="choice-group">${g.label ? `<p class="choice-group-title">${esc(g.label)}</p>` : ""}${block(g.options)}</div>`).join("") + `</div>`
          : block(opts);
        if (q.other) {
          const show = multi ? (sel || []).some(isOther) : isOther(sel || "");
          field += `<div class="other-wrap" ${show ? "" : "hidden"}><input class="input" type="text" name="${uid}__autre" data-sub="autre"
            placeholder="Précisez…" value="${esc(ans[q.id + "_autre"] || "")}" aria-label="Précisez « Autre »"></div>`;
        }
        if (q.explain) {
          field += `<label class="explain-label" for="${uid}__pourquoi">${esc(q.explain)}</label>
            <textarea class="input" id="${uid}__pourquoi" name="${uid}__pourquoi" data-sub="pourquoi" rows="3">${esc(ans[q.id + "_pourquoi"] || "")}</textarea>`;
        }
        break;
      }
      case "scale": {
        field = `<div class="scale" role="radiogroup">` + q.options.map((o, k) => {
          const val = k + 1;
          return `<label class="scale-item"><input type="radio" name="${uid}" value="${val}" ${Number(v) === val ? "checked" : ""}>
            <span class="scale-box"><span class="scale-num">${val}</span><span class="scale-txt">${esc(o)}</span></span></label>`;
        }).join("") + `</div>`;
        break;
      }
      case "rank":
        field = `<div class="rank" data-rank-for="${q.rankFrom}">${renderRankInner(step, q)}</div>`;
        break;
      case "file":
        field = `<div class="dropzone" id="${uid}" data-file-q="${q.id}" tabindex="0">
            <input type="file" accept="${acceptOf(q).map(e => "." + e).join(",")}" multiple hidden>
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z"/></svg>
            <p><strong>Cliquez pour choisir des fichiers</strong> ou glissez-les ici</p>
            <p class="muted small">${esc(formatsOf(q))} · ${q.maxFiles} fichiers et ${q.maxMB} Mo maximum</p>
          </div><ul class="thumbs" id="thumbs-${q.id}"></ul>`;
        break;
    }
    if (q.detail) {
      field += `<label class="explain-label" for="${uid}__detail">${esc(q.detail.label)} <span class="muted small">(facultatif)</span></label>
        <input class="input${q.detail.type === "number" ? " input-num" : ""}" type="${q.detail.type === "number" ? "number" : "text"}" ${q.detail.type === "number" ? 'min="0" style="max-width:200px"' : ""}
          id="${uid}__detail" name="${uid}__detail" data-sub="detail" value="${esc(ans[q.id + "_detail"] || "")}">`;
    }
    const sigAttr = q.type === "methodpick" ? ` data-sig="${esc(selectedMethodNames().join("\u0001"))}"` : "";
    return `<div class="q" data-qid="${q.id}" data-type="${q.type}"${sigAttr} ${questionVisible(q, condAnswers(step)) ? "" : "hidden"}>
      <div class="q-head">${num}<label class="q-label" ${["radio", "checkbox", "scale", "rank", "methodpick", "file", "grid"].includes(q.type) ? "" : `for="${uid}"`}>${esc(q.label)}${req}</label></div>
      ${q.help ? `<p class="q-help">${esc(q.help)}</p>` : ""}
      <div class="q-field">${field}</div>
      <p class="q-error" role="alert"></p>
    </div>`;
  }

  function rankChoices(step, q) {
    const ans = scopeAnswers(step);
    return (ans[q.rankFrom] || []).map(o => isOther(o) ? (ans[q.rankFrom + "_autre"] ? "Autre : " + ans[q.rankFrom + "_autre"] : "Autre") : o);
  }
  function renderRankInner(step, q) {
    const choices = rankChoices(step, q);
    const ans = scopeAnswers(step);
    const cur = ans[q.id] || [];
    if (!choices.length) return `<p class="muted">Sélectionnez d'abord des contraintes à la question précédente.</p>`;
    const n = Math.min(q.ranks, choices.length);
    let html = "";
    for (let r = 0; r < n; r++) {
      html += `<div class="rank-row"><span class="rank-badge">${r + 1}</span>
        <select class="input" name="${uidFor(step, q)}" data-rank="${r}" aria-label="Rang ${r + 1}">
        <option value="">— Choisir —</option>
        ${choices.map(c => `<option value="${esc(c)}" ${cur[r] === c ? "selected" : ""} ${cur.includes(c) && cur[r] !== c ? "disabled" : ""}>${esc(c)}</option>`).join("")}
        </select></div>`;
    }
    return html;
  }

  /* ------------------------------------------------- rendu étapes */
  function renderStep() {
    const step = steps[state.current];
    const box = $("#stepContainer");
    let html = "";

    if (step.kind === "intro") {
      html = `<div class="step-head"><p class="eyebrow">Présentation</p><h2>${esc(META.title)}</h2></div>
        <div class="intro">${META.intro.map(p => `<p>${esc(p)}</p>`).join("")}</div>
            ${META.draftNote ? `<div class="notice"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm3-10H5V5h10v4z"/></svg>
          <div><strong>Enregistrement automatique</strong><p>${esc(META.draftNote)}</p></div></div>` : ""}
        ${(META.introPhotos || []).length ? `<div class="photo-mosaic">${META.introPhotos.map(k => photoFigure(photoByKey(k))).join("")}</div>` : ""}
        <div class="notice"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
          <div><strong>Confidentialité</strong><p>${esc(META.privacy)}</p></div></div>
       
        <ul class="facts">
          <li><span>Durée estimée</span><strong>${esc(META.estimatedTime)}</strong></li>
          <li><span>Date limite</span><strong>${esc(META.deadline)}</strong></li>
          <li><span>Contact</span><strong><a href="mailto:${esc(META.contactEmail)}">${esc(META.contactEmail)}</a></strong></li>
        </ul>
        <p class="muted small">Les questions marquées d'un <span class="req">*</span> sont obligatoires.</p>
        <div class="q" data-qid="__consent"><label class="choice choice-consent"><input type="checkbox" id="consent" ${state.consent ? "checked" : ""}>
          <span class="mark" aria-hidden="true"></span><span class="choice-text">${esc(META.consentLabel)} <span class="req">*</span></span></label>
          <p class="q-error" role="alert"></p></div>`;
    } else if (step.kind === "recap") {
      html = renderRecap();
    } else {
      const def = step.def;
      const secLetters = def.sections ? def.sections.join(" · ") : def.key;
      const qSteps = steps.filter(s => s.kind === "questions");
      const others = PHOTOS.filter(p => p.key !== META.heroPhoto);
      const banner = others.length ? others[qSteps.indexOf(step) % others.length] : null;
      html = (banner ? photoFigure(banner, "photo-banner") : "") + `<div class="step-head">
          ${step.scope ? `<div class="method-banner"><span class="method-tag">${esc(LOOP.label)} ${step.scope.index + 1} / ${methodNames().length}</span><strong>${esc(step.scope.method)}</strong><span class="muted small">Partie ${step.sub}</span></div>` : ""}
          <p class="eyebrow">Section ${esc(secLetters)}</p><h2>${esc(def.title)}</h2>
          ${step.scope ? `<p class="muted">Les questions de cette partie portent uniquement sur ${esc(LOOP.scopeText || "l'élément")} <strong>${esc(step.scope.method)}</strong>.</p>` : ""}
        </div>`;
      let lastSec = null;
      def.questions.forEach(q => {
        if (q.section && q.section !== lastSec && def.sections && def.sections.length > 1) {
          html += `<h3 class="sub-section">${esc(sectionTitle(q.section))}</h3>`;
          lastSec = q.section;
        }
        html += renderQuestion(step, q);
      });
    }
    box.innerHTML = html;
    $("#btnPrev").hidden = state.current === 0;
    $("#btnNext").hidden = step.kind === "recap";
    $("#btnNext").textContent = state.current === steps.length - 2 ? "Vérifier mes réponses" : "Suivant";
    if (step.def) step.def.questions.filter(q => q.type === "file").forEach(q => bindDropzone(step, q));
    renderSidebar();
  }

  function sectionTitle(letter) {
    return (SURVEY.SECTIONS || {})[letter] || letter;
  }

  /* -------------------------------------------- lecture des champs */
  function readQuestion(step, qEl) {
    const qid = qEl.dataset.qid;
    const type = qEl.dataset.type;
    const ans = scopeAnswers(step);
    const uid = step.id + "__" + qid;
    const named = n => $$(`[name="${CSS.escape(n)}"]`, qEl);
    switch (type) {
      case "checkbox": case "methodpick":
        ans[qid] = named(uid).filter(i => i.checked).map(i => i.value); break;
      case "radio":
        ans[qid] = (named(uid).find(i => i.checked) || {}).value || ""; break;
      case "scale": {
        const c = named(uid).find(i => i.checked); ans[qid] = c ? Number(c.value) : ""; break;
      }
      case "number": case "year": {
        const raw = named(uid)[0].value; ans[qid] = raw === "" ? "" : Number(raw); break;
      }
      case "rank":
        ans[qid] = named(uid).map(s => s.value); break;
      case "grid": {
        const g = {};
        $$("[data-row]", qEl).forEach(i => { if (i.value !== "") g[i.dataset.row] = Number(i.value); });
        ans[qid] = g; break;
      }
      case "file": break;
      default:
        ans[qid] = named(uid)[0].value;
    }
    const o = $(`[data-sub="autre"]`, qEl); if (o) ans[qid + "_autre"] = o.value;
    const p = $(`[data-sub="pourquoi"]`, qEl); if (p) ans[qid + "_pourquoi"] = p.value;
    const u = $(`[data-sub="unite"]`, qEl); if (u) ans[qid + "_unite"] = u.value;
    const d = $(`[data-sub="detail"]`, qEl); if (d) ans[qid + "_detail"] = d.value;
  }

  function onFieldChange(e) {
    const step = steps[state.current];
    if (e.target.id === "consent") { state.consent = e.target.checked; clearError(e.target.closest(".q")); scheduleSave(); return; }
    const qEl = e.target.closest(".q");
    if (!qEl || step.kind !== "questions") return;
    const qid = qEl.dataset.qid;
    const q = step.def.questions.find(x => x.id === qid);
    // « Aucun… » / « Ne sait pas » : exclusif des autres cases
    if (e.target.type === "checkbox" && e.target.checked && !e.target.dataset.sub) {
      const boxes = $$('.choices input[type="checkbox"]', qEl);
      if (isExclusive(e.target.value)) boxes.forEach(b => { if (b !== e.target) b.checked = false; });
      else boxes.forEach(b => { if (isExclusive(b.value)) b.checked = false; });
    }
    readQuestion(step, qEl);
    const ans = scopeAnswers(step);

    // champ « Autre »
    const ow = $(".other-wrap", qEl);
    if (ow) {
      const v = ans[qid];
      const show = Array.isArray(v) ? v.some(isOther) : isOther(v || "");
      ow.hidden = !show;
      if (show && e.target.type !== "text" && e.target.checked && isOther(e.target.value)) $("input", ow).focus();
    }
    // limite de cases
    const lim = q && (q.max || (q.type === "methodpick" ? MAX_METHODS : 0));
    if (lim) {
      const boxes = $$('input[type="checkbox"]', qEl);
      const n = boxes.filter(b => b.checked).length;
      boxes.forEach(b => { if (!b.checked) b.disabled = n >= lim; b.closest(".choice").classList.toggle("is-disabled", b.disabled); });
    }
    // classement dépendant
    if (q && $$(`.rank[data-rank-for="${qid}"]`).length) {
      const rq = step.def.questions.find(x => x.type === "rank" && x.rankFrom === qid);
      const valid = rankChoices(step, rq);
      ans[rq.id] = (ans[rq.id] || []).filter(x => valid.includes(x));
      $(`.rank[data-rank-for="${qid}"]`).innerHTML = renderRankInner(step, rq);
    }
    if (q && q.type === "rank") {
      const rEl = $(".rank", qEl); rEl.innerHTML = renderRankInner(step, q);
    }
    clearError(qEl);
    updateVisibility(step);

    // Certaines réponses (Q11–Q13, Q15…) modifient la liste des étapes
    const sigOf = list => list.map(s => s.id + ":" + s.group).join("|");
    const fresh = buildSteps();
    if (sigOf(fresh) !== sigOf(steps)) {
      const curId = step.id;
      steps = fresh;
      state.current = Math.max(0, steps.findIndex(s => s.id === curId));
      state.maxReached = Math.min(Math.max(state.maxReached, state.current), steps.length - 1);
      renderSidebar();
    }
    scheduleSave();
  }

  function updateVisibility(step) {
    const ans = condAnswers(step);
    step.def.questions.forEach(q => {
      const el = $(`.q[data-qid="${q.id}"]`);
      if (el) el.hidden = !questionVisible(q, ans);
    });
  }

  /* ---------------------------------------------------- validation */
  function setError(qEl, msg) { qEl.classList.add("has-error"); $(".q-error", qEl).textContent = msg; }
  function clearError(qEl) { if (!qEl) return false; qEl.classList.remove("has-error"); const e = $(".q-error", qEl); if (e) e.textContent = ""; return true; }

  function validateQuestion(step, q, ans) {
    const v = ans[q.id];
    if (q.type === "file") return null;
    if (q.type === "rank") {
      const need = Math.min(q.ranks, rankChoices(step, q).length);
      if (q.required && need > 0 && (v || []).slice(0, need).filter(Boolean).length < need) return `Veuillez classer ${need} contrainte(s).`;
      return null;
    }
    if (q.type === "grid") {
      if (q.required && !Object.keys(v || {}).length) return "Indiquez au moins un nombre.";
      return null;
    }
    if (q.required && isEmpty(v)) return "Cette question est obligatoire.";
    if (q.other) {
      const hasOther = Array.isArray(v) ? v.some(isOther) : isOther(v || "");
      if (hasOther && isEmpty((ans[q.id + "_autre"] || "").trim())) return "Veuillez préciser votre réponse « Autre ».";
    }
    if (q.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Adresse e-mail non valide.";
    if ((q.type === "number" || q.type === "year") && v !== "" && v != null) {
      if (isNaN(v)) return "Veuillez saisir un nombre.";
      const min = q.type === "year" ? 1950 : q.min, max = q.type === "year" ? new Date().getFullYear() : q.max;
      if (min != null && v < min) return `La valeur doit être supérieure ou égale à ${min}.`;
      if (max != null && v > max) return `La valeur doit être inférieure ou égale à ${max}.`;
    }
    if (q.max && Array.isArray(v) && v.length > q.max) return `${q.max} réponses maximum.`;
    return null;
  }

  function validateStep(step, showErrors) {
    let firstBad = null;
    if (step.kind === "intro") {
      if (!state.consent) {
        if (showErrors) { const el = $('.q[data-qid="__consent"]'); setError(el, "Votre accord est nécessaire pour continuer."); firstBad = el; }
        return showErrors ? firstBad : false;
      }
      return showErrors ? null : true;
    }
    if (step.kind !== "questions") return showErrors ? null : true;
    const ans = scopeAnswers(step), cAns = condAnswers(step);
    let ok = true;
    step.def.questions.forEach(q => {
      if (!questionVisible(q, cAns)) return;
      const msg = validateQuestion(step, q, ans);
      if (msg) {
        ok = false;
        if (showErrors) { const el = $(`.q[data-qid="${q.id}"]`); if (el) { setError(el, msg); firstBad = firstBad || el; } }
      }
    });
    return showErrors ? firstBad : ok;
  }

  /* ---------------------------------------------------- navigation */
  function goTo(i) {
    state.current = Math.max(0, Math.min(i, steps.length - 1));
    state.maxReached = Math.max(state.maxReached, state.current);
    renderStep();
    scheduleSave();
    $("#formTop").scrollIntoView({ behavior: "smooth", block: "start" });
    document.body.classList.remove("nav-open");
  }
  function next() {
    const bad = validateStep(steps[state.current], true);
    if (bad) { bad.scrollIntoView({ behavior: "smooth", block: "center" }); const f = $("input,textarea,select", bad); if (f) f.focus({ preventScroll: true }); return; }
    goTo(state.current + 1);
  }

  /* -------------------------------------------------- récapitulatif */
  function fmt(q, ans) {
    const v = ans[q.id];
    if (q.type === "file") return filesOf(q.id).map(p => p.name).join(" ; ");
    if (q.type === "scale") return v ? v + " — " + q.options[v - 1] : "";
    if (q.type === "rank") return (v || []).filter(Boolean).map((x, i) => (i + 1) + ". " + x).join(" ; ");
    if (q.type === "grid") return q.rows.filter(r => (v || {})[r.key] != null).map(r => r.label + " : " + v[r.key]).join(" ; ");
    if (q.units && v !== "" && v != null) return v + " " + (ans[q.id + "_unite"] || q.units[0]);
    let s = Array.isArray(v) ? v.join(" ; ") : (v == null ? "" : String(v));
    if (q.other && ans[q.id + "_autre"] && (Array.isArray(v) ? v.some(isOther) : isOther(v || ""))) s += " (" + ans[q.id + "_autre"] + ")";
    if (q.explain && ans[q.id + "_pourquoi"]) s += " — " + ans[q.id + "_pourquoi"];
    if (q.detail && ans[q.id + "_detail"]) s += " — " + q.detail.label + " : " + ans[q.id + "_detail"];
    return s;
  }
  function renderRecap() {
    let html = `<div class="step-head"><p class="eyebrow">Dernière étape</p><h2>Vérification et envoi</h2>
      <p class="muted">Relisez vos réponses avant l'envoi. Cliquez sur « Modifier » pour corriger une section.</p></div>`;
    const incomplete = [];
    steps.forEach((s, i) => {
      if (s.kind !== "questions") return;
      const ans = scopeAnswers(s), cAns = condAnswers(s);
      const ok = validateStep(s, false);
      if (!ok) incomplete.push(i);
      const rows = s.def.questions.filter(q => questionVisible(q, cAns)).map(q => {
        const f = fmt(q, ans);
        return `<div class="recap-row"><dt><span class="q-num">Q${esc(q.n)}</span> ${esc(q.label)}</dt><dd>${f ? esc(f) : '<span class="muted">—</span>'}</dd></div>`;
      }).join("");
      html += `<section class="recap-block ${ok ? "" : "is-incomplete"}">
        <header><div><span class="muted small">${esc(s.group || "Section " + s.def.key)}</span><h3>${esc(s.title)}</h3></div>
        <button type="button" class="btn btn-ghost btn-sm" data-step="${i}">Modifier</button></header>
        ${ok ? "" : '<p class="warn">Des réponses obligatoires manquent dans cette section.</p>'}
        <dl>${rows}</dl></section>`;
    });
    html += `<div class="hp" aria-hidden="true"><label>Ne pas remplir<input type="text" id="website" tabindex="-1" autocomplete="off"></label></div>
      <div class="submit-zone">
        ${incomplete.length ? `<p class="warn">Merci de compléter les sections signalées avant l'envoi.</p>` : ""}
        <button type="button" class="btn btn-primary btn-lg" id="btnSubmit" ${incomplete.length ? "disabled" : ""}>Envoyer mes réponses</button>
        <button type="button" class="btn btn-ghost" id="btnDownload">Télécharger une copie de mes réponses (.json)</button>
      </div>`;
    return html;
  }

  /* -------------------------------------------------------- photos */
  function bindDropzone(step, q) {
    const dz = $(`.dropzone[data-file-q="${q.id}"]`); if (!dz) return;
    const input = $('input[type="file"]', dz);
    dz.addEventListener("click", () => input.click());
    dz.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
    dz.addEventListener("dragover", e => { e.preventDefault(); dz.classList.add("is-over"); });
    dz.addEventListener("dragleave", () => dz.classList.remove("is-over"));
    dz.addEventListener("drop", e => { e.preventDefault(); dz.classList.remove("is-over"); addFiles(e.dataTransfer.files, q, step); });
    input.addEventListener("change", () => { addFiles(input.files, q, step); input.value = ""; });
    renderThumbs(step, q);
  }
  async function addFiles(fileList, q, step) {
    const qEl = $('.q[data-qid="' + q.id + '"]');
    const list = filesOf(q.id);
    clearError(qEl);
    const totalKb = () => list.reduce((a, p) => a + p.kb, 0);
    for (const f of Array.from(fileList)) {
      if (list.length >= q.maxFiles) { setError(qEl, `${q.maxFiles} fichiers maximum.`); break; }
      const ext = (f.name.split(".").pop() || "").toLowerCase();
      if (!acceptOf(q).includes(ext)) { setError(qEl, `« ${f.name} » : format non accepté (${formatsOf(q)}).`); continue; }
      try {
        const item = /^image\/(jpeg|png)$/.test(f.type) ? await compress(f) : await readRaw(f, ext);
        if (totalKb() + item.kb > q.maxMB * 1024) { setError(qEl, `« ${f.name} » dépasse la taille totale autorisée (${q.maxMB} Mo). Envoyez les documents volumineux par e-mail à ${META.contactEmail}.`); continue; }
        list.push(item);
      } catch (err) { setError(qEl, `Impossible de lire « ${f.name} ».`); }
    }
    renderThumbs(step, q);
    updateVisibility(step);
  }
  function compress(file, maxDim = 1600, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const r = Math.min(1, maxDim / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        const dataUrl = c.toDataURL("image/jpeg", quality);
        URL.revokeObjectURL(url);
        resolve({ name: file.name.replace(/\.[^.]+$/, "") + ".jpg", type: "image/jpeg", dataUrl, kb: Math.round(dataUrl.length * 0.75 / 1024), isImage: true });
      };
      img.onerror = reject;
      img.src = url;
    });
  }
  const MIME = { pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", csv: "text/csv" };
  function readRaw(file, ext) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const type = file.type || MIME[ext] || "application/octet-stream";
        const dataUrl = "data:" + type + ";base64," + String(r.result).split(",")[1];
        resolve({ name: file.name, type, dataUrl, kb: Math.max(1, Math.round(file.size / 1024)), isImage: false, ext });
      };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
  function renderThumbs(step, q) {
    const ul = $("#thumbs-" + q.id); if (!ul) return;
    const list = filesOf(q.id);
    ul.innerHTML = list.map((p, i) => `<li>${p.isImage ? `<img src="${p.dataUrl}" alt="">` : `<span class="file-icon">${esc((p.ext || "doc").toUpperCase())}</span>`}<span class="thumb-name">${esc(p.name)}<br><span class="muted small">${p.kb} Ko</span></span>
      <button type="button" class="thumb-del" data-del="${i}" aria-label="Retirer ${esc(p.name)}">×</button></li>`).join("");
    $$("[data-del]", ul).forEach(b => b.addEventListener("click", ev => {
      ev.stopPropagation(); list.splice(Number(b.dataset.del), 1); renderThumbs(step, q); updateVisibility(step);
    }));
  }

  /* ------------------------------------------------------ payload */
  function flatten(qs, ans, cAns, includeValues) {
    const out = {};
    qs.forEach(q => {
      const vis = includeValues && questionVisible(q, cAns);
      const v = vis ? ans[q.id] : "";
      switch (q.type) {
        case "file": out[q.id + "_nb_fichiers"] = includeValues ? filesOf(q.id).length : 0; return;
        case "rank":
          for (let r = 0; r < q.ranks; r++) out[q.id + "_rang" + (r + 1)] = vis ? ((v || [])[r] || "") : "";
          return;
        case "grid":
          q.rows.forEach(r => { const x = vis ? (v || {})[r.key] : null; out[q.id + "_" + r.key] = x == null ? "" : x; });
          return;
        case "checkbox": case "methodpick":
          out[q.id] = Array.isArray(v) ? v.join(SEP) : ""; break;
        default:
          out[q.id] = v == null ? "" : v;
      }
      if (q.other) {
        const has = vis && (Array.isArray(v) ? v.some(isOther) : isOther(v || ""));
        out[q.id + "_autre"] = has ? (ans[q.id + "_autre"] || "").trim() : "";
      }
      if (q.explain) out[q.id + "_pourquoi"] = vis ? (ans[q.id + "_pourquoi"] || "").trim() : "";
      if (q.units) out[q.id + "_unite"] = vis && !isEmpty(v) ? (ans[q.id + "_unite"] || q.units[0]) : "";
      if (q.detail) out[q.id + "_detail"] = vis ? String(ans[q.id + "_detail"] || "").trim() : "";
    });
    return out;
  }
  function buildPayload(withPhotos) {
    const general = {};
    const generalSteps = SURVEY.STEPS.filter(s => !s.perMethod);
    const names = methodNames();
    generalSteps.forEach(s => {
      const active = cond(s.showIf, state.general);
      Object.assign(general, flatten(s.questions, state.general, state.general, active));
    });
    if (HAS_METHODS) {
      general["n_" + LOOP_KEY + "s_decrites"] = names.length;
      general[LOOP_KEY + "s_decrites"] = names.join(SEP);
    }
    general.consentement = state.consent ? "Oui" : "Non";

    const perMethod = SURVEY.STEPS.filter(s => s.perMethod);
    const methods = names.map((name, i) => {
      const ans = methodAnswers(name);
      const cAns = Object.assign({}, state.general, ans);
      const row = { [LOOP_KEY + "_index"]: i + 1, [LOOP_KEY + "_nom"]: name };
      perMethod.forEach(s => Object.assign(row, flatten(s.questions, ans, cAns, condDeep(s.showIf, cAns))));
      return row;
    });
    const now = new Date();
    return {
      response_id: state.responseId,
      survey_version: META.version,
      started_at: state.startedAt,
      submitted_at_client: now.toISOString(),
      duration_min: Math.round((now - new Date(state.startedAt)) / 60000),
      website: ($("#website") || {}).value || "",
      general, boucle_cle: LOOP_KEY, boucle: methods,
      fichiers: withPhotos ? Object.keys(files).filter(qid => QDEF[qid] && questionVisible(QDEF[qid], state.general))
        .flatMap(qid => files[qid].map(p => ({ q: qid, name: p.name, type: p.type, data: p.dataUrl.split(",")[1] }))) : []
    };
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(buildPayload(false), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (META.downloadPrefix || "reponses-") + state.responseId.slice(0, 8) + ".json";
    document.body.appendChild(a); a.click(); a.remove();
  }

  async function submit() {
    const bad = steps.findIndex(s => !validateStep(s, false));
    if (bad >= 0) { goTo(bad); setTimeout(() => validateStep(steps[bad], true), 50); return; }
    const btn = $("#btnSubmit");
    if (!META.appsScriptUrl) {
      showStatus("error", "Le formulaire n'est pas encore relié à Google Sheets (URL Apps Script manquante dans survey-config.js). Vous pouvez télécharger une copie de vos réponses.");
      return;
    }
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Envoi en cours…';
    try {
      const res = await fetch(META.appsScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(buildPayload(true))
      });
      const out = await res.json();
      if (!out.ok) throw new Error(out.error || "Erreur inconnue");
      done(out);
    } catch (err) {
      btn.disabled = false; btn.textContent = "Réessayer l'envoi";
      showStatus("error", "L'envoi a échoué (" + err.message + "). Vos réponses sont conservées sur cet appareil : vérifiez votre connexion et réessayez, ou téléchargez une copie et envoyez-la à " + META.contactEmail + ".");
    }
  }
  function showStatus(kind, msg) {
    let el = $("#submitStatus");
    if (!el) { el = document.createElement("p"); el.id = "submitStatus"; $(".submit-zone").prepend(el); }
    el.className = kind === "error" ? "warn" : "ok";
    el.textContent = msg;
  }
  function done(out) {
    try { localStorage.removeItem(STORE_KEY); } catch (e) { }
    const tp = photoByKey(META.thanksPhoto);
    $("#app").innerHTML = `<div class="panel thanks">${tp ? photoFigure(tp, "photo-thanks") : ""}
      <svg viewBox="0 0 24 24" width="56" height="56" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="var(--accent-soft)"/><path fill="var(--accent)" d="M10 15.17 6.83 12l-1.42 1.41L10 18 19 9l-1.41-1.41z"/></svg>
      <h2>Merci pour votre contribution !</h2>
      <p>Vos réponses ont bien été enregistrées.</p>
      <p class="muted">Référence : <code>${esc(state.responseId.slice(0, 8).toUpperCase())}</code></p>
      <p class="muted small">Pour toute question : <a href="mailto:${esc(META.contactEmail)}">${esc(META.contactEmail)}</a></p></div>`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* -------------------------------------------------------- brouillon */
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
        const s = $("#saveState"); s.textContent = "Brouillon enregistré · " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      } catch (e) { }
    }, 400);
  }
  function loadDraft() {
    try { const raw = localStorage.getItem(STORE_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }

  /* ---------------------------------------------------------- init */
  function init() {
    renderChrome();
    const draft = loadDraft();
    if (draft && (Object.keys(draft.general || {}).length || draft.consent)) {
      const b = $("#draftBanner");
      b.hidden = false;
      $("#btnResume").addEventListener("click", () => {
        state = Object.assign(freshState(), draft);
        steps = buildSteps();
        state.current = Math.min(state.current, steps.length - 1);
        state.maxReached = Math.min(state.maxReached, steps.length - 1);
        b.hidden = true; renderStep();
      });
      $("#btnRestart").addEventListener("click", () => {
        try { localStorage.removeItem(STORE_KEY); } catch (e) { }
        b.hidden = true; state = freshState(); steps = buildSteps(); renderStep();
      });
    }
    steps = buildSteps();
    renderStep();

    const form = $("#form");
    form.addEventListener("input", e => { if (e.target.matches('input[type="text"],input[type="email"],input[type="tel"],input[type="number"],textarea')) onFieldChange(e); });
    form.addEventListener("change", e => { if (!e.target.matches('input[type="file"]')) onFieldChange(e); });
    form.addEventListener("submit", e => e.preventDefault());
    form.addEventListener("click", e => {
      const b = e.target.closest("[data-step]"); if (b) { goTo(Number(b.dataset.step)); return; }
      if (e.target.id === "btnSubmit") submit();
      if (e.target.id === "btnDownload") downloadJson();
    });
    $("#btnNext").addEventListener("click", next);
    $("#btnPrev").addEventListener("click", () => goTo(state.current - 1));
    $("#stepList").addEventListener("click", e => { const b = e.target.closest("[data-step]"); if (b && !b.disabled) goTo(Number(b.dataset.step)); });
    $("#navToggle").addEventListener("click", () => document.body.classList.toggle("nav-open"));
    // Empêche la touche Entrée de soumettre
    form.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.tagName === "INPUT" && e.target.type !== "checkbox" && e.target.type !== "radio") e.preventDefault(); });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
