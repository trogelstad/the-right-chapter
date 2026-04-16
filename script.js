/* The Right Chapter — script.js */

'use strict';

const BOOKS = [
  { title: 'Daily Reflections', author: 'Alcoholics Anonymous', category: 'Recovery / Sobriety', pages: 400, moods: ['grounding', 'spiritual reset', 'practical sobriety help'] },
  { title: 'The Four Agreements', author: 'Don Miguel Ruiz', category: 'Mindset / Personal Growth', pages: 160, moods: ['grounding', 'motivation', 'spiritual reset'] },
  { title: 'The Alchemist', author: 'Paulo Coelho', category: 'Symbolic / Story-Based Inspiration', pages: 208, moods: ['motivation', 'creative spark', 'spiritual reset'] },
  { title: 'Alcoholics Anonymous', author: 'Alcoholics Anonymous', category: 'Recovery / Sobriety', pages: 575, moods: ['grounding', 'practical sobriety help', 'spiritual reset'] },
  { title: 'Becoming Supernatural', author: 'Dr. Joe Dispenza', category: 'Mindset / Personal Growth', pages: 380, moods: ['motivation', 'creative spark', 'spiritual reset'] },
  { title: 'Alcohol Explained', author: 'William Porter', category: 'Recovery / Sobriety', pages: 200, moods: ['practical sobriety help', 'grounding'] },
  { title: 'This Naked Mind', author: 'Annie Grace', category: 'Recovery / Sobriety', pages: 260, moods: ['practical sobriety help', 'motivation', 'grounding'] },
  { title: 'Quit Drinking Without Willpower', author: 'Allen Carr', category: 'Recovery / Sobriety', pages: 288, moods: ['practical sobriety help', 'grounding'] },
  { title: 'Quantum Success', author: 'Sandra Anne Taylor', category: 'Mindset / Personal Growth', pages: 256, moods: ['motivation', 'creative spark', 'money focus'] },
  { title: 'Twelve Steps and Twelve Traditions', author: 'Alcoholics Anonymous', category: 'Recovery / Sobriety', pages: 192, moods: ['practical sobriety help', 'grounding', 'spiritual reset'] },
  { title: 'The Road Less Traveled', author: 'M. Scott Peck', category: 'Mindset / Personal Growth', pages: 316, moods: ['grounding', 'motivation', 'spiritual reset'] },
  { title: 'Alcohol Explained 2', author: 'William Porter', category: 'Recovery / Sobriety', pages: 200, moods: ['practical sobriety help', 'grounding'] },
  { title: 'Living Sober', author: 'Alcoholics Anonymous', category: 'Recovery / Sobriety', pages: 120, moods: ['practical sobriety help', 'grounding'] },
  { title: 'The Automatic Millionaire', author: 'David Bach', category: 'Money / Life Stewardship', pages: 240, moods: ['money focus', 'motivation'] },
  { title: 'The Energy of Money', author: 'Maria Nemeth, Ph.D.', category: 'Money / Life Stewardship', pages: 304, moods: ['money focus', 'grounding', 'spiritual reset'] },
  { title: 'The Red Road to Wellbriety', author: 'White Bison, Inc.', category: 'Spiritual / Reflection', pages: 200, moods: ['spiritual reset', 'grounding', 'practical sobriety help'] },
  { title: 'The Holy Bible', author: 'Various', category: 'Spiritual / Reflection', pages: 1200, moods: ['spiritual reset', 'grounding', 'creative spark'] },
  { title: 'Atomic Habits', author: 'James Clear', category: 'Mindset / Personal Growth', pages: 320, moods: ['motivation', 'grounding', 'money focus'] },
];

const PROMPTS = {
  grounding:                'What did you read that helped you feel more settled and present?',
  motivation:               'What line or idea fired you up? How will you act on it today?',
  'spiritual reset':        'What did the reading stir in you spiritually? What do you want to carry forward?',
  'practical sobriety help':'What tool or insight from this reading can you use today?',
  'creative spark':         'What idea surprised you or opened a new door in your thinking?',
  'money focus':            'What one financial habit or mindset shift does this reading suggest?',
  any:                      'What stood out to you? What will you take into your day?',
};

const NOTES = {
  grounding:                'a grounding read — a good anchor for right now.',
  motivation:               'a motivational pick — good fuel for what\'s ahead.',
  'spiritual reset':        'a spiritual reset — gives your soul some breathing room.',
  'practical sobriety help':'practical recovery support — solid tools for today.',
  'creative spark':         'a creative spark — opens new doors.',
  'money focus':            'a money and stewardship focus — a good mindset shift.',
  any:                      'a balanced pick that fits where you are today.',
};

const STORAGE_KEY = 'the_right_chapter_v1';
let state = load();
let current = null;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const defaults = { streak: 0, sessions: 0, mins: 0, lastDate: null, markedDates: [], log: [], reflections: {} };
    return raw ? Object.assign(defaults, JSON.parse(raw)) : defaults;
  } catch (_) {
    return { streak: 0, sessions: 0, mins: 0, lastDate: null, markedDates: [], log: [], reflections: {} };
  }
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
}

function today() { return new Date().toISOString().split('T')[0]; }
function rpage(book) { return Math.floor(Math.random() * (book.pages - 1)) + 1; }
function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getSelected(groupId) {
  const el = document.querySelector('#' + groupId + ' .pill.on');
  return el ? el.dataset.v : 'any';
}

