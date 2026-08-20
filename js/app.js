"use strict";

/* ---------- stats ---------- */
function checksOf(h){ return state.checkins[h.id] || {}; }
function isDone(h, key){ return !!checksOf(h)[key]; }
function currentStreak(h){
  const set = checksOf(h);
  let d = today();
  if(!set[keyOf(d)]) d = addDays(d,-1);
  let s = 0;
  while(set[keyOf(d)]){ s++; d = addDays(d,-1); }
  return s;
}
function bestStreak(h){
  const keys = Object.keys(checksOf(h)).sort();
  let best=0, run=0, prev=null;
  for(const k of keys){
    const d = new Date(k + "T00:00:00");
    run = prev && (d - prev) === 86400000 ? run + 1 : 1;
    if(run > best) best = run;
    prev = d;
  }
  return best;
}
function weekKey(d){
  const x = new Date(d); const dow = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dow); x.setHours(0,0,0,0);
  return x;
}
function refreshStats(){
  const tk = keyOf(today());

  let cur = 0, best = 0, week = 0, total = 0;
  const wkStart = weekKey(today());
  for(const h of state.habits){
    cur = Math.max(cur, currentStreak(h));
    best = Math.max(best, bestStreak(h));
    const set = checksOf(h);
    for(const k in set){
      total++;
      if(k >= keyOf(wkStart) && k <= tk) week++;
    }
  }
  $("#curStreak").textContent = cur;
  $("#bestStreak").textContent = best;
  $("#weekChecks").textContent = week;
  $("#totalChecks").textContent = total;
  $("#habitCount").textContent = state.habits.length + " active";
}

/* ---------- cells ---------- */
function last14(){
  const arr = [];
  for(let i = 13; i >= 0; i--) arr.push(addDays(today(), -i));
  return arr;
}

function cellsHTML(h){
  const tk = keyOf(today());
  return last14().map(d => {
    const k = keyOf(d);
    const cls = ["c"];
    if(isDone(h,k)) cls.push("done");
    if(k === tk) cls.push("today");
    if(k > tk) cls.push("future");
    return '<button class="' + cls.join(" ") + '" data-id="' + h.id + '" data-key="' + k +
      '" title="' + d.toDateString() + '" aria-label="' + d.toDateString() + '">' + d.getDate() + "</button>";
  }).join("");
}

function headHTML(){
  const tk = keyOf(today());
  return last14().map((d,i) => {
    const k = keyOf(d);
    return '<div class="h' + (k === tk ? " today" : "") + '"><span class="wd">' + MONO[(d.getDay()+6)%7] +
      '</span><span class="dn">' + d.getDate() + "</span></div>";
  }).join("");
}

/* ---------- render ---------- */
function iconHTML(h){
  const raw = (h.icon || "").trim();
  if(raw.indexOf("http") === 0) return '<img class="icon-img" src="' + esc(raw) + '" alt="" loading="lazy">';
  if(raw) return esc(raw);
  return esc((h.name || "?").trim().charAt(0).toUpperCase() || "?");
}

function render(){
  const ledger = $("#ledger");
  if(!state.habits.length){
    ledger.innerHTML =
      '<div class="empty"><span class="big">A blank page.</span>' +
      '<span class="tip">Click "New habit" to open the ledger.</span></div>';
  } else {
    ledger.innerHTML =
      '<div class="cells-head">' + headHTML() + "</div>" +
      state.habits.map((h,i) => {
        const cs = currentStreak(h);
        const wkStart = weekKey(today());
        const tk = keyOf(today());
        const set = checksOf(h);
        let weekDone = 0, lastKey = "";
        for(const k in set){
          if(k >= keyOf(wkStart) && k <= tk) weekDone++;
          if(k > lastKey) lastKey = k;
        }
        return '<div class="habit" data-id="' + h.id + '" style="--i:' + i + ';--c:' + h.color + '">' +
          '<div class="habit-top">' +
            '<span class="idx">' + pad(i+1) + "</span>" +
            '<span class="monogram">' + iconHTML(h) + "</span>" +
            '<a class="name" href="#/habit/' + h.id + '" title="Open full progress">' + esc(h.name) + "</a>" +
            '<span class="chip streak' + (cs>0?" on":"") + '">' + cs + " day" + (cs===1?"":"s") + "</span>" +
            '<span class="chip week' + (weekDone>=h.goal?" full":"") + '">' + weekDone + "/" + h.goal + " wk</span>" +
            (lastKey ? '<span class="chip last" title="Last checked ' + shortDate(lastKey) + '">LAST ' + shortDate(lastKey) + "</span>" : "") +
            '<a class="chip view" href="#/habit/' + h.id + '" title="Open full progress">VIEW &rarr;</a>' +
            '<button class="del" data-del aria-label="Delete ' + esc(h.name) + '">&times;</button>' +
          "</div>" +
          '<div class="cells">' + cellsHTML(h) + "</div>" +
        "</div>";
      }).join("");
  }
  refreshStats();
  renderHeat();
  renderMoney();
}

