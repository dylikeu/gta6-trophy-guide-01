// Leonida Legend — GTA VI trophy tracker. Plain module, no dependencies.
// Loads the trophy list and roadmap from local JSON files, keeps earned
// trophies in localStorage, and never makes a network request.
const EARNED_KEY = 'leonida-legend-earned-v1';
const SPOILER_KEY = 'leonida-legend-spoiler-v1';
const KIND_KEY = 'leonida-legend-kind-v1';

const listEl = document.getElementById('trophyList');
const detailEl = document.getElementById('detailPanel');
const progressText = document.getElementById('progressText');
const progressPct = document.getElementById('progressPct');
const progressFill = document.getElementById('progressFill');
const gradeCounts = document.getElementById('gradeCounts');
const listMeta = document.getElementById('listMeta');
const onlineNote = document.getElementById('onlineNote');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('gradeFilter');
const spoilerEl = document.getElementById('spoilerToggle');
const earnedOnlyEl = document.getElementById('earnedOnly');

let trophies = [];
let roadmap = null;
let earned = new Set(readStoredArray(EARNED_KEY));
let kind = localStorage.getItem(KIND_KEY) || 'all';
let selectedId = null;

function readStoredArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function saveEarned() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned].sort()));
}

function isStory(t) {
  return t.kind === 'story';
}

