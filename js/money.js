"use strict";
const RUPEE = "\u20B9";
let moneyEditing = null;
function fmt(n){ return RUPEE + (Math.round(n*100)/100).toLocaleString("en-IN", {maximumFractionDigits:2}); }
function formatDate(key){ const d = new Date(key + "T00:00:00"); return d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}); }

function renderMoney(){
  const tk = keyOf(today());
  let netToday = 0, earnT = 0, spendT = 0;
  for(const k in state.money){
    const e = Number(state.money[k].earn)||0, s = Number(state.money[k].spend)||0;
    earnT += e; spendT += s;
    if(k === tk) netToday = e - s;
  }
  $("#netToday").textContent = fmt(netToday);
  $("#netToday").className = "kpi-v" + (netToday>0?" pos":netToday<0?" neg":"");
  $("#earnTotal").textContent = fmt(earnT);
  $("#spendTotal").textContent = fmt(spendT);

  const line = $("#moneyEditLine");
  if(moneyEditing && moneyEditing !== tk){
    line.classList.add("on");
    line.textContent = "Editing " + formatDate(moneyEditing) + " · click a bar to pick another day";
  } else line.classList.remove("on");

  const days = [];
  for(let i = 13; i >= 0; i--) days.push(addDays(today(), -i));
  const vals = days.map(d => {
    const m = state.money[keyOf(d)];
    return m ? (Number(m.earn)||0) - (Number(m.spend)||0) : 0;
  });
  const max = Math.max(1, ...vals.map(Math.abs));
  $("#moneyChart").innerHTML = days.map((d,i) => {
    const k = keyOf(d);
    const v = vals[i];
    const h = v === 0 ? 4 : Math.max(4, Math.round(Math.abs(v)/max*100));
    const cls = v>0 ? "bar" : v<0 ? "bar neg" : "bar zero";
    const label = v === 0 ? "0" : (v>0?"+":"-") + RUPEE + Math.abs(v).toLocaleString("en-IN");
    return '<div class="' + cls + '" data-key="' + k + '" style="height:' + h + '%" title="' +
      d.toDateString() + " · " + label + '"><span class="btip">' + label + "</span></div>";
  }).join("");
}

function loadMoneyEdit(key){
  const m = state.money[key] || {};
  moneyEditing = key;
  $("#earnIn").value = m.earn != null ? m.earn : "";
  $("#spendIn").value = m.spend != null ? m.spend : "";
  renderMoney();
}

function renderMoneyDetail(){
  const detail = document.getElementById("viewDetail");
  const keys = Object.keys(state.money).sort().reverse();
  let earnT = 0, spendT = 0;
  const rows = keys.map(k => {
    const e = Number(state.money[k].earn) || 0, s = Number(state.money[k].spend) || 0;
    earnT += e; spendT += s;
    const net = e - s;
    return '<div class="money-row" data-key="' + k + '" title="Edit this day">' +
      '<span class="log-date">' + fullDate(k) + "</span>" +
      '<span class="m-earn">+' + fmt(e) + "</span>" +
      '<span class="m-spend">-' + fmt(s) + "</span>" +
      '<span class="m-net ' + (net > 0 ? "pos" : net < 0 ? "neg" : "") + '">' + fmt(net) + "</span>" +
    "</div>";
  }).join("");
  const netAll = earnT - spendT;
  detail.innerHTML =
    '<section class="detail">' +
      '<div class="d-back"><a href="#" class="btn-ghost">&larr; Back to dashboard</a></div>' +
      '<div class="d-head">' +
        '<div class="d-title" style="--c:var(--accent)">' +
          '<span class="monogram">' + RUPEE + "</span>" +
          '<span class="d-name">Funds ledger</span>' +
        "</div>" +
        '<div class="d-actions"><span class="chart-label">' + keys.length + " day" + (keys.length === 1 ? "" : "s") + " logged</span></div>" +
      "</div>" +
      '<div class="d-stats">' +
        '<div class="d-stat"><span class="v good">' + fmt(earnT) + '</span><span class="k">Earned all-time</span></div>' +
        '<div class="d-stat"><span class="v bad">' + fmt(spendT) + '</span><span class="k">Spent all-time</span></div>' +
        '<div class="d-stat"><span class="v ' + (netAll > 0 ? "good" : netAll < 0 ? "bad" : "") + '">' + fmt(netAll) + '</span><span class="k">Net all-time</span></div>' +
        '<div class="d-stat"><span class="v">' + keys.length + '</span><span class="k">Days logged</span></div>' +
      "</div>" +
      '<div class="d-card">' +
        "<h3>Money log · date wise</h3>" +
        '<div class="money-log">' + (keys.length ? rows : '<div class="log-empty">No entries yet.</div>') + "</div>" +
      "</div>" +
    "</section>";
  detail.querySelectorAll(".money-row").forEach(row => {
    row.addEventListener("click", () => {
      loadMoneyEdit(row.dataset.key);
      location.hash = "";
    });
  });
  window.scrollTo(0, 0);
}

document.getElementById("moneyForm").addEventListener("submit", e => {
  e.preventDefault();
  const key = moneyEditing || keyOf(today());
  const earn = parseFloat($("#earnIn").value) || 0;
  const spend = parseFloat($("#spendIn").value) || 0;
  if(earn || spend) state.money[key] = { earn, spend };
  else delete state.money[key];
  save(); moneyEditing = null; renderMoney();
  e.target.reset();
});

document.getElementById("moneyChart").addEventListener("click", e => {
  const bar = e.target.closest(".bar");
  if(!bar) return;
  loadMoneyEdit(bar.dataset.key);
  $("#earnIn").focus();
  $("#earnIn").scrollIntoView({ behavior:"smooth", block:"center" });
});