(function () {
  "use strict";

  const STORAGE_KEY = "grc-dashboard:risks:v1";
  const THEME_KEY = "grc-dashboard:theme";
  const seed = window.GRC_SEED;
  const today = parseDate(seed.asOf);

  const state = {
    risks: loadRisks(),
    riskSort: { key: "score", dir: "desc" },
    cellFilter: null, // { likelihood, impact }
    editingId: null,
  };

  // ---------- helpers ----------

  function parseDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }
  function fmtDate(d) {
    if (!d) return "—";
    if (typeof d === "string") d = parseDate(d);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
  }
  function addMonths(d, n) {
    const r = new Date(d);
    r.setUTCMonth(r.getUTCMonth() + n);
    return r;
  }
  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function $(sel) { return document.querySelector(sel); }
  function pct(x) { return Math.round(x * 100) + "%"; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function storageGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
  function storageSet(key, val) { try { localStorage.setItem(key, val); } catch { /* storage unavailable */ } }
  function storageDel(key) { try { localStorage.removeItem(key); } catch { /* storage unavailable */ } }

  function loadRisks() {
    const raw = storageGet(STORAGE_KEY);
    if (raw) {
      try { return JSON.parse(raw); } catch { /* fall through to seed */ }
    }
    return seed.risks.map((r) => ({ ...r }));
  }
  function saveRisks() { storageSet(STORAGE_KEY, JSON.stringify(state.risks)); }

  // ---------- domain rules ----------

  // Inherent risk score = likelihood x impact (1..25), banded into four levels.
  function riskLevel(score) {
    if (score >= 15) return { key: "critical", label: "Critical", tone: "critical" };
    if (score >= 10) return { key: "high", label: "High", tone: "serious" };
    if (score >= 5) return { key: "medium", label: "Medium", tone: "warning" };
    return { key: "low", label: "Low", tone: "good" };
  }
  const score = (r) => r.likelihood * r.impact;
  const isActive = (r) => r.status !== "closed";

  const FINDING_TONE = { low: "good", medium: "warning", high: "serious", critical: "critical" };
  const CONTROL_STATUS = {
    implemented: { label: "Implemented", tone: "good", weight: 1 },
    partial: { label: "Partial", tone: "warning", weight: 0.5 },
    missing: { label: "Not implemented", tone: "critical", weight: 0 },
  };
  const RISK_STATUS_TONE = { open: "critical", mitigating: "warning", accepted: "neutral", closed: "good" };

  function complianceScore(controls) {
    if (!controls.length) return 0;
    return controls.reduce((s, c) => s + CONTROL_STATUS[c.status].weight, 0) / controls.length;
  }

  function findingOpenAt(f, d) {
    return parseDate(f.opened) <= d && (!f.closed || parseDate(f.closed) > d);
  }
  function findingOverdueAt(f, d) {
    return findingOpenAt(f, d) && parseDate(f.due) < d;
  }

  function policyNextReview(p) { return addMonths(parseDate(p.lastReviewed), p.reviewCycleMonths); }

  function badge(tone, label) {
    return `<span class="badge"><span class="dot ${tone}" aria-hidden="true"></span>${esc(label)}</span>`;
  }

  // ---------- tooltip ----------

  const tip = $("#tooltip");
  function showTip(html, x, y) {
    tip.innerHTML = html;
    tip.hidden = false;
    const r = tip.getBoundingClientRect();
    let left = x + 14, top = y + 14;
    if (left + r.width > window.innerWidth - 8) left = x - r.width - 14;
    if (top + r.height > window.innerHeight - 8) top = y - r.height - 14;
    tip.style.left = Math.max(8, left) + "px";
    tip.style.top = Math.max(8, top) + "px";
  }
  function hideTip() { tip.hidden = true; }

  // ---------- overview ----------

  function renderKpis() {
    const active = state.risks.filter(isActive);
    const highPlus = active.filter((r) => score(r) >= 10);
    const critical = active.filter((r) => score(r) >= 15);
    const openFindings = seed.findings.filter((f) => findingOpenAt(f, today));
    const overdueFindings = openFindings.filter((f) => findingOverdueAt(f, today));
    const overduePolicies = seed.policies.filter((p) => policyNextReview(p) < today);
    const implemented = seed.controls.filter((c) => c.status === "implemented").length;
    const avgAttest = seed.policies.reduce((s, p) => s + p.attestation, 0) / seed.policies.length;

    const tiles = [
      { label: "Overall compliance", value: pct(complianceScore(seed.controls)), sub: `${implemented} of ${seed.controls.length} controls fully implemented` },
      { label: "High & critical risks", value: highPlus.length, sub: `${critical.length} critical · ${active.length} active risks in total` },
      { label: "Open audit findings", value: openFindings.length, sub: `${overdueFindings.length} past due date` },
      { label: "Policies overdue for review", value: overduePolicies.length, sub: `of ${seed.policies.length} · ${pct(avgAttest)} avg attestation` },
    ];
    $("#kpis").innerHTML = tiles.map((t) => `
      <div class="card kpi">
        <span class="label">${esc(t.label)}</span>
        <span class="value">${esc(t.value)}</span>
        <span class="sub">${esc(t.sub)}</span>
      </div>`).join("");
  }

  function renderFrameworkBars() {
    const el = $("#framework-bars");
    el.innerHTML = seed.frameworks.map((fw) => {
      const cs = seed.controls.filter((c) => c.framework === fw.id);
      const s = complianceScore(cs);
      const n = (k) => cs.filter((c) => c.status === k).length;
      return `
        <div class="hbar-row" data-fw="${esc(fw.id)}" tabindex="0">
          <span class="name" title="${esc(fw.name)}">${esc(fw.name)}</span>
          <div class="hbar-track" role="img" aria-label="${esc(fw.name)} ${pct(s)}"><div class="hbar-fill" style="width:${(s * 100).toFixed(1)}%"></div></div>
          <span class="pct">${pct(s)}</span>
          <span class="counts">${n("implemented")} implemented · ${n("partial")} partial · ${n("missing")} not implemented</span>
        </div>`;
    }).join("");

    el.querySelectorAll(".hbar-row").forEach((row) => {
      const fw = seed.frameworks.find((f) => f.id === row.dataset.fw);
      const cs = seed.controls.filter((c) => c.framework === fw.id);
      const gaps = cs.filter((c) => c.status !== "implemented");
      const html = `<strong>${esc(fw.name)}</strong>${gaps.length ? gaps.map((c) =>
        `<div class="row"><span class="dot ${CONTROL_STATUS[c.status].tone}"></span>${esc(c.id)} ${esc(c.name)}</div>`).join("") : "All controls implemented"}`;
      row.addEventListener("mousemove", (e) => showTip(html, e.clientX, e.clientY));
      row.addEventListener("mouseleave", hideTip);
      row.addEventListener("click", () => {
        $("#control-framework").value = fw.id;
        $("#control-status").value = "";
        renderControls();
        switchTab("compliance");
      });
      row.addEventListener("keydown", (e) => { if (e.key === "Enter") row.click(); });
    });
  }

  function renderHeatmap() {
    const active = state.risks.filter(isActive);
    const counts = {};
    let max = 0;
    for (const r of active) {
      const k = r.likelihood + "-" + r.impact;
      (counts[k] = counts[k] || []).push(r);
      max = Math.max(max, counts[k].length);
    }
    const level = (n) => (n === 0 ? 0 : Math.max(1, Math.ceil((n / Math.max(max, 1)) * 5)));

    let html = '<div class="heat" role="grid" aria-label="Risk heat map">';
    for (let impact = 5; impact >= 1; impact--) {
      html += `<div class="axis">${impact}</div>`;
      for (let lik = 1; lik <= 5; lik++) {
        const list = counts[lik + "-" + impact] || [];
        const lv = level(list.length);
        const zone = riskLevel(lik * impact);
        html += `<button class="cell lvl-${lv}${list.length ? "" : " empty"}" style="background:var(--seq-${lv})"
          data-l="${lik}" data-i="${impact}" aria-label="Likelihood ${lik}, impact ${impact}: ${list.length} risks, ${zone.label} zone"
          ${list.length ? "" : "tabindex=\"-1\""}>
          <span class="zone dot ${zone.tone}" aria-hidden="true"></span>${list.length || ""}</button>`;
      }
    }
    html += '<div></div>';
    for (let lik = 1; lik <= 5; lik++) html += `<div class="axis">${lik}</div>`;
    html += "</div>";
    html += `<div class="heat-foot"><span>Rows: impact ↑ · Columns: likelihood →</span>
      <span class="zones">${["low", "medium", "high", "critical"].map((k) => {
        const z = riskLevel({ low: 1, medium: 5, high: 10, critical: 15 }[k]);
        return `<span><span class="dot ${z.tone}"></span> ${z.label}</span>`;
      }).join("")}</span></div>`;
    $("#heatmap").innerHTML = html;

    $("#heatmap").querySelectorAll(".cell").forEach((cell) => {
      const l = +cell.dataset.l, i = +cell.dataset.i;
      const list = counts[l + "-" + i] || [];
      const z = riskLevel(l * i);
      const tipHtml = `<strong>L${l} × I${i} = ${l * i} (${z.label})</strong>${list.length
        ? list.map((r) => `<div>${esc(r.id)} · ${esc(r.title)}</div>`).join("")
        : "<div>No active risks</div>"}`;
      cell.addEventListener("mousemove", (e) => showTip(tipHtml, e.clientX, e.clientY));
      cell.addEventListener("mouseleave", hideTip);
      if (list.length) {
        cell.addEventListener("click", () => {
          hideTip();
          state.cellFilter = { likelihood: l, impact: i };
          $("#risk-status").value = "active";
          renderRisks();
          switchTab("risks");
        });
      }
    });
  }

  function renderTrend() {
    const months = [];
    for (let k = 11; k >= 0; k--) {
      // month end = first day of next month minus one day
      const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - k, 1));
      const end = new Date(start.getTime() - 86400000);
      months.push(end);
    }
    const series = [
      { key: "open", label: "Open", color: "var(--series-1)", values: months.map((d) => seed.findings.filter((f) => findingOpenAt(f, d)).length) },
      { key: "overdue", label: "Overdue", color: "var(--series-2)", values: months.map((d) => seed.findings.filter((f) => findingOverdueAt(f, d)).length) },
    ];

    $("#trend-legend").innerHTML = series.map((s) =>
      `<span class="key"><span class="swatch" style="background:${s.color}"></span>${s.label}</span>`).join("");

    const W = 600, H = 230, m = { t: 10, r: 64, b: 26, l: 30 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const maxV = Math.max(1, ...series.flatMap((s) => s.values));
    const step = maxV <= 5 ? 1 : maxV <= 10 ? 2 : 5;
    const yMax = Math.ceil(maxV / step) * step;
    const x = (i) => m.l + (i / (months.length - 1)) * iw;
    const y = (v) => m.t + ih - (v / yMax) * ih;
    const mon = (d) => d.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" });

    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Open and overdue audit findings by month">`;
    for (let v = 0; v <= yMax; v += step) {
      svg += `<line class="gridline" x1="${m.l}" x2="${m.l + iw}" y1="${y(v)}" y2="${y(v)}"/>`;
      svg += `<text class="tick" x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
    }
    months.forEach((d, i) => {
      if (i % 2 === 1 || i === months.length - 1) {
        svg += `<text class="tick" x="${x(i)}" y="${H - 6}" text-anchor="middle">${mon(d)}</text>`;
      }
    });
    for (const s of series) {
      const dAttr = s.values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
      svg += `<path class="line" d="${dAttr}" stroke="${s.color}"/>`;
    }
    // direct end labels, nudged apart if they collide
    const ends = series.map((s) => ({ s, yy: y(s.values[s.values.length - 1]) }));
    if (Math.abs(ends[0].yy - ends[1].yy) < 14) {
      const mid = (ends[0].yy + ends[1].yy) / 2;
      const [hi, lo] = ends[0].yy <= ends[1].yy ? [ends[0], ends[1]] : [ends[1], ends[0]];
      hi.yy = mid - 7; lo.yy = mid + 7;
    }
    for (const e of ends) {
      svg += `<text class="endlabel" x="${x(months.length - 1) + 8}" y="${e.yy + 4}">${e.s.label} ${e.s.values[e.s.values.length - 1]}</text>`;
    }
    svg += `<line class="crosshair" id="trend-x" y1="${m.t}" y2="${m.t + ih}" visibility="hidden"/>`;
    svg += `<g id="trend-dots" visibility="hidden">${series.map((s) =>
      `<circle r="4.5" fill="${s.color}" stroke="var(--surface-1)" stroke-width="2"/>`).join("")}</g>`;
    svg += `<rect id="trend-hit" x="${m.l}" y="${m.t}" width="${iw}" height="${ih}" fill="transparent"/>`;
    svg += "</svg>";

    const box = $("#trend");
    box.innerHTML = svg;
    const svgEl = box.querySelector("svg");
    const hit = box.querySelector("#trend-hit");
    const cross = box.querySelector("#trend-x");
    const dots = box.querySelector("#trend-dots");

    hit.addEventListener("mousemove", (e) => {
      const pt = svgEl.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(svgEl.getScreenCTM().inverse());
      const i = Math.max(0, Math.min(months.length - 1, Math.round(((p.x - m.l) / iw) * (months.length - 1))));
      cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i));
      cross.setAttribute("visibility", "visible");
      dots.setAttribute("visibility", "visible");
      [...dots.children].forEach((c, k) => { c.setAttribute("cx", x(i)); c.setAttribute("cy", y(series[k].values[i])); });
      const label = months[i].toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
      showTip(`<strong>End of ${label}</strong>${series.map((s) =>
        `<div class="row"><span class="dot" style="background:${s.color}"></span>${s.label}: ${s.values[i]}</div>`).join("")}`, e.clientX, e.clientY);
    });
    hit.addEventListener("mouseleave", () => {
      cross.setAttribute("visibility", "hidden");
      dots.setAttribute("visibility", "hidden");
      hideTip();
    });
  }

  function renderTopRisks() {
    const top = state.risks.filter(isActive).sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id)).slice(0, 6);
    $("#top-risks").innerHTML = top.map((r) => {
      const lv = riskLevel(score(r));
      return `<li>
        <span class="score">${score(r)}</span>
        <div><div class="title">${esc(r.title)}</div><div class="meta">${esc(r.id)} · ${esc(r.owner)} · ${esc(cap(r.status))}</div></div>
        ${badge(lv.tone, lv.label)}
      </li>`;
    }).join("") || '<li class="muted">No active risks.</li>';
  }

  // ---------- risk register ----------

  function filteredRisks() {
    const q = $("#risk-search").value.trim().toLowerCase();
    const cat = $("#risk-category").value;
    const st = $("#risk-status").value;
    const cf = state.cellFilter;
    return state.risks.filter((r) => {
      if (q && !`${r.id} ${r.title} ${r.owner} ${r.category}`.toLowerCase().includes(q)) return false;
      if (cat && r.category !== cat) return false;
      if (st === "active" && !isActive(r)) return false;
      if (st && st !== "active" && r.status !== st) return false;
      if (cf && (r.likelihood !== cf.likelihood || r.impact !== cf.impact)) return false;
      return true;
    });
  }

  function sortRisks(list) {
    const { key, dir } = state.riskSort;
    const val = (r) => (key === "score" ? score(r) : r[key]);
    const sgn = dir === "asc" ? 1 : -1;
    return list.slice().sort((a, b) => {
      const va = val(a), vb = val(b);
      const c = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
      return c * sgn || a.id.localeCompare(b.id);
    });
  }

  function renderCategoryOptions() {
    const cats = [...new Set(state.risks.map((r) => r.category))].sort();
    const sel = $("#risk-category");
    const cur = sel.value;
    sel.innerHTML = '<option value="">All categories</option>' + cats.map((c) => `<option>${esc(c)}</option>`).join("");
    sel.value = cats.includes(cur) ? cur : "";
    $("#category-list").innerHTML = cats.map((c) => `<option value="${esc(c)}">`).join("");
  }

  function renderRisks() {
    const rows = sortRisks(filteredRisks());
    const tbody = $("#risk-table tbody");
    tbody.innerHTML = rows.map((r) => {
      const s = score(r);
      const lv = riskLevel(s);
      const overdue = isActive(r) && parseDate(r.due) < today;
      return `<tr data-id="${esc(r.id)}">
        <td class="nowrap">${esc(r.id)}</td>
        <td>${esc(r.title)}</td>
        <td>${esc(r.category)}</td>
        <td>${esc(r.owner)}</td>
        <td class="num">${r.likelihood}</td>
        <td class="num">${r.impact}</td>
        <td class="num"><span class="badge"><span class="dot ${lv.tone}" aria-hidden="true"></span>${s} ${lv.label}</span></td>
        <td><select data-action="status" aria-label="Status for ${esc(r.id)}">
          ${["open", "mitigating", "accepted", "closed"].map((k) => `<option value="${k}"${k === r.status ? " selected" : ""}>${cap(k)}</option>`).join("")}
        </select></td>
        <td class="nowrap${overdue ? " overdue" : ""}">${fmtDate(r.due)}${overdue ? " · overdue" : ""}</td>
        <td class="nowrap"><button class="btn ghost small" data-action="edit" type="button">Edit</button></td>
      </tr>`;
    }).join("");
    $("#risk-empty").hidden = rows.length > 0;

    document.querySelectorAll("#risk-table th[data-sort]").forEach((th) => {
      th.setAttribute("aria-sort", th.dataset.sort === state.riskSort.key ? (state.riskSort.dir === "asc" ? "ascending" : "descending") : "none");
    });

    const chip = $("#cell-filter");
    if (state.cellFilter) {
      chip.hidden = false;
      chip.innerHTML = `Likelihood ${state.cellFilter.likelihood} × Impact ${state.cellFilter.impact} <button type="button" aria-label="Clear heat map filter">✕</button>`;
      chip.querySelector("button").onclick = () => { state.cellFilter = null; renderRisks(); };
    } else {
      chip.hidden = true;
    }
  }

  function refreshRiskViews() {
    saveRisks();
    renderCategoryOptions();
    renderRisks();
    renderKpis();
    renderHeatmap();
    renderTopRisks();
  }

  function nextRiskId() {
    const n = state.risks.reduce((mx, r) => Math.max(mx, parseInt(r.id.replace(/\D/g, ""), 10) || 0), 0) + 1;
    return "R-" + String(n).padStart(3, "0");
  }

  function openRiskDialog(risk) {
    const form = $("#risk-form");
    state.editingId = risk ? risk.id : null;
    $("#risk-dialog-title").textContent = risk ? `Edit ${risk.id}` : "Add risk";
    const r = risk || { title: "", category: "", owner: "", likelihood: 3, impact: 3, status: "open", due: "" };
    for (const k of ["title", "category", "owner", "likelihood", "impact", "status", "due"]) form.elements[k].value = r[k];
    $("#risk-dialog").showModal();
  }

  function exportRisksCsv() {
    const cols = ["id", "title", "category", "owner", "likelihood", "impact", "score", "level", "status", "due"];
    const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [cols.join(",")].concat(sortRisks(filteredRisks()).map((r) =>
      [r.id, r.title, r.category, r.owner, r.likelihood, r.impact, score(r), riskLevel(score(r)).label, r.status, r.due].map(q).join(",")));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `risk-register-${seed.asOf}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------- compliance, findings, policies ----------

  function renderControls() {
    const fw = $("#control-framework").value;
    const st = $("#control-status").value;
    const fwName = Object.fromEntries(seed.frameworks.map((f) => [f.id, f.name]));
    const rows = seed.controls.filter((c) => (!fw || c.framework === fw) && (!st || c.status === st));
    $("#control-table tbody").innerHTML = rows.map((c) => {
      const s = CONTROL_STATUS[c.status];
      return `<tr>
        <td class="nowrap">${esc(c.id)}</td>
        <td class="nowrap">${esc(fwName[c.framework])}</td>
        <td>${esc(c.name)}</td>
        <td>${esc(c.owner)}</td>
        <td>${badge(s.tone, s.label)}</td>
        <td class="nowrap">${fmtDate(c.lastTested)}</td>
      </tr>`;
    }).join("") || '<tr><td colspan="6" class="muted">No controls match.</td></tr>';
  }

  function renderFindings() {
    const mode = $("#finding-state").value;
    const rows = seed.findings.filter((f) => {
      const open = findingOpenAt(f, today);
      if (mode === "open") return open;
      if (mode === "overdue") return findingOverdueAt(f, today);
      if (mode === "closed") return !open;
      return true;
    }).sort((a, b) => b.opened.localeCompare(a.opened));
    $("#finding-table tbody").innerHTML = rows.map((f) => {
      const open = findingOpenAt(f, today);
      const overdue = findingOverdueAt(f, today);
      const stateCell = open
        ? (overdue ? `<span class="overdue">Open · overdue</span>` : "Open")
        : `Closed ${fmtDate(f.closed)}`;
      return `<tr>
        <td class="nowrap">${esc(f.id)}</td>
        <td>${esc(f.title)}</td>
        <td>${esc(f.source)}</td>
        <td>${badge(FINDING_TONE[f.severity], cap(f.severity))}</td>
        <td class="nowrap">${fmtDate(f.opened)}</td>
        <td class="nowrap">${fmtDate(f.due)}</td>
        <td class="nowrap">${stateCell}</td>
      </tr>`;
    }).join("") || '<tr><td colspan="7" class="muted">No findings match.</td></tr>';
  }

  function renderPolicies() {
    $("#policy-table tbody").innerHTML = seed.policies.map((p) => {
      const next = policyNextReview(p);
      const overdue = next < today;
      const soon = !overdue && next < addMonths(today, 1);
      const reviewCell = overdue
        ? `<span class="overdue">${fmtDate(next)} · overdue</span>`
        : soon ? `${fmtDate(next)} · due soon` : fmtDate(next);
      return `<tr>
        <td class="nowrap">${esc(p.id)}</td>
        <td>${esc(p.name)}</td>
        <td>${esc(p.owner)}</td>
        <td>v${esc(p.version)}</td>
        <td class="nowrap">${fmtDate(p.lastReviewed)}</td>
        <td class="nowrap">${reviewCell}</td>
        <td><div class="meter"><div class="track"><div class="fill" style="width:${(p.attestation * 100).toFixed(0)}%"></div></div><span class="v">${pct(p.attestation)}</span></div></td>
      </tr>`;
    }).join("");
  }

  // ---------- tabs & theme ----------

  function switchTab(name) {
    document.querySelectorAll(".tabs [role=tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === name)));
    document.querySelectorAll(".tab-panel").forEach((p) => { p.hidden = p.id !== "tab-" + name; });
    if (location.hash !== "#" + name) history.replaceState(null, "", "#" + name);
    hideTip();
  }

  function applyTheme(t) {
    if (t) document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
  }
  function currentTheme() {
    return document.documentElement.dataset.theme ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }

  // ---------- wiring ----------

  function init() {
    applyTheme(storageGet(THEME_KEY));
    $("#theme-toggle").addEventListener("click", () => {
      const t = currentTheme() === "dark" ? "light" : "dark";
      applyTheme(t);
      storageSet(THEME_KEY, t);
    });

    $("#as-of").textContent = "Data as of " + fmtDate(seed.asOf);

    document.querySelectorAll(".tabs [role=tab]").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));
    const initial = location.hash.slice(1);
    switchTab(document.getElementById("tab-" + initial) ? initial : "overview");

    // risk register
    ["#risk-search", "#risk-category", "#risk-status"].forEach((s) => $(s).addEventListener("input", renderRisks));
    document.querySelectorAll("#risk-table th[data-sort]").forEach((th) => th.addEventListener("click", () => {
      const key = th.dataset.sort;
      state.riskSort = state.riskSort.key === key
        ? { key, dir: state.riskSort.dir === "asc" ? "desc" : "asc" }
        : { key, dir: ["score", "likelihood", "impact"].includes(key) ? "desc" : "asc" };
      renderRisks();
    }));
    $("#risk-table tbody").addEventListener("change", (e) => {
      if (e.target.dataset.action !== "status") return;
      const r = state.risks.find((x) => x.id === e.target.closest("tr").dataset.id);
      r.status = e.target.value;
      refreshRiskViews();
    });
    $("#risk-table tbody").addEventListener("click", (e) => {
      if (e.target.dataset.action !== "edit") return;
      openRiskDialog(state.risks.find((x) => x.id === e.target.closest("tr").dataset.id));
    });
    $("#risk-add").addEventListener("click", () => openRiskDialog(null));
    $("#risk-export").addEventListener("click", exportRisksCsv);
    $("#risk-reset").addEventListener("click", () => {
      if (!confirm("Discard your changes and restore the sample risk register?")) return;
      storageDel(STORAGE_KEY);
      state.risks = seed.risks.map((r) => ({ ...r }));
      state.cellFilter = null;
      refreshRiskViews();
    });
    $("#risk-dialog").addEventListener("close", () => {
      if ($("#risk-dialog").returnValue !== "save") return;
      const f = $("#risk-form").elements;
      const clamp = (v) => Math.min(5, Math.max(1, Math.round(Number(v)) || 1));
      const data = {
        title: f.title.value.trim(),
        category: f.category.value.trim(),
        owner: f.owner.value.trim(),
        likelihood: clamp(f.likelihood.value),
        impact: clamp(f.impact.value),
        status: f.status.value,
        due: f.due.value,
      };
      if (state.editingId) Object.assign(state.risks.find((r) => r.id === state.editingId), data);
      else state.risks.push({ id: nextRiskId(), ...data });
      refreshRiskViews();
    });

    // compliance
    $("#control-framework").innerHTML += seed.frameworks.map((f) => `<option value="${esc(f.id)}">${esc(f.name)}</option>`).join("");
    ["#control-framework", "#control-status"].forEach((s) => $(s).addEventListener("input", renderControls));
    $("#finding-state").addEventListener("input", renderFindings);

    renderCategoryOptions();
    renderKpis();
    renderFrameworkBars();
    renderHeatmap();
    renderTrend();
    renderTopRisks();
    renderRisks();
    renderControls();
    renderFindings();
    renderPolicies();
  }

  init();
})();
