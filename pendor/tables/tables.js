"use strict";

const kind = window.PENDOR_TABLE_KIND;
const armorTypes = new Set(["head armor", "body armor", "foot armor", "hand armor"]);
const columns = kind === "items" ? [
  ["name", "Item"], ["type", "Type"], ["difficulty", "Difficulty"],
  ["head_armor", "Head armor"], ["body_armor", "Body armor"], ["leg_armor", "Leg armor"],
  ["weight", "Weight"], ["value", "Base value"], ["speed_rating", "Speed"], ["weapon_length", "Length"],
] : [
  ["name", "Troop"], ["level", "Level"], ["archery", "Archery"],
  ["one_handed", "One handed"], ["two_handed", "Two handed"], ["polearms", "Polearms"],
  ["crossbows", "Crossbows"], ["throwing", "Throwing"], ["firearms", "Firearms"],
];
const allowedSorts = new Set(columns.map(([key]) => key));
const params = new URLSearchParams(location.search);
const state = {
  search: params.get("q") || "",
  type: params.get("type") || "",
  strength: params.get("str") || "",
  linked: params.get("linked") === "1",
  sort: allowedSorts.has(params.get("sort")) ? params.get("sort") : (kind === "troops" ? "archery" : "name"),
  dir: ["asc", "desc"].includes(params.get("dir")) ? params.get("dir") : (kind === "troops" ? "desc" : "asc"),
  page: 0,
};
const size = 100;
const search = document.querySelector("#search");
const type = document.querySelector("#type");
const strength = document.querySelector("#strength");
const linked = document.querySelector("#linked");
const count = document.querySelector("#count");
const head = document.querySelector("#results thead");
const body = document.querySelector("#results tbody");
const prev = document.querySelector("#prev");
const next = document.querySelector("#next");
const pageLabel = document.querySelector("#page");
let rows = [];

function saveQuery() {
  const query = new URLSearchParams();
  if (state.search) query.set("q", state.search);
  if (kind === "items" && state.type) query.set("type", state.type);
  if (kind === "items" && state.strength !== "" && armorTypes.has(state.type)) query.set("str", state.strength);
  if (state.linked) query.set("linked", "1");
  query.set("sort", state.sort);
  query.set("dir", state.dir);
  history.replaceState(null, "", location.pathname + "?" + query);
}

function makeHeader() {
  const tr = document.createElement("tr");
  for (const [key, label] of columns) {
    const th = document.createElement("th");
    th.scope = "col";
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label + (state.sort === key ? (state.dir === "desc" ? " ↓" : " ↑") : "");
    button.setAttribute("aria-label", `Sort by ${label}`);
    button.addEventListener("click", () => {
      state.dir = state.sort === key && state.dir === "desc" ? "asc" : "desc";
      state.sort = key;
      state.page = 0;
      render();
    });
    th.append(button);
    tr.append(th);
  }
  head.replaceChildren(tr);
}

function filtered() {
  const q = state.search.trim().toLocaleLowerCase();
  const result = rows.filter(row => {
    if (q && !(row.name + " " + row.id).toLocaleLowerCase().includes(q)) return false;
    if (state.linked && !row.linked) return false;
    if (kind === "items" && state.type && row.type !== state.type) return false;
    if (kind === "items" && armorTypes.has(state.type) && state.strength !== "" && row.difficulty > Number(state.strength)) return false;
    return true;
  });
  const numeric = state.sort !== "name" && state.sort !== "type";
  result.sort((a, b) => {
    const primary = numeric ? a[state.sort] - b[state.sort] : String(a[state.sort]).localeCompare(String(b[state.sort]));
    return (state.dir === "asc" ? primary : -primary) || a.name.localeCompare(b.name) || a.index - b.index;
  });
  return result;
}

function makeCell(row, key) {
  const td = document.createElement("td");
  if (key === "name") {
    if (row.detail) {
      const a = document.createElement("a");
      a.href = `/game-reference/pendor/${kind === "items" ? "item" : "troop"}/${encodeURIComponent(row.id)}/`;
      a.textContent = row.name;
      td.append(a);
    } else {
      td.append(document.createTextNode(row.name));
    }
    const id = document.createElement("small");
    id.className = "table-id";
    id.textContent = `${row.id} · #${row.index}${row.linked ? (kind === "items" ? " · linked-troop item" : " · upgrade-linked") : ""}`;
    td.append(id);
  } else {
    td.textContent = String(row[key]);
  }
  return td;
}

function render() {
  makeHeader();
  const result = filtered();
  const pages = Math.max(1, Math.ceil(result.length / size));
  state.page = Math.min(state.page, pages - 1);
  const shown = result.slice(state.page * size, (state.page + 1) * size);
  const fragment = document.createDocumentFragment();
  for (const row of shown) {
    const tr = document.createElement("tr");
    for (const [key] of columns) tr.append(makeCell(row, key));
    fragment.append(tr);
  }
  body.replaceChildren(fragment);
  count.textContent = `${result.length.toLocaleString()} of ${rows.length.toLocaleString()} definitions`;
  pageLabel.textContent = `Page ${state.page + 1} of ${pages}`;
  prev.disabled = state.page === 0;
  next.disabled = state.page >= pages - 1;
  saveQuery();
}

search.value = state.search;
search.addEventListener("input", () => { state.search = search.value; state.page = 0; render(); });
linked.checked = state.linked;
linked.addEventListener("change", () => { state.linked = linked.checked; state.page = 0; render(); });
prev.addEventListener("click", () => { state.page--; render(); });
next.addEventListener("click", () => { state.page++; render(); });

fetch(`/game-reference/pendor/tables/${kind}.json`).then(response => {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}).then(data => {
  rows = data;
  if (kind === "items") {
    const all = document.createElement("option"); all.value = ""; all.textContent = "All types"; type.append(all);
    for (const name of [...new Set(rows.map(row => row.type))].sort()) {
      const option = document.createElement("option"); option.value = name; option.textContent = name; type.append(option);
    }
    if (![...type.options].some(option => option.value === state.type)) state.type = "";
    type.value = state.type;
    strength.disabled = !armorTypes.has(state.type);
    if (strength.disabled) state.strength = "";
    strength.value = state.strength;
    type.addEventListener("change", () => {
      state.type = type.value;
      strength.disabled = !armorTypes.has(state.type);
      if (strength.disabled) state.strength = strength.value = "";
      state.page = 0; render();
    });
    strength.addEventListener("input", () => { state.strength = strength.value; state.page = 0; render(); });
  }
  render();
}).catch(error => { count.textContent = `Could not load catalog: ${error.message}`; });
