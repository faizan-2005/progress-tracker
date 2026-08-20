"use strict";
const THEMES = ["night","ember","ocean"];
const NAME_KEY = "daily-ledger-name";
const THEME_KEY = "daily-ledger-theme";

let userName = localStorage.getItem(NAME_KEY) || "";
window.UserName = userName;

function setTheme(name){
  if(!THEMES.includes(name)) name = "night";
  document.documentElement.dataset.theme = name;
  localStorage.setItem(THEME_KEY, name);
  document.querySelectorAll("[data-theme-btn]").forEach(b => {
    b.classList.toggle("active", b.dataset.themeBtn === name);
  });
}
setTheme(localStorage.getItem(THEME_KEY) || "night");

document.querySelectorAll("[data-theme-btn]").forEach(btn => {
  btn.addEventListener("click", () => setTheme(btn.dataset.themeBtn));
});

function updateNameChip(){
  const chip = document.getElementById("nameChipText");
  if(chip) chip.textContent = userName;
}
updateNameChip();

const overlay = document.getElementById("nameOverlay");

function showNamePrompt(){
  overlay.classList.remove("hidden");
  const input = document.getElementById("userNameIn");
  input.value = userName;
  setTimeout(() => input.focus(), 120);
}
function hideNamePrompt(){
  overlay.classList.add("hidden");
}

document.getElementById("nameForm").addEventListener("submit", e => {
  e.preventDefault();
  const v = document.getElementById("userNameIn").value.trim();
  if(!v) return;
  userName = v;
  window.UserName = v;
  localStorage.setItem(NAME_KEY, v);
  updateNameChip();
  hideNamePrompt();
  window.dispatchEvent(new CustomEvent("ledger:ready"));
});

document.getElementById("changeNameBtn").addEventListener("click", showNamePrompt);

if(!userName){
  showNamePrompt();
} else {
  overlay.classList.add("hidden");
}