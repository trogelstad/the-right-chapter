/* ═══════════════════════════════════════════
   The Right Chapter — script.js  v5
   All features: time selector, voice-to-text,
   sample mode, journal accordion, fixed streak
═══════════════════════════════════════════ */
'use strict';

const LIBRARY_KEY = 'trc_library';
const STATE_KEY   = 'trc_state';

/* ══════════════════════════════════════════
   SAMPLE SHELF — 18-book curated starter
   Swap or expand this array anytime.
══════════════════════════════════════════ */
const SAMPLE_SHELF = [
  { id: 'sample-01', title: 'Daily Reflections',                author: 'Alcoholics Anonymous', format: 'print', pages: 400, addedAt: 'sample' },
  { id: 'sample-02', title: 'The Four Agreements',              author: 'Don Miguel Ruiz',       format: 'print', pages: 160, addedAt: 'sample' },
  { id: 'sample-03', title: 'The Alchemist',                    author: 'Paulo Coelho',          format: 'print', pages: 208, addedAt: 'sample' },
  { id: 'sample-04', title: 'Alcoholics Anonymous',             author: 'Alcoholics Anonymous', format: 'print', pages: 575, addedAt: 'sample' },
  { id: 'sample-05', title: 'Becoming Supernatural',            author: 'Dr. Joe Dispenza',      format: 'print', pages: 380, addedAt: 'sample' },
  { id: 'sample-06', title: 'Alcohol Explained',                author: 'William Porter',        format: 'print', pages: 200, addedAt: 'sample' },
  { id: 'sample-07', title: 'This Naked Mind',                  author: 'Annie Grace',           format: 'print', pages: 260, addedAt: 'sample' },
  { id: 'sample-08', title: 'Quit Drinking Without Willpower',  author: 'Allen Carr',            format: 'print', pages: 288, addedAt: 'sample' },
  { id: 'sample-09', title: 'Quantum Success',                  author: 'Sandra Anne Taylor',    format: 'print', pages: 256, addedAt: 'sample' },
  { id: 'sample-10', title: 'Twelve Steps and Twelve Traditions', author: 'Alcoholics Anonymous', format: 'print', pages: 192, addedAt: 'sample' },
  { id: 'sample-11', title: 'The Road Less Traveled',           author: 'M. Scott Peck',         format: 'print', pages: 316, addedAt: 'sample' },
  { id: 'sample-12', title: 'Living Sober',                     author: 'Alcoholics Anonymous', format: 'print', pages: 120, addedAt: 'sample' },
  { id: 'sample-13', title: 'The Automatic Millionaire',        author: 'David Bach',            format: 'print', pages: 240, addedAt: 'sample' },
  { id: 'sample-14', title: 'The Energy of Money',              author: 'Maria Nemeth Ph.D.',    format: 'print', pages: 304, addedAt: 'sample' },
  { id: 'sample-15', title: 'The Red Road to Wellbriety',       author: 'White Bison Inc.',      format: 'print', pages: 200, addedAt: 'sample' },
  { id: 'sample-16', title: 'The Holy Bible',                   author: 'Various',               format: 'print', pages: 1200, addedAt: 'sample' },
  { id: 'sample-17', title: 'Atomic Habits',                    author: 'James Clear',           format: 'print', pages: 320, addedAt: 'sample' },
  { id: 'sample-18', title: 'The Energy of Money',              author: 'Maria Nemeth Ph.D.',    format: 'print', pages: 304, addedAt: 'sample' },
];

/* ── App state ── */
let library          = null;
let appState         = null;
let editReturnScreen = 'screen-oracle';
let currentReveal        = null;   /* Tracks the current oracle result for journal */
let isSampleMode         = false;  /* True when using sample shelf, no localStorage writes */
let selectedMins         = 10;     /* Reading time selected by user — default 10 min */
let currentSessionMarked = false;  /* Resets each new oracle result — allows marking each session */

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
   Desktop only — mobile OS keyboard has its
   own built-in mic, no button needed there.
   Stops after 4 seconds of silence.
