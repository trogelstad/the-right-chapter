/* ═══════════════════════════════════════════
   The Right Chapter — script.js  v5
   All features: time selector, voice-to-text,
   sample mode, journal accordion, fixed streak,
   full analytics tracking
═══════════════════════════════════════════ */
'use strict';

const LIBRARY_KEY = 'trc_library';
const STATE_KEY   = 'trc_state';

/* ══════════════════════════════════════════
   SAMPLE SHELF — 18-book curated starter
══════════════════════════════════════════ */
const SAMPLE_SHELF = [
  { id: 'sample-01', title: 'Daily Reflections',                author: 'Alcoholics Anonymous', format: 'print', pages: 400,  addedAt: 'sample' },
  { id: 'sample-02', title: 'The Four Agreements',              author: 'Don Miguel Ruiz',       format: 'print', pages: 160,  addedAt: 'sample' },
  { id: 'sample-03', title: 'The Alchemist',                    author: 'Paulo Coelho',          format: 'print', pages: 208,  addedAt: 'sample' },
  { id: 'sample-04', title: 'Alcoholics Anonymous',             author: 'Alcoholics Anonymous',  format: 'print', pages: 575,  addedAt: 'sample' },
  { id: 'sample-05', title: 'Becoming Supernatural',            author: 'Dr. Joe Dispenza',      format: 'print', pages: 380,  addedAt: 'sample' },
  { id: 'sample-06', title: 'Alcohol Explained',                author: 'William Porter',        format: 'print', pages: 200,  addedAt: 'sample' },
  { id: 'sample-07', title: 'This Naked Mind',                  author: 'Annie Grace',           format: 'print', pages: 260,  addedAt: 'sample' },
  { id: 'sample-08', title: 'Quit Drinking Without Willpower',  author: 'Allen Carr',            format: 'print', pages: 288,  addedAt: 'sample' },
  { id: 'sample-09', title: 'Quantum Success',                  author: 'Sandra Anne Taylor',    format: 'print', pages: 256,  addedAt: 'sample' },
  { id: 'sample-10', title: 'Twelve Steps and Twelve Traditions', author: 'Alcoholics Anonymous', format: 'print', pages: 192, addedAt: 'sample' },
  { id: 'sample-11', title: 'The Road Less Traveled',           author: 'M. Scott Peck',         format: 'print', pages: 316,  addedAt: 'sample' },
  { id: 'sample-12', title: 'Living Sober',                     author: 'Alcoholics Anonymous',  format: 'print', pages: 120,  addedAt: 'sample' },
  { id: 'sample-13', title: 'The Automatic Millionaire',        author: 'David Bach',            format: 'print', pages: 240,  addedAt: 'sample' },
  { id: 'sample-14', title: 'The Energy of Money',              author: 'Maria Nemeth Ph.D.',    format: 'print', pages: 304,  addedAt: 'sample' },
  { id: 'sample-15', title: 'The Red Road to Wellbriety',       author: 'White Bison Inc.',      format: 'print', pages: 200,  addedAt: 'sample' },
  { id: 'sample-16', title: 'The Holy Bible',                   author: 'Various',               format: 'print', pages: 1200, addedAt: 'sample' },
  { id: 'sample-17', title: 'Atomic Habits',                    author: 'James Clear',           format: 'print', pages: 320,  addedAt: 'sample' },
  { id: 'sample-18', title: 'The Energy of Money',              author: 'Maria Nemeth Ph.D.',    format: 'print', pages: 304,  addedAt: 'sample' },
];

/* ═══════════════════════════════════════════
   ANALYTICS — dataLayer push helper
   Sends events to GTM → GA4.
   Fails silently if GTM isn't loaded.
═══════════════════════════════════════════ */
function track(eventName, params = {}) {
  try {
    /* Push to dataLayer for GTM */
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...params });
    /* Also call gtag() directly — works with Google Tag setup in GTM */
    if (typeof gtag === 'function') {
      gtag('event', eventName, params);
    }
  } catch (_) { /* Never let tracking break the app */ }
}

