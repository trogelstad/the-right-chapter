/* ═══════════════════════════════════════════
   The Right Chapter — script.js
   Version 2.0 · Full build with Sample Shelf Mode
═══════════════════════════════════════════ */
'use strict';

/* ── Storage keys ── */
const LIBRARY_KEY = 'trc_library';
const STATE_KEY   = 'trc_state';

/* ══════════════════════════════════════════
   SAMPLE SHELF — curated starter library
   Built from the founding 18-book collection.
   Swap or expand this array anytime; the oracle
   uses it exactly like a personal shelf.
══════════════════════════════════════════ */
const SAMPLE_SHELF = {
  version: 2,
  isSample: true,
  books: [
    { id: 'sample-1',  title: 'Daily Reflections',                author: 'Alcoholics Anonymous', format: 'print', pages: 400,  addedAt: '2024-01-01' },
    { id: 'sample-2',  title: 'The Four Agreements',              author: 'Don Miguel Ruiz',       format: 'print', pages: 160,  addedAt: '2024-01-01' },
    { id: 'sample-3',  title: 'The Alchemist',                    author: 'Paulo Coelho',          format: 'print', pages: 208,  addedAt: '2024-01-01' },
    { id: 'sample-4',  title: 'Alcoholics Anonymous',             author: 'Alcoholics Anonymous', format: 'print', pages: 575,  addedAt: '2024-01-01' },
    { id: 'sample-5',  title: 'Becoming Supernatural',            author: 'Dr. Joe Dispenza',      format: 'print', pages: 380,  addedAt: '2024-01-01' },
    { id: 'sample-6',  title: 'Alcohol Explained',                author: 'William Porter',        format: 'print', pages: 200,  addedAt: '2024-01-01' },
    { id: 'sample-7',  title: 'This Naked Mind',                  author: 'Annie Grace',           format: 'print', pages: 260,  addedAt: '2024-01-01' },
    { id: 'sample-8',  title: 'Quit Drinking Without Willpower',  author: 'Allen Carr',            format: 'print', pages: 288,  addedAt: '2024-01-01' },
    { id: 'sample-9',  title: 'Quantum Success',                  author: 'Sandra Anne Taylor',    format: 'print', pages: 256,  addedAt: '2024-01-01' },
    { id: 'sample-10', title: 'Twelve Steps and Twelve Traditions', author: 'Alcoholics Anonymous', format: 'print', pages: 192, addedAt: '2024-01-01' },
    { id: 'sample-11', title: 'The Road Less Traveled',           author: 'M. Scott Peck',         format: 'print', pages: 316,  addedAt: '2024-01-01' },
    { id: 'sample-12', title: 'Alcohol Explained 2',              author: 'William Porter',        format: 'print', pages: 200,  addedAt: '2024-01-01' },
    { id: 'sample-13', title: 'Living Sober',                     author: 'Alcoholics Anonymous', format: 'print', pages: 120,  addedAt: '2024-01-01' },
    { id: 'sample-14', title: 'The Automatic Millionaire',        author: 'David Bach',            format: 'print', pages: 240,  addedAt: '2024-01-01' },
    { id: 'sample-15', title: 'The Energy of Money',              author: 'Maria Nemeth, Ph.D.',   format: 'print', pages: 304,  addedAt: '2024-01-01' },
    { id: 'sample-16', title: 'The Red Road to Wellbriety',       author: 'White Bison, Inc.',     format: 'print', pages: 200,  addedAt: '2024-01-01' },
    { id: 'sample-17', title: 'The Holy Bible',                   author: 'Various',               format: 'print', pages: 1200, addedAt: '2024-01-01' },
    { id: 'sample-18', title: 'Atomic Habits',                    author: 'James Clear',           format: 'print', pages: 320,  addedAt: '2024-01-01' },
  ]
};

/* ── App state ── */
let library          = null;
let appState         = null;
let editReturnScreen = 'screen-oracle';
let lastOracleResult = null;

/*
 * isSampleMode — true when the user chose "Try it with a sample shelf"
 * on the landing screen. Resets to false on page reload.
 * Nothing is written to localStorage while this is true.
 * Set back to false when the user explicitly builds their own shelf.
 */