/* ---------- toast ---------- */
let toastTimer = null;
function toast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

/* ---------- interactions ---------- */
document.getElementById("ledger").addEventListener("click", e => {
  const cell = e.target.closest(".c");
  if(cell){
    if(cell.classList.contains("future")) return;
    const id = cell.dataset.id, key = cell.dataset.key;
    const h = state.habits.find(x => x.id === id);
    if(!h) return;
    const set = state.checkins[id] || (state.checkins[id] = {});
    if(set[key]){ delete set[key]; cell.classList.remove("done"); toast("UNTICKED · " + fullDate(key)); }
    else { set[key] = true; cell.classList.add("done","stamped"); setTimeout(()=>cell.classList.remove("stamped"),520); toast("TICKED · " + fullDate(key)); }
    save(); refreshStats();
    return;
  }
  const del = e.target.closest("[data-del]");
  if(del){
    const id = del.closest(".habit").dataset.id;
    const h = state.habits.find(x => x.id === id);
    if(!h) return;
    if(confirm('Delete "' + h.name + '" and its history?')){
      state.habits = state.habits.filter(x => x.id !== id);
      delete state.checkins[id];
      save(); render();
    }
    return;
  }
});

document.getElementById("addBtn").addEventListener("click", () => {
  const panel = $("#addPanel");
  const open = panel.classList.toggle("open");
  if(open) setTimeout(()=>$("#nameIn").focus(), 60);
  document.getElementById("addBtn").textContent = open ? "Close" : "+ New habit";
});

document.getElementById("addForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("#nameIn").value.trim();
  if(!name) return;
  const icon = $("#emojiIn").value.trim();
  const goal = Math.min(7, Math.max(1, parseInt($("#goalIn").value,10) || 7));
  const id = "h" + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  state.habits.push({id, name, icon, goal, color: PALETTE[state.habits.length % PALETTE.length], createdKey: keyOf(today())});
  save(); render();
  e.target.reset();
  $("#goalIn").value = 7;
  $("#addPanel").classList.remove("open");
  document.getElementById("addBtn").textContent = "+ New habit";
  $("#nameIn").blur();
});

/* ---------- heatmap ---------- */
function renderHeat(){
  const days = [];
  for(let i = 111; i >= 0; i--) days.push(addDays(today(), -i));
  const out = days.map(d => {
    const k = keyOf(d);
    let count = 0;
    for(const h of state.habits) if(isDone(h,k)) count++;
    const lvl = count === 0 ? 0 : Math.min(4, count);
    return '<div class="cellx l' + lvl + '" title="' + d.toDateString() + " · " + count +
      (count === 1 ? " check" : " checks") + '"></div>';
  }).join("");
  $("#heat").innerHTML = out;
}

/* ---------- header ---------- */
function renderHeader(){
  const d = today();
  const nextYear = new Date(d.getFullYear() + 1, 0, 1);
  const daysLeft = Math.round((nextYear - d) / 86400000);
  $("#dateMain").textContent = d.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });
  $("#dateSub").textContent = "WEEK " + (Math.floor((d - new Date(d.getFullYear(),0,1)) / 86400000 / 7) + 1) + " · DAY " + (Math.floor((d - new Date(d.getFullYear(),0,1)) / 86400000) + 1) + " · " + daysLeft + " DAY" + (daysLeft === 1 ? "" : "S") + " TO " + nextYear.getFullYear();
  $("#navDate").textContent = d.toLocaleDateString("en-US", { weekday:"short", day:"2-digit", month:"short" }).toUpperCase();
  const h = new Date().getHours();
  const g = h < 5 ? "Up late, eh?" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 21 ? "Good evening" : "Winding down";
  $("#greeting").textContent = g + (window.UserName ? ", " + window.UserName : "");
}