/* ── App state ── */
let library          = null;
let appState         = null;
let editReturnScreen = 'screen-oracle';
let currentReveal        = null;
let isSampleMode         = false;
let selectedMins         = 10;
let currentSessionMarked = false;

/* ═══════════════════════════════════════════
   THEME TOGGLE
   Reads saved preference from localStorage.
   Falls back to OS preference if none saved.
   Saves choice so it persists across sessions.
═══════════════════════════════════════════ */
function initTheme() {
  const saved = localStorage.getItem('trc_theme'); /* 'light' | 'dark' | null */
  const btn   = document.getElementById('theme-toggle');

  function applyTheme(mode) {
    document.documentElement.classList.remove('force-light', 'force-dark');
    if (mode === 'light') {
      document.documentElement.classList.add('force-light');
      if (btn) btn.textContent = '🌙';
    } else if (mode === 'dark') {
      document.documentElement.classList.add('force-dark');
      if (btn) btn.textContent = '☀️';
    } else {
      /* No preference saved — follow OS, set icon based on current appearance */
      const osDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (btn) btn.textContent = osDark ? '☀️' : '🌙';
    }
  }

  applyTheme(saved);

  if (btn) {
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('force-dark')
        || (!document.documentElement.classList.contains('force-light')
            && window.matchMedia('(prefers-color-scheme: dark)').matches);

      const next = isDark ? 'light' : 'dark';
      localStorage.setItem('trc_theme', next);
      applyTheme(next);
      track('theme_toggle', { mode: next });
    });
  }
}

/* ═══════════════════════════════════════════
   SCREEN ROUTER
═══════════════════════════════════════════ */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
  const target = document.getElementById(id);
  if (target) { target.style.display = 'block'; window.scrollTo(0, 0); }
}

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  library  = loadLibrary();
  appState = loadState();
  initTheme();
  wireButtons();
  initVoiceInput('oracle-input');
  initVoiceInput('r-text');

  if (library && library.books && library.books.length >= 3) {
    updateOracleShelfLabel();
    renderStats();
    showScreen('screen-oracle');
  } else if (library && library.books && library.books.length > 0) {
    initShelfSetup(library.books);
    showScreen('screen-shelf-setup');
  } else {
    showScreen('screen-landing');
  }
});