let isSampleMode = false;

/* ═══════════════════════════════════════════
   SCREEN ROUTER
═══════════════════════════════════════════ */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
  const target = document.getElementById(id);
  if (target) {
    target.style.display = 'block';
    window.scrollTo(0, 0);
  }
}

/* ═══════════════════════════════════════════
   INIT — runs on page load
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  library  = loadLibrary();
  appState = loadState();
  wireButtons();

  if (library && library.books && library.books.length >= 3) {
    /* Returning user with a full shelf — go straight to oracle */
    updateOracleShelfLabel();
    renderStats();
    showStats(true);
    showScreen('screen-oracle');
  } else if (library && library.books && library.books.length > 0) {
    /* Partial shelf — resume setup */
    initShelfSetup(library.books);
    showScreen('screen-shelf-setup');
  } else {
    /* Brand new user — show landing */
    showScreen('screen-landing');
  }
});

/* ═══════════════════════════════════════════
   WIRE ALL BUTTONS
═══════════════════════════════════════════ */
function wireButtons() {

  /* ── LANDING ── */
  document.getElementById('landing-cta').addEventListener('click', () => {
    initShelfSetup([]);
    showScreen('screen-shelf-setup');
  });

  /* ── SAMPLE SHELF CTA (new) ── */
  document.getElementById('sample-shelf-cta').addEventListener('click', enterSampleMode);

  /* ── SHELF SETUP ── */
  document.getElementById('add-book-btn').addEventListener('click', () => {
    addBookRow('book-rows', onShelfRowChange);
  });

  document.getElementById('shelf-confirm-btn').addEventListener('click', () => {
    const books = collectBooks('book-rows');
    if (books.length < 3) return;
    saveLibrary(books);
    renderShelfDisplay(books, 'shelf-display');
    showScreen('screen-shelf-confirm');
  });

  /* ── SHELF CONFIRM ── */
  document.getElementById('confirm-oracle-btn').addEventListener('click', () => {
    updateOracleShelfLabel();
    showStats(false);
    showScreen('screen-oracle');
  });

  document.getElementById('confirm-edit-btn').addEventListener('click', () => {
    editReturnScreen = 'screen-shelf-confirm';
    initEditShelf();
    showScreen('screen-edit-shelf');
  });

  /* ── ORACLE INTAKE ── */
  document.getElementById('oracle-input').addEventListener('input', onOracleInputChange);

  document.getElementById('oracle-submit-btn').addEventListener('click', submitToOracle);

  document.getElementById('oracle-edit-shelf-btn').addEventListener('click', () => {
    editReturnScreen = 'screen-oracle';
    initEditShelf();
    showScreen('screen-edit-shelf');
  });

  /* ── REVEAL CARD ── */
  document.getElementById('rev-mark-btn').addEventListener('click', markRead);
  document.getElementById('save-reflect-btn').addEventListener('click', saveReflect);

  document.getElementById('ask-again-btn').addEventListener('click', () => {
    document.getElementById('oracle-input').value   = '';
    document.getElementById('char-count').textContent = '';
    updateOracleShelfLabel();
    if (!isSampleMode) {
      renderStats();
      showStats(true);
    }
    showScreen('screen-oracle');
  });

  /*
   * "Edit my shelf" on the reveal screen behaves differently in sample mode:
   * — sample mode  → exits sample mode and starts shelf setup
   * — normal mode  → opens the edit shelf screen
   * The button text is updated by renderReveal() each time.
   */
  document.getElementById('reveal-edit-shelf-btn').addEventListener('click', () => {
    if (isSampleMode) {
      exitSampleMode();
    } else {
      editReturnScreen = 'screen-reveal';
      initEditShelf();
      showScreen('screen-edit-shelf');
    }
  });

  /* ── SAMPLE PROMPT — "Add your shelf →" button (new) ── */
  document.getElementById('build-my-shelf-btn').addEventListener('click', exitSampleMode);

  /* ── EDIT SHELF ── */
  document.getElementById('edit-add-book-btn').addEventListener('click', () => {
    addBookRow('edit-book-rows', onEditRowChange);
  });

  document.getElementById('edit-save-btn').addEventListener('click', () => {
    const books = collectBooks('edit-book-rows');
    if (books.length < 3) return;
    saveLibrary(books);
    library = loadLibrary();
    updateOracleShelfLabel();
    showScreen(editReturnScreen);
  });

  document.getElementById('edit-cancel-btn').addEventListener('click', () => {
    showScreen(editReturnScreen);
  });
}