function initPills() {
  document.querySelectorAll('.pills').forEach(group => {
    group.addEventListener('click', e => {
      const pill = e.target.closest('.pill');
      if (!pill) return;
      group.querySelectorAll('.pill').forEach(p => p.classList.remove('on'));
      pill.classList.add('on');
    });
  });
}

function spin() {
  const mood = getSelected('g-mood');
  const time = parseInt(getSelected('g-time') || '10', 10);

  let pool = BOOKS.filter(b => {
    if (getSelected('g-cat') !== 'any' && b.category !== getSelected('g-cat')) return false;
    if (mood !== 'any' && !b.moods.includes(mood)) return false;
    return true;
  });
  if (!pool.length) pool = BOOKS;

  let book = rand(pool);
  if (current && pool.length > 1) {
    let tries = 0;
    while (book.title === current.title && tries < 10) { book = rand(pool); tries++; }
  }

  current = { ...book, page: rpage(book), time, mood };
  renderResult();
  updatePrompt(mood);
  logSession();
}

function rerollPage() {
  if (!current) return;
  current.page = rpage(current);
  document.getElementById('r-page').textContent = current.page;
}

function markRead() {
  const td = today();
  if (state.markedDates.includes(td)) return;
  state.markedDates.push(td);

  const yest = new Date(); yest.setDate(yest.getDate() - 1);
  const yStr = yest.toISOString().split('T')[0];
  if (state.lastDate === yStr) {
    state.streak++;
  } else if (state.lastDate !== td) {
    state.streak = 1;
  }
  state.lastDate = td;

  if (state.log.length) { state.log[0].marked = true; }

  save();
  renderStats();
  renderLog();
  setMarkDone();
}

function setMarkDone() {
  const btn = document.getElementById('mark-btn');
  btn.textContent = 'Read today ✓';
  btn.classList.add('done');
  document.getElementById('r-done').style.display = 'inline';
}

function renderResult() {
  const b = current;
  document.getElementById('r-title').textContent  = b.title;
  document.getElementById('r-author').textContent = b.author;
  document.getElementById('r-cat').textContent    = b.category;
  document.getElementById('r-time').textContent   = b.time + ' min session';
  document.getElementById('r-mood').textContent   = b.mood === 'any' ? 'open pick' : b.mood;
  document.getElementById('r-page').textContent   = b.page;
  document.getElementById('r-note').textContent   = 'This is ' + (NOTES[b.mood] || NOTES.any);

  const td  = today();
  const btn = document.getElementById('mark-btn');
  const dne = document.getElementById('r-done');

  if (state.markedDates.includes(td)) {
    btn.textContent = 'Read today ✓';
    btn.classList.add('done');
    dne.style.display = 'inline';
  } else {
    btn.textContent = 'Mark read today';
    btn.classList.remove('done');
    dne.style.display = 'none';
  }

  document.getElementById('result-card').classList.add('visible');
}

function updatePrompt(mood) {
  document.getElementById('r-prompt').textContent = PROMPTS[mood] || PROMPTS.any;
  document.getElementById('r-text').value = '';
  document.getElementById('saved-ok').style.display = 'none';
}

function saveReflect() {
  const val = document.getElementById('r-text').value.trim();
  if (!val) return;
  state.reflections[today()] = val;
  save();
  const ok = document.getElementById('saved-ok');
  ok.style.display = 'inline';
  setTimeout(() => { ok.style.display = 'none'; }, 2200);
}

function logSession() {
  const now = new Date();
  const td  = today();

  if (state.lastDate !== td) {
    const yest = new Date(); yest.setDate(yest.getDate() - 1);
    const yStr = yest.toISOString().split('T')[0];
    if (!state.markedDates.includes(td)) {
      if (state.lastDate !== yStr) state.streak = Math.max(state.streak, 1);
    }
    state.lastDate = td;
  }

  state.sessions++;
  state.mins += current.time;

  state.log.unshift({
    date:   now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    time:   now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    title:  current.title,
    page:   current.page,
    mood:   current.mood,
    mins:   current.time,
    marked: false,
  });
  if (state.log.length > 30) state.log.pop();

  save();
  renderStats();
  renderLog();
}

function renderStats() {
  document.getElementById('s-streak').textContent = state.streak;
  document.getElementById('s-sess').textContent   = state.sessions;
  document.getElementById('s-mins').textContent   = state.mins;
}

function renderLog() {
  const el = document.getElementById('log-list');
  if (!state.log.length) {
    el.innerHTML = '<p class="log-empty">No sessions yet. Find your first chapter to begin.</p>';
    return;
  }
  el.innerHTML = state.log.slice(0, 10).map(e => `
    <div class="log-entry">
      <div class="log-book">${e.title}</div>
      <div class="log-meta">
        <span>${e.date} &middot; ${e.time}</span>
        <span class="log-pill">p.${e.page}</span>
        ${e.mood && e.mood !== 'any' ? `<span class="log-pill">${e.mood}</span>` : ''}
        <span>${e.mins} min</span>
        ${e.marked ? '<span class="log-pill green">read ✓</span>' : ''}
      </div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  initPills();
  document.getElementById('spin-btn').addEventListener('click', spin);
  document.getElementById('reroll-page-btn').addEventListener('click', rerollPage);
  document.getElementById('reroll-book-btn').addEventListener('click', spin);
  document.getElementById('mark-btn').addEventListener('click', markRead);
  document.getElementById('save-reflect-btn').addEventListener('click', saveReflect);
  renderStats();
  renderLog();
});