/* ---------- export / import ---------- */
document.getElementById("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type:"application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "daily-ledger-backup-" + keyOf(today()) + ".json";
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
});
document.getElementById("importBtn").addEventListener("click", () => document.getElementById("importFile").click());
document.getElementById("importFile").addEventListener("change", e => {
  const f = e.target.files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = () => {
    try{
      const s = JSON.parse(r.result);
      if(!Array.isArray(s.habits) || !s.checkins) throw 0;
      state = s;
      state.habits.forEach((h,i) => { h.color = h.color || PALETTE[i % PALETTE.length]; h.createdKey = h.createdKey || keyOf(today()); });
      state.money = (state.money && typeof state.money === "object") ? state.money : {};
      save(); render();
    }catch(err){
      alert("That file does not look like a Daily Ledger backup.");
    }
  };
  r.readAsText(f);
  e.target.value = "";
});
document.getElementById("clearBtn").addEventListener("click", () => {
  if(confirm("Erase every habit and all history? This cannot be undone.")){
    state = defaultState();
    save(); render();
  }
});

/* ---------- habit detail page ---------- */
function shortDate(key){ const d = new Date(key + "T00:00:00"); return d.toLocaleDateString("en-US",{ day:"2-digit", month:"short" }).toUpperCase(); }
function fullDate(key){ const d = new Date(key + "T00:00:00"); return d.toLocaleDateString("en-US",{ weekday:"short", month:"short", day:"numeric", year:"numeric" }); }
function habitStats(h){
  const set = checksOf(h);
  const tk = keyOf(today());
  const created = new Date((h.createdKey || tk) + "T00:00:00");
  const daysSince = Math.max(1, Math.floor((today() - created) / 86400000) + 1);
  let total = 0;
  for(const k in set) total++;
  const rate = Math.min(100, Math.round(total / daysSince * 100));
  return { cur: currentStreak(h), best: bestStreak(h), total, rate, daysSince };
}

function yearHeatHTML(h){
  const tk = today();
  const start = addDays(weekKey(tk), -51 * 7);
  let html = "";
  for(let w = 0; w < 52; w++){
    for(let r = 0; r < 7; r++){
      const d = addDays(start, w * 7 + r);
      const k = keyOf(d);
      const done = isDone(h, k);
      const cls = ["yh"];
      if(done) cls.push("on");
      if(k === keyOf(tk)) cls.push("today");
      html += '<span class="' + cls.join(" ") + '" title="' + d.toDateString() + (done ? " ✓" : "") + '"></span>';
    }
  }
  return html;
}

function weekBarsHTML(h){
  const tk = today();
  const monday = weekKey(tk);
  let html = "";
  for(let w = 11; w >= 0; w--){
    const ws = addDays(monday, -w * 7);
    let c = 0;
    for(let r = 0; r < 7; r++) if(isDone(h, keyOf(addDays(ws, r)))) c++;
    const hh = c === 0 ? 3 : Math.max(8, Math.round(c / h.goal * 100));
    const lbl = ws.toLocaleDateString("en-US", { month:"short", day:"numeric" });
    html += '<div class="wb' + (c === 0 ? " zero" : "") + '" style="height:' + hh + '%" title="' +
      lbl + " · " + c + "/" + h.goal + '"><span class="tip">' + c + "/" + h.goal + "</span></div>";
  }
  return html;
}

function checkLogHTML(h){
  const keys = Object.keys(checksOf(h)).sort().reverse();
  if(!keys.length) return '<div class="log-empty">No check-ins recorded yet.</div>';
  return keys.map(k =>
    '<div class="log-item"><span class="log-date">' + fullDate(k) +
    '</span><span class="log-dot"></span></div>'
  ).join("");
}