/* ═══════════════════════════════════════════
   SAMPLE MODE — enter & exit
═══════════════════════════════════════════ */

/**
 * enterSampleMode — called when user clicks "Try it with a sample shelf"
 * Sets isSampleMode = true, skips shelf setup entirely, goes to oracle.
 */
function enterSampleMode() {
  isSampleMode = true;
  document.getElementById('oracle-input').value    = '';
  document.getElementById('char-count').textContent = '';
  updateOracleShelfLabel();
  showStats(false); /* No stats banner during sample experience */
  showScreen('screen-oracle');
}

/**
 * exitSampleMode — called when user clicks "Add your shelf →" or
 * "Edit my shelf" while in sample mode.
 * Clears isSampleMode, starts fresh shelf setup.
 */
function exitSampleMode() {
  isSampleMode = false;
  initShelfSetup([]);
  showScreen('screen-shelf-setup');
}

/* ═══════════════════════════════════════════
   ORACLE — the main event
═══════════════════════════════════════════ */
async function submitToOracle() {
  const input = document.getElementById('oracle-input').value.trim();
  if (input.length < 5) return;

  /*
   * Choose the active book list:
   *   sample mode → SAMPLE_SHELF.books
   *   normal mode → the user's saved library
   */
  const books = isSampleMode
    ? SAMPLE_SHELF.books
    : (loadLibrary()?.books || []);

  if (!books || !books.length) {
    showScreen('screen-shelf-setup');
    return;
  }

  /* Show loading */
  showScreen('screen-loading');
  startLoadingMessages();

  try {
    const response = await fetch('/api/oracle', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ input, books })
    });

    stopLoadingMessages();

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Oracle error:', errData);
      showOracleError();
      return;
    }

    const data = await response.json();
    lastOracleResult = data;

    /* Don't pollute stats with sample-mode sessions */
    if (!isSampleMode) {
      logSession(data);
    }

    renderReveal(data);

  } catch (err) {
    console.error('Oracle fetch error:', err);
    stopLoadingMessages();
    showOracleError();
  }
}

function showOracleError() {
  showScreen('screen-oracle');
  const btn = document.getElementById('oracle-submit-btn');
  btn.textContent = 'The oracle went quiet — try again';
  setTimeout(() => { btn.textContent = 'Find my chapter →'; }, 4000);
}

/* ═══════════════════════════════════════════
   SHELF SETUP
═══════════════════════════════════════════ */
function initShelfSetup(existingBooks) {
  const container = document.getElementById('book-rows');
  container.innerHTML = '';
  const seed = existingBooks.length > 0 ? existingBooks : [{}, {}, {}];
  seed.forEach(b => addBookRow('book-rows', onShelfRowChange, b));
  updateShelfProgress('book-rows', 'shelf-progress', 'shelf-confirm-btn');
}

function addBookRow(containerId, onChange, prefill = {}) {
  const container = document.getElementById(containerId);
  const row = document.createElement('div');
  row.className = 'book-row';
  const fmt = prefill.format || 'print';

  row.innerHTML = `
    <div class="book-row-fields">
      <input
        type="text"
        class="book-title-input"
        placeholder="Book title"
        value="${escHtml(prefill.title || '')}"
        aria-label="Book title"
        autocomplete="off"
      />
      <input
        type="text"
        class="book-author-input"
        placeholder="Author"
        value="${escHtml(prefill.author || '')}"
        aria-label="Author name"
        autocomplete="off"
      />
    </div>
    <div class="book-row-meta">
      <div class="format-pills" role="group" aria-label="Format">
        <button type="button" class="fmt-pill ${fmt === 'print' ? 'on' : ''}" data-fmt="print">📖 Print</button>
        <button type="button" class="fmt-pill ${fmt === 'audio' ? 'on' : ''}" data-fmt="audio">🎧 Audio</button>
        <button type="button" class="fmt-pill ${fmt === 'ebook' ? 'on' : ''}" data-fmt="ebook">📱 eBook</button>
      </div>
      <button type="button" class="remove-book-btn" aria-label="Remove book">×</button>
    </div>
  `;

  row.querySelectorAll('.fmt-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      row.querySelectorAll('.fmt-pill').forEach(p => p.classList.remove('on'));
      btn.classList.add('on');
    });
  });

  row.querySelector('.remove-book-btn').addEventListener('click', () => {
    row.remove();
    onChange();
  });

  row.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', onChange);
  });

  container.appendChild(row);
  onChange();

  if (!prefill.title) {
    row.querySelector('.book-title-input').focus();
  }
}