/* ═══════════════════════════════════════════
   VOICE-TO-TEXT (Web Speech API)
   Desktop only — mobile OS keyboard handles mic.
   Stops after 4 seconds of silence.
═══════════════════════════════════════════ */
function initVoiceInput(textareaId) {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) return;

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;

  const textarea = document.getElementById(textareaId);
  if (!textarea) return;

  const wrap = textarea.closest('.oracle-input-wrap');
  if (!wrap) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mic-btn';
  btn.setAttribute('aria-label', 'Start voice input');
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`;
  wrap.appendChild(btn);

  const recognition = new SR();
  recognition.continuous     = true;
  recognition.interimResults = true;
  recognition.lang           = 'en-US';

  let listening    = false;
  let silenceTimer = null;
  const SILENCE_MS = 4000;

  function resetSilenceTimer() {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => { if (listening) recognition.stop(); }, SILENCE_MS);
  }
  function clearSilenceTimer() {
    if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
  }

  btn.addEventListener('click', () => {
    if (listening) { recognition.stop(); return; }
    try { recognition.start(); } catch (e) {}
  });

  recognition.onstart = () => {
    listening = true;
    btn.classList.add('listening');
    btn.setAttribute('aria-label', 'Stop recording');
    resetSilenceTimer();
  };
  recognition.onend = () => {
    listening = false;
    btn.classList.remove('listening');
    btn.setAttribute('aria-label', 'Start voice input');
    clearSilenceTimer();
  };
  recognition.onerror = () => {
    listening = false;
    btn.classList.remove('listening');
    clearSilenceTimer();
  };
  recognition.onresult = e => {
    let transcript = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript;
    }
    textarea.value = transcript;
    textarea.dispatchEvent(new Event('input'));
    resetSilenceTimer();
  };
}

/* ═══════════════════════════════════════════
   WIRE ALL BUTTONS
═══════════════════════════════════════════ */
function wireButtons() {

  /* LANDING */
  document.getElementById('landing-cta').addEventListener('click', () => {
    initShelfSetup([]);
    showScreen('screen-shelf-setup');
  });
  document.getElementById('sample-cta').addEventListener('click', enterSampleMode);

  /* SHELF SETUP */
  document.getElementById('add-book-btn').addEventListener('click', () => addBookRow('book-rows', onShelfRowChange));

  document.getElementById('shelf-confirm-btn').addEventListener('click', () => {
    const books   = collectBooks('book-rows');
    if (books.length < 3) return;
    const isFirst = !loadLibrary();
    saveLibrary(books);
    if (isFirst) track('shelf_created', { book_count: books.length });
    renderShelfDisplay(books, 'shelf-display');
    showScreen('screen-shelf-confirm');
  });

  /* SHELF CONFIRM */
  document.getElementById('confirm-oracle-btn').addEventListener('click', () => {
    updateOracleShelfLabel();
    renderStats();
    showScreen('screen-oracle');
  });
  document.getElementById('confirm-edit-btn').addEventListener('click', () => {
    editReturnScreen = 'screen-shelf-confirm';
    initEditShelf();
    showScreen('screen-edit-shelf');
  });

  /* ORACLE INTAKE */
  document.getElementById('oracle-input').addEventListener('input', onOracleInputChange);
  document.getElementById('oracle-submit-btn').addEventListener('click', submitToOracle);
  document.getElementById('oracle-edit-shelf-btn').addEventListener('click', () => {
    editReturnScreen = 'screen-oracle';
    initEditShelf();
    showScreen('screen-edit-shelf');
  });

  /* TIME SELECTOR */
  document.getElementById('time-pills').addEventListener('click', e => {
    const pill = e.target.closest('.time-pill');
    if (!pill) return;
    document.querySelectorAll('.time-pill').forEach(p => p.classList.remove('on'));
    pill.classList.add('on');
    selectedMins = parseInt(pill.dataset.mins, 10);
  });

  /* SAMPLE MODE */
  document.getElementById('sample-add-shelf-btn').addEventListener('click', exitSampleMode);
  document.getElementById('sample-upgrade-btn').addEventListener('click', exitSampleMode);

  /* REVEAL — mark read */
  document.getElementById('rev-mark-btn').addEventListener('click', markRead);

  /* REVEAL — ask again */
  document.getElementById('ask-again-btn').addEventListener('click', () => {
    track('ask_again', { book_title: currentReveal ? currentReveal.title : '' });
    document.getElementById('oracle-input').value     = '';
    document.getElementById('char-count').textContent  = '';
    const markBtn = document.getElementById('rev-mark-btn');
    const doneEl  = document.getElementById('rev-done');
    if (markBtn) { markBtn.textContent = 'Mark read today'; markBtn.classList.remove('done'); }
    if (doneEl)  { doneEl.style.display = 'none'; }
    updateOracleShelfLabel();
    renderStats();
    showScreen('screen-oracle');
  });

  /* REVEAL — reflection */
  document.getElementById('save-reflect-btn').addEventListener('click', saveReflect);

  /* REVEAL — share buttons */
  document.getElementById('share-copy').addEventListener('click',     () => shareReveal('copy'));
  document.getElementById('share-sms').addEventListener('click',      () => shareReveal('sms'));
  document.getElementById('share-whatsapp').addEventListener('click', () => shareReveal('whatsapp'));
  document.getElementById('share-facebook').addEventListener('click', () => shareReveal('facebook'));
  document.getElementById('share-twitter').addEventListener('click',  () => shareReveal('twitter'));

  /* REVEAL — edit shelf */
  document.getElementById('reveal-edit-shelf-btn').addEventListener('click', () => {
    editReturnScreen = 'screen-reveal';
    initEditShelf();
    showScreen('screen-edit-shelf');
  });

  /* EDIT SHELF */
  document.getElementById('edit-add-book-btn').addEventListener('click', () => addBookRow('edit-book-rows', onEditRowChange));
  document.getElementById('edit-save-btn').addEventListener('click', () => {
    const books = collectBooks('edit-book-rows');
    if (books.length < 3) return;
    saveLibrary(books);
    library = loadLibrary();
    updateOracleShelfLabel();
    showScreen(editReturnScreen);
  });
  document.getElementById('edit-cancel-btn').addEventListener('click', () => showScreen(editReturnScreen));
}

/* ═══════════════════════════════════════════
   SAMPLE MODE
═══════════════════════════════════════════ */
function enterSampleMode() {
  isSampleMode = true;
  track('sample_shelf_used');
  updateOracleShelfLabel();
  renderStats();
  showScreen('screen-oracle');
}

function exitSampleMode() {
  track('upgrade_cta_clicked');
  isSampleMode = false;
  initShelfSetup([]);
  showScreen('screen-shelf-setup');
}

/* ═══════════════════════════════════════════
   ORACLE
═══════════════════════════════════════════ */
async function submitToOracle() {
  const input = document.getElementById('oracle-input').value.trim();
  if (input.length < 5) return;

  const books = isSampleMode ? SAMPLE_SHELF : (loadLibrary()?.books || []);
  if (!books || !books.length) { showScreen('screen-shelf-setup'); return; }

  /* Track every oracle query */
  track('oracle_query', {
    reading_time: selectedMins,
    shelf_type:   isSampleMode ? 'sample' : 'personal'
  });

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
      console.error('Oracle error:', await response.json().catch(() => ({})));
      showOracleError();
      return;
    }

    const data = await response.json();
    currentReveal = data;

    /* Track what the oracle matched */
    track('oracle_result', {
      book_title:  data.title   || '',
      book_author: data.author  || '',
      page_ref:    data.pageRef || '',
      shelf_type:  isSampleMode ? 'sample' : 'personal'
    });

    logSession(data);
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
      <input type="text" class="book-title-input" placeholder="Book title"
        value="${escHtml(prefill.title || '')}" aria-label="Book title" autocomplete="off" />
      <input type="text" class="book-author-input" placeholder="Author"
        value="${escHtml(prefill.author || '')}" aria-label="Author name" autocomplete="off" />
    </div>
    <div class="book-row-meta">
      <div class="format-pills" role="group" aria-label="Format">
        <button type="button" class="fmt-pill ${fmt==='print'?'on':''}" data-fmt="print">📖 Print</button>
        <button type="button" class="fmt-pill ${fmt==='audio'?'on':''}" data-fmt="audio">🎧 Audio</button>
        <button type="button" class="fmt-pill ${fmt==='ebook'?'on':''}" data-fmt="ebook">📱 eBook</button>
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
  row.querySelector('.remove-book-btn').addEventListener('click', () => { row.remove(); onChange(); });
  row.querySelectorAll('input').forEach(inp => inp.addEventListener('input', onChange));
  container.appendChild(row);
  onChange();
  if (!prefill.title) row.querySelector('.book-title-input').focus();
}

function collectBooks(containerId) {
  const rows  = document.querySelectorAll(`#${containerId} .book-row`);
  const books = [];
  rows.forEach(row => {
    const title  = row.querySelector('.book-title-input').value.trim();
    const author = row.querySelector('.book-author-input').value.trim();
    const fmtBtn = row.querySelector('.fmt-pill.on');
    const format = fmtBtn ? fmtBtn.dataset.fmt : 'print';
    if (title && author) {
      books.push({ id: String(Date.now() + Math.random()), title, author, format, pages: null, addedAt: today() });
    }
  });
  return books;
}