═══════════════════════════════════════════ */
function initVoiceInput(textareaId) {
  /* ── Mobile detection — skip on phones/tablets, OS keyboard handles mic there ── */
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) return;

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return; /* Browser doesn't support Speech API */

  const textarea = document.getElementById(textareaId);
  if (!textarea) return;

  const wrap = textarea.closest('.oracle-input-wrap');
  if (!wrap) return;

  /* Create the mic button */
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mic-btn';
  btn.setAttribute('aria-label', 'Start voice input');
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`;
  wrap.appendChild(btn);

  const recognition = new SR();
  recognition.continuous     = true;   /* Keep listening — we control stop via timer */
  recognition.interimResults = true;
  recognition.lang           = 'en-US';

  let listening     = false;
  let silenceTimer  = null;
  const SILENCE_MS  = 4000; /* Stop after 4 seconds of silence */

  function resetSilenceTimer() {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      if (listening) recognition.stop();
    }, SILENCE_MS);
  }

  function clearSilenceTimer() {
    if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
  }

  btn.addEventListener('click', () => {
    if (listening) { recognition.stop(); return; }
    try { recognition.start(); } catch (e) { /* Already running */ }
  });

  recognition.onstart = () => {
    listening = true;
    btn.classList.add('listening');
    btn.setAttribute('aria-label', 'Stop recording');
    resetSilenceTimer(); /* Begin 4-second countdown immediately */
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
    resetSilenceTimer(); /* Reset the 4-second timer every time speech is detected */
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
    const books = collectBooks('book-rows');
    if (books.length < 3) return;
    saveLibrary(books);
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

  /* REVEAL — ask again: clears input, resets mark-read button, back to oracle */
  document.getElementById('ask-again-btn').addEventListener('click', () => {
    document.getElementById('oracle-input').value    = '';
    document.getElementById('char-count').textContent = '';
    /* Force-reset mark-read button for the new session */
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
  updateOracleShelfLabel();
  renderStats();
  showScreen('screen-oracle');
}

function exitSampleMode() {
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

  /* Use sample shelf or personal shelf */
  const books = isSampleMode ? SAMPLE_SHELF : (loadLibrary()?.books || []);
  if (!books || !books.length) { showScreen('screen-shelf-setup'); return; }

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

    /* Always log sessions + minutes. logSession handles sample vs personal internally. */
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
  const books     = collectBooks(containerId);
  const count     = books.length;
  const progressEl = document.getElementById(progressId);
  const btnEl     = document.getElementById(btnId);
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
  const lib = loadLibrary();
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
    if (labelEl) labelEl.textContent    = 'Sample shelf — try the oracle';
    if (countEl) countEl.textContent    = SAMPLE_SHELF.length;
    if (editBtn) editBtn.style.display  = 'none';
    if (banner)  banner.style.display   = 'block';
  } else {
    const lib   = loadLibrary();
    const count = (lib && lib.books) ? lib.books.length : 0;
    if (labelEl) labelEl.textContent    = 'The right chapter, right now.';
    if (countEl) countEl.textContent    = count;
    if (editBtn) editBtn.style.display  = '';
    if (banner)  banner.style.display   = 'none';
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
   Splits oracleMessage into pull quote + body.
   Populates pageWhy, afterReading, reflectionPrompt.
   Mark-read always resets on new reveal.
═══════════════════════════════════════════ */
function renderReveal(data) {
  /* ── Oracle message — split into pull quote + body text ── */
  const fullMsg   = data.oracleMessage || '';
  const sentences = fullMsg.match(/[^.!?]+[.!?]+/g) || [fullMsg];
  const pullText  = sentences.slice(0, 2).join(' ').trim();
  const bodyText  = sentences.slice(2).join(' ').trim();
  const msgEl     = document.getElementById('rev-oracle-msg');
  if (msgEl) {
    msgEl.innerHTML = `<p class="oracle-pull">${escHtml(pullText)}</p>` +
      (bodyText ? `<p class="oracle-body">${escHtml(bodyText)}</p>` : '');
  }

  /* ── Book ── */
  document.getElementById('rev-title').textContent  = data.title  || '';
  document.getElementById('rev-author').textContent = data.author || '';

  /* ── Format badge ── */
  const badgeEl = document.getElementById('rev-format-badge');
  badgeEl.textContent = formatLabel(data.format);
  badgeEl.className   = `badge b-format-${data.format || 'print'}`;

  /* ── Reading time badge ── */
  const timeBadge = document.getElementById('rev-time-badge');
  if (timeBadge) {
    timeBadge.textContent = `${selectedMins} min session`;
    timeBadge.className   = 'badge b-time';
  }

  /* ── Page reference ── */
  document.getElementById('rev-page').textContent = data.pageRef || '';

  /* ── Why this page ── */
  const whyEl = document.getElementById('rev-page-why');
  if (whyEl) whyEl.textContent = data.pageWhy || '';

  /* ── After reading nudge ── */
  const afterEl      = document.getElementById('rev-after-reading');
  const afterBlockEl = document.getElementById('rev-after-reading-block');
  if (afterEl && data.afterReading) {
    afterEl.textContent          = data.afterReading;
    afterBlockEl.style.display   = 'block';
  } else if (afterBlockEl) {
    afterBlockEl.style.display = 'none';
  }

  /* ── Custom reflection prompt ── */
  const promptEl = document.getElementById('rev-reflection-prompt');
  if (promptEl) {
    promptEl.textContent = data.reflectionPrompt || 'What does this bring up for you?';
  }

  /* ── Audible link ── */
  const audibleEl = document.getElementById('rev-audible');
  if (data.format === 'audio') {
    const q = encodeURIComponent((data.title || '') + ' ' + (data.author || ''));
    audibleEl.href         = `https://www.audible.com/search?keywords=${q}&tag=therightchap-20`;
    audibleEl.style.display = 'block';
  } else {
    audibleEl.style.display = 'none';
  }

  /* ── Mark read — always reset on new session ── */
  currentSessionMarked    = false;  /* New chapter = fresh mark opportunity */
  const markBtn = document.getElementById('rev-mark-btn');
  const doneEl  = document.getElementById('rev-done');
  markBtn.textContent = 'Mark read today';
  markBtn.classList.remove('done');
  doneEl.style.display = 'none';

  /* ── Sample upgrade prompt ── */
  const upgradeEl = document.getElementById('sample-upgrade');
  if (upgradeEl) upgradeEl.style.display = isSampleMode ? 'block' : 'none';

  /* ── Clear reflection textarea ── */
  document.getElementById('r-text').value          = '';
  document.getElementById('saved-ok').style.display = 'none';

  /* ── Render journal ── */
  renderJournal();

  showScreen('screen-reveal');
}