function collectBooks(containerId) {
  const rows = document.querySelectorAll(`#${containerId} .book-row`);
  const books = [];
  rows.forEach(row => {
    const title  = row.querySelector('.book-title-input').value.trim();
    const author = row.querySelector('.book-author-input').value.trim();
    const fmtBtn = row.querySelector('.fmt-pill.on');
    const format = fmtBtn ? fmtBtn.dataset.fmt : 'print';
    if (title && author) {
      books.push({
        id:      String(Date.now() + Math.random()),
        title,
        author,
        format,
        pages:   null,
        addedAt: today()
      });
    }
  });
  return books;
}

function onShelfRowChange() {
  updateShelfProgress('book-rows', 'shelf-progress', 'shelf-confirm-btn');
}

function onEditRowChange() {
  updateShelfProgress('edit-book-rows', 'edit-shelf-progress', 'edit-save-btn');
}

function updateShelfProgress(containerId, progressId, btnId) {
  const books     = collectBooks(containerId);
  const count     = books.length;
  const progressEl = document.getElementById(progressId);
  const btnEl     = document.getElementById(btnId);

  if (count === 0) {
    progressEl.textContent = '';
    progressEl.className   = 'shelf-progress';
  } else if (count < 3) {
    progressEl.textContent = `${count} book${count > 1 ? 's' : ''} added · need at least 3`;
    progressEl.className   = 'shelf-progress warn';
  } else {
    progressEl.textContent = `${count} book${count > 1 ? 's' : ''} on your shelf ✓`;
    progressEl.className   = 'shelf-progress ok';
  }

  if (btnEl) btnEl.disabled = count < 3;
}

/* ═══════════════════════════════════════════
   EDIT SHELF
═══════════════════════════════════════════ */
function initEditShelf() {
  const lib       = loadLibrary();
  const container = document.getElementById('edit-book-rows');
  container.innerHTML = '';
  const books = (lib && lib.books) ? lib.books : [];
  if (books.length === 0) {
    addBookRow('edit-book-rows', onEditRowChange);
    addBookRow('edit-book-rows', onEditRowChange);
    addBookRow('edit-book-rows', onEditRowChange);
  } else {
    books.forEach(b => addBookRow('edit-book-rows', onEditRowChange, b));
  }
  updateShelfProgress('edit-book-rows', 'edit-shelf-progress', 'edit-save-btn');
}

/* ═══════════════════════════════════════════
   SHELF CONFIRMATION DISPLAY
═══════════════════════════════════════════ */
function renderShelfDisplay(books, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = books.map(b => `
    <div class="shelf-item">
      <span class="shelf-item-title">${escHtml(b.title)}</span>
      <span class="shelf-item-author">${escHtml(b.author)}</span>
      <span class="badge b-format-${escHtml(b.format)}">${formatLabel(b.format)}</span>
    </div>
  `).join('');
}

/* ═══════════════════════════════════════════
   ORACLE INTAKE
═══════════════════════════════════════════ */
function onOracleInputChange() {
  const input   = document.getElementById('oracle-input');
  const btn     = document.getElementById('oracle-submit-btn');
  const counter = document.getElementById('char-count');
  const len     = input.value.length;

  btn.disabled = len < 5;

  if (len > 20) {
    counter.textContent  = `${len} / 500`;
    counter.style.display = 'block';
  } else {
    counter.style.display = 'none';
  }
}