function onShelfRowChange() { updateShelfProgress('book-rows', 'shelf-progress', 'shelf-confirm-btn'); }
function onEditRowChange()  { updateShelfProgress('edit-book-rows', 'edit-shelf-progress', 'edit-save-btn'); }

function updateShelfProgress(containerId, progressId, btnId) {
  const books      = collectBooks(containerId);
  const count      = books.length;
  const progressEl = document.getElementById(progressId);
  const btnEl      = document.getElementById(btnId);
  if (count === 0) {
    progressEl.textContent = ''; progressEl.className = 'shelf-progress';
  } else if (count < 3) {
    progressEl.textContent = `${count} book${count>1?'s':''} added · need at least 3`;
    progressEl.className   = 'shelf-progress warn';
  } else {
    progressEl.textContent = `${count} book${count>1?'s':''} on your shelf ✓`;
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
   SHELF DISPLAY
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
  btn.disabled  = len < 5;
  if (len > 20) { counter.textContent = `${len} / 500`; counter.style.display = 'block'; }
  else { counter.style.display = 'none'; }
}

function updateOracleShelfLabel() {
  const labelEl = document.getElementById('oracle-shelf-label');
  const countEl = document.getElementById('oracle-shelf-count');
  const editBtn = document.getElementById('oracle-edit-shelf-btn');
  const banner  = document.getElementById('sample-banner');

  if (isSampleMode) {
    if (labelEl) labelEl.textContent   = 'Sample shelf — try the oracle';
    if (countEl) countEl.textContent   = SAMPLE_SHELF.length;
    if (editBtn) editBtn.style.display = 'none';
    if (banner)  banner.style.display  = 'block';
  } else {
    const lib   = loadLibrary();
    const count = (lib && lib.books) ? lib.books.length : 0;
    if (labelEl) labelEl.textContent   = 'The right chapter, right now.';
    if (countEl) countEl.textContent   = count;
    if (editBtn) editBtn.style.display = '';
    if (banner)  banner.style.display  = 'none';
  }
}

/* ═══════════════════════════════════════════
   LOADING STATE
═══════════════════════════════════════════ */
const LOADING_MESSAGES = [
  'Reading what you brought…',
  'Moving through your shelf…',
  'Something is aligning…',
  'Your chapter is close…',
  'Listening between the lines…',
  'The words are finding you…',
  'Your chapter is choosing itself…',
  'Something true is rising…'
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
      setTimeout(() => { msgEl.textContent = LOADING_MESSAGES[loadingIndex]; msgEl.style.opacity = '1'; }, 300);
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
  const fullMsg   = data.oracleMessage || '';
  const sentences = fullMsg.match(/[^.!?]+[.!?]+/g) || [fullMsg];
  const pullText  = sentences.slice(0, 2).join(' ').trim();
  const bodyText  = sentences.slice(2).join(' ').trim();
  const msgEl     = document.getElementById('rev-oracle-msg');
  if (msgEl) {
    msgEl.innerHTML = `<p class="oracle-pull">${escHtml(pullText)}</p>` +
      (bodyText ? `<p class="oracle-body">${escHtml(bodyText)}</p>` : '');
  }

  document.getElementById('rev-title').textContent  = data.title  || '';
  document.getElementById('rev-author').textContent = data.author || '';

  const badgeEl = document.getElementById('rev-format-badge');
  badgeEl.textContent = formatLabel(data.format);
  badgeEl.className   = `badge b-format-${data.format || 'print'}`;

  const timeBadge = document.getElementById('rev-time-badge');
  if (timeBadge) {
    timeBadge.textContent = `${selectedMins} min session`;
    timeBadge.className   = 'badge b-time';
  }

  document.getElementById('rev-page').textContent = data.pageRef || '';

  const whyEl = document.getElementById('rev-page-why');
  if (whyEl) whyEl.textContent = data.pageWhy || '';

  const afterEl      = document.getElementById('rev-after-reading');
  const afterBlockEl = document.getElementById('rev-after-reading-block');
  if (afterEl && data.afterReading) {
    afterEl.textContent        = data.afterReading;
    afterBlockEl.style.display = 'block';
  } else if (afterBlockEl) {
    afterBlockEl.style.display = 'none';
  }

  const promptEl = document.getElementById('rev-reflection-prompt');
  if (promptEl) {
    promptEl.textContent = data.reflectionPrompt || 'What does this bring up for you?';
  }

  /* Audible link + affiliate click tracking */
  const audibleEl = document.getElementById('rev-audible');
  if (data.format === 'audio') {
    const q = encodeURIComponent((data.title || '') + ' ' + (data.author || ''));
    audibleEl.href          = `https://www.audible.com/search?keywords=${q}&tag=therightchap-20`;
    audibleEl.style.display = 'block';
    audibleEl.onclick       = () => track('audible_click', {
      book_title:  data.title  || '',
      book_author: data.author || ''
    });
  } else {
    audibleEl.style.display = 'none';
  }

  /* Mark read — always reset on new session */
  currentSessionMarked    = false;
  const markBtn = document.getElementById('rev-mark-btn');
  const doneEl  = document.getElementById('rev-done');
  markBtn.textContent = 'Mark read today';
  markBtn.classList.remove('done');
  doneEl.style.display = 'none';

  const upgradeEl = document.getElementById('sample-upgrade');
  if (upgradeEl) upgradeEl.style.display = isSampleMode ? 'block' : 'none';

  document.getElementById('r-text').value           = '';
  document.getElementById('saved-ok').style.display  = 'none';

  renderJournal();
  showScreen('screen-reveal');
}

/* ═══════════════════════════════════════════
   MARK READ
═══════════════════════════════════════════ */
function markRead() {
  if (currentSessionMarked) return;
  currentSessionMarked = true;

  track('mark_read', {
    book_title:   currentReveal ? currentReveal.title : '',
    reading_time: selectedMins
  });

  const td = today();
  if (!appState.markedDates.includes(td)) {
    appState.markedDates.push(td);
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yStr = yest.toISOString().split('T')[0];
    if (appState.lastDate === yStr) { appState.streak++; }
    else if (appState.lastDate !== td) { appState.streak = 1; }
    appState.lastDate = td;
  }

  saveState();
  renderStats();
  document.getElementById('rev-mark-btn').textContent = 'Read today ✓';
  document.getElementById('rev-mark-btn').classList.add('done');
  document.getElementById('rev-done').style.display   = 'inline';
}

/* ═══════════════════════════════════════════
   SHARE
   Generates a personal share message using
   the current oracle result. Three channels:
   copy to clipboard, SMS, Twitter/X.
═══════════════════════════════════════════ */
function shareReveal(channel) {
  const title   = currentReveal ? currentReveal.title   : 'a book on my shelf';
  const pageRef = currentReveal ? currentReveal.pageRef : '';
  const page    = pageRef ? ` · ${pageRef}` : '';
  const text    = `The oracle sent me to ${title}${page}. Exactly what I needed today. therightchapter.com`;
  const url     = 'https://therightchapter.com';

  track('share', { channel, book_title: title });

  if (channel === 'copy') {
    navigator.clipboard.writeText(`${text}`).then(() => {
      const copied = document.getElementById('share-copied');
      copied.style.display = 'inline';
      setTimeout(() => { copied.style.display = 'none'; }, 2200);
    }).catch(() => {
      /* Fallback for older browsers */
      prompt('Copy this link:', text);
    });
  } else if (channel === 'sms') {
    const encoded = encodeURIComponent(text);
    window.open(`sms:?body=${encoded}`, '_blank');
  } else if (channel === 'whatsapp') {
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  } else if (channel === 'facebook') {
    const encoded = encodeURIComponent('https://therightchapter.com');
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encoded}`, '_blank');
  } else if (channel === 'twitter') {
    const encoded = encodeURIComponent(text);
    window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank');
  }
}

/* ═══════════════════════════════════════════
   SAVE REFLECTION
═══════════════════════════════════════════ */
function saveReflect() {
  const val = document.getElementById('r-text').value.trim();
  if (!val) return;

  const promptEl = document.getElementById('rev-reflection-prompt');
  const prompt   = promptEl ? promptEl.textContent.trim() : '';
  const key      = String(Date.now());
  const entry    = {
    date:    today(),
    text:    val,
    title:   currentReveal ? currentReveal.title   : '',
    pageRef: currentReveal ? currentReveal.pageRef : '',
    prompt:  prompt
  };

  if (!appState.reflections) appState.reflections = {};
  appState.reflections[key] = entry;
  saveState();

  track('reflection_saved', {
    book_title: currentReveal ? currentReveal.title : ''
  });

  document.getElementById('r-text').value = '';
  const ok = document.getElementById('saved-ok');
  ok.style.display = 'inline';
  setTimeout(() => { ok.style.display = 'none'; }, 2200);

  renderJournal();
}

/* ═══════════════════════════════════════════
   JOURNAL ACCORDION
═══════════════════════════════════════════ */
function renderJournal() {
  const el = document.getElementById('journal-list');
  if (!el) return;

  const raw     = appState.reflections || {};
  const entries = Object.entries(raw)
    .map(([key, val]) => {
      if (typeof val === 'string') {
        return { key, date: key, text: val, title: '', pageRef: '', prompt: '' };
      }
      return {
        key,
        date:    val.date    || key,
        text:    val.text    || '',
        title:   val.title   || '',
        pageRef: val.pageRef || '',
        prompt:  val.prompt  || ''
      };
    })
    .sort((a, b) => b.key.localeCompare(a.key));

  if (entries.length === 0) {
    el.innerHTML = '<p class="log-empty">No reflections yet. Save one above after your session.</p>';
    return;
  }

  el.innerHTML = entries.map(entry => {
    const label = new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
    const bookLine = entry.title
      ? `<span class="accordion-book">${escHtml(entry.title)}${entry.pageRef ? ' · ' + escHtml(entry.pageRef) : ''}</span>`
      : '';
    const promptLine = entry.prompt
      ? `<p class="journal-prompt">${escHtml(entry.prompt)}</p>`
      : '';
    return `
      <div class="accordion-entry" data-key="${escHtml(entry.key)}">
        <button type="button" class="accordion-header" aria-expanded="false" onclick="toggleAccordion(this)">
          <div class="accordion-meta">
            <span class="accordion-date">${label}</span>
            ${bookLine}
          </div>
          <span class="accordion-chevron">›</span>
        </button>
        <div class="accordion-body" hidden>
          ${promptLine}
          <p class="reflection-text">${escHtml(entry.text)}</p>
          <div class="journal-edit-wrap" style="display:none">
            <textarea class="journal-edit-textarea" aria-label="Edit reflection"></textarea>
            <div class="journal-edit-btns">
              <button type="button" class="save-btn" onclick="saveJournalEdit(this)">Save changes</button>
              <button type="button" class="journal-cancel-btn" onclick="cancelJournalEdit(this)">Cancel</button>
            </div>
          </div>
          <button type="button" class="journal-edit-btn" onclick="startJournalEdit(this)">Edit entry</button>
        </div>
      </div>
    `;
  }).join('');
}

function toggleAccordion(btn) {
  const body   = btn.nextElementSibling;
  const isOpen = !body.hidden;
  body.hidden  = isOpen;
  btn.setAttribute('aria-expanded', String(!isOpen));
  btn.classList.toggle('open', !isOpen);
}

function startJournalEdit(btn) {
  const body     = btn.closest('.accordion-body');
  const textEl   = body.querySelector('.reflection-text');
  const editWrap = body.querySelector('.journal-edit-wrap');
  const textarea = editWrap.querySelector('textarea');
  textarea.value         = textEl.textContent;
  textEl.style.display   = 'none';
  btn.style.display      = 'none';
  editWrap.style.display = 'block';
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);
}

function cancelJournalEdit(btn) {
  const body     = btn.closest('.accordion-body');
  const textEl   = body.querySelector('.reflection-text');
  const editWrap = body.querySelector('.journal-edit-wrap');
  const editBtn  = body.querySelector('.journal-edit-btn');
  textEl.style.display   = '';
  editWrap.style.display = 'none';
  editBtn.style.display  = '';
}

function saveJournalEdit(btn) {
  const entryEl  = btn.closest('.accordion-entry');
  const key      = entryEl.dataset.key;
  const textarea = btn.closest('.accordion-body').querySelector('.journal-edit-textarea');
  const newText  = textarea.value.trim();
  if (!newText) return;

  const existing = appState.reflections[key];
  appState.reflections[key] = (typeof existing === 'string')
    ? newText
    : { ...existing, text: newText };

  saveState();
  renderJournal();

  const updated = document.querySelector(`[data-key="${key}"]`);
  if (updated) {
    const header = updated.querySelector('.accordion-header');
    const body   = updated.querySelector('.accordion-body');
    if (header && body) {
      body.hidden = false;
      header.setAttribute('aria-expanded', 'true');
      header.classList.add('open');
    }
  }
}

/* ═══════════════════════════════════════════
   SESSION LOG
═══════════════════════════════════════════ */
function logSession(data) {
  const now = new Date();
  const td  = today();

  appState.sessions++;
  appState.mins += selectedMins;

  if (!isSampleMode) {
    if (appState.lastDate !== td) {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const yStr = yest.toISOString().split('T')[0];
      if (appState.lastDate === null) {
        appState.streak = 1;
      } else if (appState.lastDate === yStr) {
        appState.streak++;
      } else {
        appState.streak = 1;
      }
      appState.lastDate = td;
    }

    appState.log.unshift({
      date:    now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time:    now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      title:   data.title,
      author:  data.author,
      pageRef: data.pageRef,
      marked:  false
    });
    if (appState.log.length > 30) appState.log.pop();
  }

  saveState();
  renderStats();
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

/* ═══════════════════════════════════════════
   LOCAL STORAGE
═══════════════════════════════════════════ */
function loadLibrary() {
  try { const raw = localStorage.getItem(LIBRARY_KEY); if (!raw) return null; return JSON.parse(raw); }
  catch (_) { return null; }
}

function saveLibrary(books) {
  const lib = { version: 2, createdAt: (library && library.createdAt) ? library.createdAt : today(), books };
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(lib));
  library = lib;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    const def = { streak: 0, sessions: 0, mins: 0, lastDate: null, markedDates: [], log: [], reflections: {} };
    return raw ? Object.assign(def, JSON.parse(raw)) : def;
  } catch (_) {
    return { streak: 0, sessions: 0, mins: 0, lastDate: null, markedDates: [], log: [], reflections: {} };
  }
}

function saveState() { localStorage.setItem(STATE_KEY, JSON.stringify(appState)); }

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
function today() { return new Date().toISOString().split('T')[0]; }

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatLabel(fmt) {
  const map = { print: '📖 Print', audio: '🎧 Audio', ebook: '📱 eBook' };
  return map[fmt] || '📖 Print';
}