/* ═══════════════════════════════════════════
   MARK READ
   currentSessionMarked gates the button per
   oracle session — resets in renderReveal.
   markedDates still tracks dates for streak
   but no longer blocks the button.
═══════════════════════════════════════════ */
function markRead() {
  if (currentSessionMarked) return; /* Already marked this session */
  currentSessionMarked = true;

  const td = today();

  /* Only update streak logic on the first mark of the day */
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
   SAVE REFLECTION
   Stores as timestamped object with book,
   page, and prompt — never overwrites.
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

  document.getElementById('r-text').value = '';
  const ok = document.getElementById('saved-ok');
  ok.style.display = 'inline';
  setTimeout(() => { ok.style.display = 'none'; }, 2200);

  renderJournal();
}

/* ═══════════════════════════════════════════
   JOURNAL ACCORDION
   Supports both old format (date → string)
   and new format (timestamp → object).
   Shows: date, book + page, prompt, reflection.
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
    .sort((a, b) => b.key.localeCompare(a.key)); /* Newest first */

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
      <div class="accordion-entry">
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

/* ═══════════════════════════════════════════
   SESSION LOG
   Sessions + minutes always count (personal
   and sample mode). Streak and log only update
   for personal shelf sessions.
   renderStats() called immediately so numbers
   update without needing to navigate away.
═══════════════════════════════════════════ */
function logSession(data) {
  const now = new Date();
  const td  = today();

  /* Always increment — every "Find my chapter" press counts */
  appState.sessions++;
  appState.mins += selectedMins;

  /* Streak and log only for personal shelf */
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
  renderStats(); /* Update immediately — don't wait for Ask Again */
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
