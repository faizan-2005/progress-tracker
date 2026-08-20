"use strict";
const KEY = "daily-ledger-v1";
const PALETTE = ["#e04a2f","#1f6f5c","#2f5fa8","#8a5a2b","#6b3fa0","#c25b1f","#9c2f4f","#3f7f8c"];
const MONO = ["M","T","W","T","F","S","S"];

const ICONS = {
  "h-yt": "https://api.iconify.design/simple-icons/youtube.svg?color=%23ffffff",
  "h-exercise": "https://api.iconify.design/mdi/dumbbell.svg?color=%23ffffff",
  "h-nofap": "https://api.iconify.design/mdi/block-helper.svg?color=%23ffffff",
  "h-read": "https://api.iconify.design/mdi/book-open-page-variant.svg?color=%23ffffff"
};

const $ = s => document.querySelector(s);
const pad = n => String(n).padStart(2,"0");
const keyOf = d => d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate());

function today(){ const d = new Date(); d.setHours(0,0,0,0); return d; }
function addDays(d,n){ const x = new Date(d); x.setDate(x.getDate()+n); return x; }

function defaultState(){
  const k = keyOf(today());
  return {
    habits:[
      {id:"h-yt", name:"YouTube video", icon:ICONS["h-yt"], goal:3, color:PALETTE[0], createdKey:k},
      {id:"h-nofap", name:"No-fap", icon:ICONS["h-nofap"], goal:7, color:PALETTE[1], createdKey:k},
      {id:"h-exercise", name:"Exercise", icon:ICONS["h-exercise"], goal:5, color:PALETTE[2], createdKey:k},
      {id:"h-read", name:"Read 20 minutes", icon:ICONS["h-read"], goal:7, color:PALETTE[3], createdKey:k}
    ],
    checkins:{},
    money:{}
  };
}

function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return defaultState();
    const s = JSON.parse(raw);
    if(!Array.isArray(s.habits) || !s.checkins) throw 0;
    s.habits = s.habits.filter(h => h && typeof h.id === "string");
    s.habits.forEach((h,i) => {
      h.color = h.color || PALETTE[i % PALETTE.length];
      h.createdKey = h.createdKey || keyOf(today());
      if(!h.icon && ICONS[h.id]) h.icon = ICONS[h.id];
    });
    s.money = (s.money && typeof s.money === "object") ? s.money : {};
    return s;
  }catch(e){
    return defaultState();
  }
}
function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }

let state = load();

const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));