/**
 * updateOracleShelfLabel — updates the header subline and shelf button
 * on the oracle intake screen.
 * In sample mode: shows "Sample shelf · 18 books" and hides the edit button.
 * In normal mode: shows "Your shelf · N books" and shows the edit button.
 */
function updateOracleShelfLabel() {
  const countEl   = document.getElementById('oracle-shelf-count');
  const labelEl   = document.getElementById('oracle-shelf-label');
  const editBtn   = document.getElementById('oracle-edit-shelf-btn');

  if (isSampleMode) {
    const count = SAMPLE_SHELF.books.length;
    if (countEl)  countEl.textContent  = count;
    if (labelEl)  labelEl.textContent  = `Sample shelf · ${count} books`;
    if (editBtn)  editBtn.style.display = 'none'; /* Can't edit a sample shelf */
  } else {
    const lib   = loadLibrary();
    const count = (lib && lib.books) ? lib.books.length : 0;
    if (countEl)  countEl.textContent  = count;
    if (labelEl)  labelEl.textContent  = `Your shelf · ${count} book${count !== 1 ? 's' : ''}`;
    if (editBtn)  editBtn.style.display = ''; /* Restore visibility */
  }
}

/* ═══════════════════════════════════════════
   LOADING STATE
═══════════════════════════════════════════ */
const LOADING_MESSAGES = [
  'Reading what you brought…',
  'Moving through your shelf…',
  'Something is aligning…',
  'Your chapter is close…'
];
let loadingTimer = null;
let loadingIndex = 0;

function startLoadingMessages() {
  loadingIndex = 0;
  const msgEl = document.getElementById('loading-msg');
  if (msgEl) msgEl.textContent = LOADING_MESSAGES[0];

  loadingTimer = setInterval(() => {
    loadingIndex = (loadingIndex + 1) % LOADING_MESSAGES.length;
    if (msgEl) {
      msgEl.style.opacity = '0';
      setTimeout(() => {
        msgEl.textContent   = LOADING_MESSAGES[loadingIndex];
        msgEl.style.opacity = '1';
      }, 300);
    }
  }, 1800);
}

function stopLoadingMessages() {
  if (loadingTimer) { clearInterval(loadingTimer); loadingTimer = null; }
}

/* ═══════════════════════════════════════════
   REVEAL CARD
═══════════════════════════════════════════ */
function renderReveal(data) {
  document.getElementById('rev-title').textContent      = data.title      || '';
  document.getElementById('rev-author').textContent     = data.author     || '';
  document.getElementById('rev-oracle-msg').textContent = data.oracleMessage || '';

  const pageEl    = document.getElementById('rev-page');
  const pageSubEl = document.getElementById('rev-page-sub');

  if (data.pageRefType === 'number') {
    pageEl.style.fontSize  = '';
    pageEl.style.fontStyle = '';
    pageEl.textContent     = data.pageRef;
    pageSubEl.textContent  = 'suggested starting page';
  } else {
    pageEl.style.fontSize  = '20px';
    pageEl.style.fontStyle = 'italic';
    pageEl.textContent     = data.pageRef;
    pageSubEl.textContent  = 'open here and let the page find you';
  }

  const badgeEl = document.getElementById('rev-format-badge');
  badgeEl.textContent = formatLabel(data.format);
  badgeEl.className   = `badge b-format-${data.format || 'print'}`;

  const audibleEl = document.getElementById('rev-audible');
  if (data.format === 'audio') {
    const q = encodeURIComponent((data.title || '') + ' ' + (data.author || ''));
    audibleEl.href         = `https://www.audible.com/search?keywords=${q}&tag=therightchap-20`;
    audibleEl.style.display = 'block';
  } else {
    audibleEl.style.display = 'none';
  }

  const markBtn = document.getElementById('rev-mark-btn');
  const doneEl  = document.getElementById('rev-done');
  if (appState.markedDates && appState.markedDates.includes(today())) {
    markBtn.textContent = 'Read today ✓';
    markBtn.classList.add('done');
    doneEl.style.display = 'inline';
  } else {
    markBtn.textContent = 'Mark read today';
    markBtn.classList.remove('done');
    doneEl.style.display = 'none';
  }

  document.getElementById('r-text').value         = '';
  document.getElementById('saved-ok').style.display = 'none';

  /* ── Sample mode UI adjustments ── */
  const samplePrompt  = document.getElementById('sample-shelf-prompt');
  const editShelfBtn  = document.getElementById('reveal-edit-shelf-btn');

  if (isSampleMode) {
    /* Show the "make it yours" prompt */
    if (samplePrompt)  samplePrompt.style.display = 'block';
    /* Relabel "Edit my shelf" → "Build my shelf" */
    if (editShelfBtn)  editShelfBtn.textContent = 'Build my shelf';
  } else {
    /* Hide the sample prompt */
    if (samplePrompt)  samplePrompt.style.display = 'none';
    /* Restore original label */
    if (editShelfBtn)  editShelfBtn.textContent = 'Edit my shelf';
  }

  showScreen('screen-reveal');
}

