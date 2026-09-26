"use strict";

const choices = document.querySelector("#choices");
const likeList = document.querySelector("#likes");
const dislikeList = document.querySelector("#dislikes");
const status = document.querySelector("#copy-status");
let companions = [];
let pairs = [];
let activePairs = [];
let selected = new Set();

function companionLink(person) {
  const a = document.createElement("a");
  a.href = `/game-reference/pendor/companion/${encodeURIComponent(person.id)}/`;
  a.textContent = person.name;
  return a;
}

function showPairs(target, rows, byId) {
  const fragment = document.createDocumentFragment();
  for (const pair of rows) {
    const li = document.createElement("li");
    li.className = pair.kind;
    li.append(companionLink(byId.get(pair.a)), document.createTextNode(" ↔ "), companionLink(byId.get(pair.b)));
    fragment.append(li);
  }
  if (!rows.length) {
    const li = document.createElement("li");
    li.textContent = "No listed pairs within this selection.";
    fragment.append(li);
  }
  target.replaceChildren(fragment);
}

function update() {
  selected = new Set([...choices.querySelectorAll("input:checked")].map(input => input.value));
  activePairs = pairs.filter(pair => selected.has(pair.a) && selected.has(pair.b));
  const byId = new Map(companions.map(person => [person.id, person]));
  const likes = activePairs.filter(pair => pair.kind === "likes");
  const dislikes = activePairs.filter(pair => pair.kind === "dislikes");
  document.querySelector("#selected-count").textContent = String(selected.size);
  document.querySelector("#like-count").textContent = String(likes.length);
  document.querySelector("#dislike-count").textContent = String(dislikes.length);
  showPairs(likeList, likes, byId);
  showPairs(dislikeList, dislikes, byId);
  const query = new URLSearchParams();
  if (selected.size) query.set("ids", [...selected].sort().join(","));
  history.replaceState(null, "", location.pathname + (query.size ? `?${query}` : ""));
  status.textContent = "";
}

function setAll(checked) {
  for (const input of choices.querySelectorAll("input")) input.checked = checked;
  update();
}

document.querySelector("#all").addEventListener("click", () => setAll(true));
document.querySelector("#clear").addEventListener("click", () => setAll(false));
document.querySelector("#copy").addEventListener("click", async () => {
  const byId = new Map(companions.map(person => [person.id, person.name]));
  const names = companions.filter(person => selected.has(person.id)).map(person => person.name);
  const lines = ["# Selected companion assignments", "", `Selected (${names.length}): ${names.join(", ") || "none"}`, "", "Initial module assignments only; no morale or current-save prediction."];
  for (const [kind, heading] of [["likes", "Likes"], ["dislikes", "Dislikes"]]) {
    lines.push("", `## ${heading}`, "");
    const matching = activePairs.filter(pair => pair.kind === kind);
    lines.push(...(matching.length ? matching.map(pair => `- ${byId.get(pair.a)} ↔ ${byId.get(pair.b)}`) : ["- None listed within this selection"]));
  }
  try {
    await navigator.clipboard.writeText(lines.join("\n") + "\n");
    status.textContent = "Copied Markdown.";
  } catch {
    status.textContent = "Clipboard unavailable in this browser.";
  }
});

fetch("/game-reference/pendor/roster/data.json").then(response => {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}).then(data => {
  companions = data.companions;
  pairs = data.pairs;
  const requested = new Set((new URLSearchParams(location.search).get("ids") || "").split(","));
  const fragment = document.createDocumentFragment();
  for (const person of companions) {
    const label = document.createElement("label");
    label.className = "roster-choice";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = person.id;
    input.checked = requested.has(person.id);
    input.addEventListener("change", update);
    label.append(input, document.createTextNode(person.name));
    fragment.append(label);
  }
  choices.replaceChildren(fragment);
  update();
}).catch(error => {
  choices.textContent = `Could not load relationships: ${error.message}`;
});