function isHiddenFromViewer(t) {
  return spoilerEl.checked && isStory(t) && !earned.has(t.name);
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function kindLabel(t) {
  if (t.kind === 'story') return 'Story';
  if (t.kind === 'collectibles') return 'Collectibles';
  return 'Activities';
}

function matchesFilters(t) {
  const q = searchEl.value.trim().toLowerCase();
  if (q) {
    const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (kind === 'missable' && !t.missable) return false;
  if (kind === 'online') return false;
  if (kind !== 'all' && kind !== 'missable' && kind !== 'online' && t.kind !== kind) return false;
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (earnedOnlyEl.checked && !earned.has(t.name)) return false;
  return true;
}

function renderProgress() {
  const total = trophies.length;
  const done = trophies.filter((t) => earned.has(t.name)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  progressText.textContent = `${done} of ${total} earned`;
  progressPct.textContent = `${pct}%`;
  progressFill.style.width = `${pct}%`;
  const byGrade = {};
  for (const g of ['platinum', 'gold', 'silver', 'bronze']) {
    const all = trophies.filter((t) => t.grade === g).length;
    const got = trophies.filter((t) => t.grade === g && earned.has(t.name)).length;
    byGrade[g] = `${gradeLabel(g)} ${got}/${all}`;
  }
  gradeCounts.textContent = `${byGrade.platinum} · ${byGrade.gold} · ${byGrade.silver} · ${byGrade.bronze}`;
}

function renderList() {
  const shown = trophies.filter(matchesFilters);
  onlineNote.hidden = kind !== 'online';
  listMeta.textContent = kind === 'online'
    ? 'Showing 0 of 55 trophies — there are no online trophies'
    : `Showing ${shown.length} of ${trophies.length} trophies`;
  listEl.replaceChildren();
  for (const t of shown) {
    const li = document.createElement('li');
    li.className = 'trophy-card' + (earned.has(t.name) ? ' earned' : '') + (selectedId === t.id ? ' selected' : '');
    const top = document.createElement('div');
    top.className = 'trophy-top';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.className = 'trophy-check';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Mark ${t.name} as earned`);
    box.addEventListener('click', (event) => event.stopPropagation());
    box.addEventListener('change', () => {
      toggleEarned(t);
    });
    const text = document.createElement('div');
    const name = document.createElement('p');
    name.className = 'trophy-name';
    const desc = document.createElement('p');
    desc.className = 'trophy-desc';
    if (isHiddenFromViewer(t)) {
      name.textContent = 'Hidden story trophy';
      name.classList.add('spoiler-hidden');
      desc.textContent = 'Spoilers hidden — earn this trophy to reveal its name and description.';
    } else {
      name.textContent = t.name;
      desc.textContent = t.description;
    }
    text.append(name, desc);
    top.append(box, text);
    const meta = document.createElement('div');
    meta.className = 'trophy-meta';
    const grade = document.createElement('span');
    grade.className = `badge ${t.grade}`;
    grade.textContent = t.grade;
    meta.append(grade);
    const kindTag = document.createElement('span');
    kindTag.className = 'tag';
    kindTag.textContent = kindLabel(t);
    meta.append(kindTag);
    if (t.missable) {
      const miss = document.createElement('span');
      miss.className = 'tag missable';
      miss.textContent = '⚠ Missable';
      meta.append(miss);
    }
    if (t.hidden) {
      const hid = document.createElement('span');
      hid.className = 'tag hidden';
      hid.textContent = 'Hidden on PS5';
      meta.append(hid);
    }
    const preview = document.createElement('p');
    preview.className = 'trophy-guide-preview';
    preview.textContent = isHiddenFromViewer(t)
      ? 'Guide hidden until earned.'
      : t.guide.slice(0, 140) + (t.guide.length > 140 ? '…' : '');
    li.append(top, meta, preview);
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    li.setAttribute('aria-label', `Open guide for ${isHiddenFromViewer(t) ? 'hidden story trophy' : t.name}`);
    li.addEventListener('click', () => selectTrophy(t.id));
    li.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectTrophy(t.id);
      }
    });
    listEl.append(li);
  }
  if (shown.length === 0 && kind !== 'online') {
    const empty = document.createElement('li');
    empty.textContent = 'No trophies match these filters. Clear the search or pick another kind.';
    listEl.append(empty);
  }
}

function toggleEarned(t) {
  if (earned.has(t.name)) earned.delete(t.name);
  else earned.add(t.name);
  saveEarned();
  renderProgress();
  renderList();
  if (selectedId === t.id) renderDetail();
}

function selectTrophy(id) {
  selectedId = id;
  renderList();
  renderDetail();
}

function renderDetail() {
  const t = trophies.find((x) => x.id === selectedId);
  if (!t) {
    detailEl.innerHTML = '<p class="detail-empty">Select a trophy to read its guide, sources and roadmap step.</p>';
    return;
  }
  detailEl.replaceChildren();
  const hidden = isHiddenFromViewer(t);
  const title = document.createElement('h2');
  title.textContent = hidden ? 'Hidden story trophy' : t.name;
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = hidden
    ? 'Story trophy — details hidden by the spoiler setting until you earn it.'
    : `${gradeLabel(t.grade)} · ${t.description}`;
  detailEl.append(title, official);
  if (t.missable) {
    const flag = document.createElement('p');
    flag.className = 'missable-flag';
    flag.textContent = '⚠ Missable — do the Chapter 1 balcony meditation with Lucia before Chapter 1 ends (see the guide below).';
    detailEl.append(flag);
  }
  const guideHead = document.createElement('h3');
  guideHead.textContent = 'Guide';
  const guide = document.createElement('p');
  guide.textContent = hidden ? 'Earn this trophy to reveal its guide.' : t.guide;
  detailEl.append(guideHead, guide);
  const srcHead = document.createElement('h3');
  srcHead.textContent = 'Sources';
  const src = document.createElement('p');
  src.className = 'sources';
  src.textContent = 'Where this guide comes from: ';
  (t.sources || []).forEach((s, i) => {
    if (i > 0) src.append(document.createTextNode(' · '));
    if (s.url) {
      const a = document.createElement('a');
      a.href = s.url;
      a.textContent = s.name;
      a.target = '_blank';
      a.rel = 'noopener';
      src.append(a);
    } else {
      src.append(document.createTextNode(s.name));
    }
  });
  detailEl.append(srcHead, src);
  const roadHead = document.createElement('h3');
  roadHead.textContent = 'Roadmap';
  const road = document.createElement('p');
  const step = roadmap && roadmap.steps[t.roadmapStage - 1];
  road.textContent = step
    ? `Step ${t.roadmapStage} — ${step.title} (${step.hours}).`
    : `Roadmap step ${t.roadmapStage}.`;
  detailEl.append(roadHead, road);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'earn-btn' + (earned.has(t.name) ? ' earned' : '');
  btn.textContent = earned.has(t.name) ? '✓ Earned — click to unmark' : 'Mark as earned';
  btn.addEventListener('click', () => toggleEarned(t));
  detailEl.append(btn);
}

function renderRoadmap() {
  if (!roadmap) return;
  const facts = document.getElementById('roadmapFacts');
  facts.textContent = `Difficulty ${roadmap.facts.difficulty} · ${roadmap.facts.timeToPlatinum} to the platinum · ${roadmap.facts.playthroughs} playthrough · ${roadmap.facts.onlineTrophies} online trophies · ${roadmap.facts.missableCount} possibly missable trophy · ${roadmap.facts.hiddenCount} hidden on PlayStation. ${roadmap.facts.cheats} ${roadmap.facts.freeRoam} ${roadmap.facts.manualSaves}`;
  const stepsEl = document.getElementById('roadmapSteps');
  stepsEl.replaceChildren();
  roadmap.steps.forEach((step, i) => {
    const li = document.createElement('li');
    li.className = 'roadmap-step';
    const h = document.createElement('h3');
    h.textContent = step.title;
    const hours = document.createElement('p');
    hours.className = 'hours';
    hours.textContent = step.hours;
    const goal = document.createElement('p');
    goal.textContent = step.goal;
    const notes = document.createElement('ul');
    for (const n of step.notes) {
      const item = document.createElement('li');
      item.textContent = n;
      notes.append(item);
    }
    const covers = document.createElement('p');
    covers.className = 'covers';
    covers.textContent = `Trophies in this step: ${step.trophies}`;
    li.append(h, hours, goal, notes, covers);
    stepsEl.append(li);
  });
  const card = document.getElementById('missableCard');
  card.replaceChildren();
  const w = roadmap.warning;
  const wh = document.createElement('h3');
  wh.textContent = w.title;
  const wd = document.createElement('p');
  wd.textContent = w.detail;
  const link = document.createElement('button');
  link.type = 'button';
  link.className = 'chip';
  link.textContent = 'Open the Positive Mental Attitude guide';
  link.addEventListener('click', () => {
    const target = trophies.find((t) => t.name === w.trophy);
    if (target) {
      showView('tracker');
      kind = 'all';
      syncKindChips();
      selectTrophy(target.id);
      document.getElementById('viewTracker').scrollIntoView();
    }
  });
  card.append(wh, wd, link);
}

function showView(name) {
  for (const v of ['tracker', 'roadmap', 'missables']) {
    document.getElementById('view' + v.charAt(0).toUpperCase() + v.slice(1)).hidden = v !== name;
    document.getElementById('tab' + v.charAt(0).toUpperCase() + v.slice(1)).classList.toggle('active', v === name);
  }
}

function syncKindChips() {
  document.querySelectorAll('#kindFilters .chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.kind === kind);
  });
  localStorage.setItem(KIND_KEY, kind);
}

function exportProgress() {
  const payload = {
    app: 'leonida-legend',
    exportedAt: new Date().toISOString(),
    total: trophies.length,
    earned: [...earned].sort(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  try {
    const parsed = JSON.parse(await file.text());
    const names = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(names)) throw new Error('no earned list');
    const valid = new Set(trophies.map((t) => t.name));
    const kept = names.filter((n) => typeof n === 'string' && valid.has(n));
    earned = new Set(kept);
    saveEarned();
    renderProgress();
    renderList();
    renderDetail();
    listMeta.textContent = `Imported ${kept.length} earned trophies.`;
  } catch {
    listMeta.textContent = 'Import failed: that file is not a Leonida Legend progress export.';
  }
}

function loadSample() {
  const sample = [
    'Just Like Paradise', 'Paradise Lost', 'T**s Ass Drug Money', 'Trust',
    'Master of None', 'Stick Fiddler', 'Baited My Tackle', 'Whip It Good',
    'You WAiNKer!', 'The Goodtime State', 'In The Beginning…',
    'Treat Yo Self', 'Ten Pin', 'One Last Thing',
  ];
  for (const name of sample) earned.add(name);
  saveEarned();
  renderProgress();
  renderList();
}

document.querySelectorAll('#kindFilters .chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    kind = chip.dataset.kind;
    syncKindChips();
    renderList();
  });
});
gradeEl.addEventListener('change', renderList);
searchEl.addEventListener('input', renderList);
earnedOnlyEl.addEventListener('change', renderList);
spoilerEl.addEventListener('change', () => {
  localStorage.setItem(SPOILER_KEY, spoilerEl.checked ? '1' : '0');
  renderList();
  renderDetail();
});
document.getElementById('exportBtn').addEventListener('click', exportProgress);
document.getElementById('importBtn').addEventListener('click', () => {
  document.getElementById('importFile').click();
});
document.getElementById('importFile').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) importProgress(file);
  event.target.value = '';
});
document.getElementById('sampleBtn').addEventListener('click', loadSample);
document.getElementById('resetBtn').addEventListener('click', () => {
  earned = new Set();
  saveEarned();
  renderProgress();
  renderList();
  renderDetail();
});
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => showView(tab.dataset.view));
});

spoilerEl.checked = localStorage.getItem(SPOILER_KEY) === '1';
syncKindChips();

const params = new URLSearchParams(location.search);
if (params.get('view') === 'roadmap' || params.get('view') === 'missables') {
  showView(params.get('view'));
}
if (params.get('spoiler') === '1') {
  spoilerEl.checked = true;
  localStorage.setItem(SPOILER_KEY, '1');
}

const [trophyDoc, roadmapDoc] = await Promise.all([
  (await fetch('data/trophies.json')).json(),
  (await fetch('data/roadmap.json')).json(),
]);
trophies = trophyDoc.trophies;
roadmap = roadmapDoc;

if (params.get('sample') === '1' && earned.size === 0) loadSample();
const detailId = Number(params.get('detail'));
if (Number.isInteger(detailId) && trophies.some((t) => t.id === detailId)) {
  selectedId = detailId;
}
if (params.get('kind') && ['story', 'missable', 'collectibles', 'activities', 'online'].includes(params.get('kind'))) {
  kind = params.get('kind');
  syncKindChips();
}

renderProgress();
renderList();
renderDetail();
renderRoadmap();