/* ═══════════════════════════════════════════
   MARK READ
═══════════════════════════════════════════ */
function markRead() {
  const td = today();
  if (appState.markedDates.includes(td)) return;
  appState.markedDates.push(td);

  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  const yStr = yest.toISOString().split('T')[0];

  if (appState.lastDate === yStr) {
    appState.streak++;
  } else if (appState.lastDate !== td) {
    appState.streak = 1;
  }
  appState.lastDate = td;

  saveState();
  renderStats();

  document.getElementById('rev-mark-btn').textContent = 'Read today ✓';
  document.getElementById('rev-mark-btn').classList.add('done');
  document.getElementById('rev-done').style.display   = 'inline';
}

/* ═══════════════════════════════════════════
   SAVE REFLECTION
═══════════════════════════════════════════ */
function saveReflect() {
  const val = document.getElementById('r-text').value.trim();
  if (!val) return;
  appState.reflections[today()] = val;
  saveState();
  const ok = document.getElementById('saved-ok');
  ok.style.display = 'inline';
  setTimeout(() => { ok.style.display = 'none'; }, 2200);
}

/* ═══════════════════════════════════════════
   SESSION LOG (personal sessions only)
═══════════════════════════════════════════ */
function logSession(data) {
  const now = new Date();
  const td  = today();

  if (appState.lastDate !== td) {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yStr = yest.toISOString().split('T')[0];
    if (appState.lastDate !== yStr) {
      appState.streak = Math.max(appState.streak, 1);
    }
    appState.lastDate = td;
  }

  appState.sessions++;
  appState.mins += 10;

  appState.log.unshift({
    date:    now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    time:    now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    title:   data.title,
    author:  data.author,
    pageRef: data.pageRef,
    marked:  false
  });

  if (appState.log.length > 30) appState.log.pop();
  saveState();
}

/* ═══════════════════════════════════════════
   STATS
═══════════════════════════════════════════ */
function renderStats() {
  const streak = document.getElementById('s-streak');
  const sess   = document.getElementById('s-sess');
  const mins   = document.getElementById('s-mins');
  if (streak) streak.textContent = appState.streak   || 0;
  if (sess)   sess.textContent   = appState.sessions || 0;
  if (mins)   mins.textContent   = appState.mins     || 0;
}

function showStats(show) {
  const el = document.getElementById('oracle-stats');
  if (el) el.style.display = show ? 'grid' : 'none';
}

/* ═══════════════════════════════════════════
   LOCAL STORAGE
═══════════════════════════════════════════ */
function loadLibrary() {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) { return null; }
}

function saveLibrary(books) {
  const lib = {
    version:   2,
    createdAt: (library && library.createdAt) ? library.createdAt : today(),
    books
  };
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(lib));
  library = lib;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    const defaults = {
      streak: 0, sessions: 0, mins: 0,
      lastDate: null, markedDates: [], log: [], reflections: {}
    };
    return raw ? Object.assign(defaults, JSON.parse(raw)) : defaults;
  } catch (_) {
    return { streak: 0, sessions: 0, mins: 0, lastDate: null, markedDates: [], log: [], reflections: {} };
  }
}

function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(appState));
}

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
function today() {
  return new Date().toISOString().split('T')[0];
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}

function formatLabel(fmt) {
  const map = { print: '📖 Print', audio: '🎧 Audio', ebook: '📱 eBook' };
  return map[fmt] || '📖 Print';
}