function renderHabitDetail(id){
  const h = state.habits.find(x => x.id === id);
  const detail = document.getElementById("viewDetail");
  if(!h){ location.hash = ""; return; }
  const s = habitStats(h);
  const icon = iconHTML(h);
  detail.innerHTML =
    '<section class="detail">' +
      '<div class="d-back"><a href="#" class="btn-ghost">&larr; Back to dashboard</a></div>' +
      '<div class="d-head">' +
        '<div class="d-title" style="--c:' + h.color + '">' +
          '<span class="monogram">' + icon + "</span>" +
          '<span class="d-name" id="dName">' + esc(h.name) + "</span>" +
        "</div>" +
        '<div class="d-actions">' +
          '<button class="btn-ghost" id="dRename">Rename</button>' +
          '<button class="btn-ghost" id="dDel">Delete</button>' +
        "</div>" +
      "</div>" +
      '<div class="d-stats">' +
        '<div class="d-stat"><span class="v hot">' + s.cur + "</span><span class=\"k\">Current streak</span></div>" +
        '<div class="d-stat"><span class="v">' + s.best + "</span><span class=\"k\">Best streak</span></div>" +
        '<div class="d-stat"><span class="v">' + s.total + "</span><span class=\"k\">Total checks</span></div>" +
        '<div class="d-stat"><span class="v">' + s.rate + '%</span><span class="k">Completion rate</span></div>' +
      "</div>" +
      '<div class="d-card">' +
        "<h3>Goal · days per week</h3>" +
        '<div class="goalrow">' +
          '<div class="goal-stepper">' +
            '<button data-goal="-1" aria-label="Decrease goal">&minus;</button>' +
            '<span class="gval">' + h.goal + "</span>" +
            '<button data-goal="1" aria-label="Increase goal">+</button>' +
          "</div>" +
          '<span class="chart-label">' + s.total + " checks over " + s.daysSince + " day" + (s.daysSince > 1 ? "s" : "") + "</span>" +
        "</div>" +
      "</div>" +
      '<div class="d-card">' +
        "<h3>Checks · last 12 weeks</h3>" +
        '<div class="weekbars">' + weekBarsHTML(h) + "</div>" +
      "</div>" +
      '<div class="d-card" style="--c:' + h.color + '">' +
        "<h3>History · last 52 weeks</h3>" +
        '<div class="yearheat">' + yearHeatHTML(h) + "</div>" +
      "</div>" +
      '<div class="d-card" style="--c:' + h.color + '">' +
        "<h3>Check-in log · " + s.total + " date" + (s.total === 1 ? "" : "s") + "</h3>" +
        '<div class="checklog">' + checkLogHTML(h) + "</div>" +
      "</div>" +
    "</section>";

  document.getElementById("dDel").addEventListener("click", () => {
    if(confirm('Delete "' + h.name + '" and its history?')){
      state.habits = state.habits.filter(x => x.id !== id);
      delete state.checkins[id];
      save(); location.hash = "";
    }
  });
  document.getElementById("dRename").addEventListener("click", () => {
    const nameEl = document.getElementById("dName");
    const input = document.createElement("input");
    input.className = "name-input";
    input.value = h.name;
    input.style.maxWidth = "min(60vw,360px)";
    nameEl.replaceWith(input);
    input.focus(); input.select();
    const commit = () => {
      if(input.value.trim()){ h.name = input.value.trim(); save(); }
      renderHabitDetail(id);
    };
    input.addEventListener("keydown", e2 => {
      if(e2.key === "Enter") commit();
      if(e2.key === "Escape") renderHabitDetail(id);
    });
    input.addEventListener("blur", commit);
  });
  document.querySelectorAll("[data-goal]").forEach(b => {
    b.addEventListener("click", () => {
      h.goal = Math.min(7, Math.max(1, h.goal + parseInt(b.dataset.goal, 10)));
      save(); renderHabitDetail(id);
    });
  });
  window.scrollTo(0, 0);
}

/* ---------- router ---------- */
function currentHabitId(){
  const m = location.hash.match(/^#\/habit\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}
function route(){
  const id = currentHabitId();
  const dash = document.getElementById("viewDash");
  const detail = document.getElementById("viewDetail");
  if(id && state.habits.find(h => h.id === id)){
    dash.hidden = true;
    detail.hidden = false;
    renderHabitDetail(id);
  } else if(location.hash === "#/money"){
    dash.hidden = true;
    detail.hidden = false;
    renderMoneyDetail();
  } else {
    detail.hidden = true;
    dash.hidden = false;
    render();
  }
}
window.addEventListener("hashchange", route);

/* ---------- boot ---------- */
function startApp(){
  renderHeader();
  route();
  setTimeout(()=>{
    const p = $("#preloader");
    p.classList.add("done");
    setTimeout(()=>p.remove(), 750);
  }, 420);
}
if(window.UserName) startApp();
else window.addEventListener("ledger:ready", startApp);