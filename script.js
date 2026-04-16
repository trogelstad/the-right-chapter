/* The Right Chapter — script.js v8 */
'use strict';

/* ── State ── */
const STORAGE_KEY = 'the_right_chapter_v1';
let state = load();
let current = null;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const defaults = {
      streak: 0, sessions: 0, mins: 0,
      lastDate: null, markedDates: [], log: [], reflections: []
    };
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed) return defaults;
    // migrate old object-format reflections to array
    if (parsed.reflections && !Array.isArray(parsed.reflections)) {
      parsed.reflections = Object.entries(parsed.reflections).map(([date, entry]) => ({
        id:     date + '_migrated',
        date,
        time:   '',
        text:   typeof entry === 'string' ? entry : (entry.text || ''),
        book:   typeof entry === 'object' ? (entry.book   || null) : null,
        author: typeof entry === 'object' ? (entry.author || null) : null,
        page:   typeof entry === 'object' ? (entry.page   || null) : null,
      }));
    }
    return Object.assign(defaults, parsed);
  } catch (_) {
    return {
      streak: 0, sessions: 0, mins: 0,
      lastDate: null, markedDates: [], log: [], reflections: []
    };
  }
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
}

/* ── Helpers ── */
function today() { return new Date().toISOString().split('T')[0]; }

function getSelected(groupId) {
  const el = document.querySelector('#' + groupId + ' .pill.on');
  return el ? el.dataset.v : '10';
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* ── Pills ── */
function initPills() {
  document.querySelectorAll('.pills-inline').forEach(group => {
    group.addEventListener('click', e => {
      const pill = e.target.closest('.pill');
      if (!pill) return;
      group.querySelectorAll('.pill').forEach(p => p.classList.remove('on'));
      pill.classList.add('on');
    });
  });
}

/* ── Character counter ── */
function initCharCount() {
  const input = document.getElementById('oracle-input');
  const counter = document.getElementById('char-count');
  if (!input || !counter) return;
  input.addEventListener('input', () => {
    const remaining = 500 - input.value.length;
    counter.textContent = remaining;
    counter.style.color = remaining < 50 ? 'var(--brass)' : 'var(--ink-4)';
  });
}

/* ── Desktop mic only ── */
function initMic(micBtnId, inputId, listeningBarId) {
  const micBtn = document.getElementById(micBtnId);
  if (!micBtn) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    micBtn.style.display = 'none';
    return;
  }

  let silenceTimer   = null;
  let fullTranscript = '';
  let shouldListen   = false;
  let isActive       = false;
  let activeRecog    = null;
  const SILENCE_MS   = 9000;

  function showBar(show) {
    const bar = document.getElementById(listeningBarId);
    if (!bar) return;
    bar.classList.toggle('visible', show);
  }

  function updateField(text) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.value = text;
    if (inputId === 'oracle-input') {
      const counter = document.getElementById('char-count');
      if (counter) {
        const remaining = 500 - text.length;
        counter.textContent = remaining;
        counter.style.color = remaining < 50 ? 'var(--brass)' : 'var(--ink-4)';
      }
    }
  }

function resetSilenceTimer() {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      shouldListen = false;
      const r = activeRecog;
      activeRecog = null;
      try { if (r) r.stop(); } catch (_) {}
      // Delay hardStop slightly to let onend fire cleanly
      setTimeout(hardStop, 200);
    }, SILENCE_MS);
  }

  function clearSilenceTimer() {
    if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
  }

function hardStop() {
    shouldListen = false;
    isActive     = false;
    clearSilenceTimer();
    // Force UI update regardless of state
    try { micBtn.classList.remove('listening'); } catch (_) {}
    try { showBar(false); } catch (_) {}
    activeRecog = null;
  }

  function buildAndStart() {
    if (!shouldListen) { hardStop(); return; }

    const r = new SpeechRecognition();
    r.continuous      = false;
    r.interimResults  = true;
    r.lang            = 'en-US';
    r.maxAlternatives = 1;

    r.onstart = () => {
      isActive = true;
      micBtn.classList.add('listening');
      showBar(true);
      resetSilenceTimer();
    };

    r.onresult = (e) => {
      resetSilenceTimer();
      let finalChunk = '';
      let interimChunk = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalChunk += e.results[i][0].transcript;
        } else {
          interimChunk += e.results[i][0].transcript;
        }
      }
      if (finalChunk) {
        fullTranscript += (fullTranscript ? ' ' : '') + finalChunk.trim();
      }
      const display = fullTranscript + (interimChunk ? ' ' + interimChunk : '');
      if (display.trim()) updateField(display);
    };

    r.onerror = (e) => {
      if (e.error === 'not-allowed') {
        hardStop();
        alert('Microphone access was denied. Please allow it in your browser settings.');
      }
    };

    r.onend = () => {
      activeRecog = null;
      if (shouldListen) {
        setTimeout(() => {
          if (shouldListen) buildAndStart();
          else hardStop();
        }, 120);
      } else {
        hardStop();
      }
    };

    activeRecog = r;
    try {
      r.start();
    } catch (err) {
      activeRecog = null;
      setTimeout(() => {
        if (shouldListen) buildAndStart();
        else hardStop();
      }, 250);
    }
  }

  micBtn.addEventListener('click', () => {
    if (isActive || shouldListen) {
      // Toggle off — but preserve transcript so user can re-tap to continue
      shouldListen = false;
      try { if (activeRecog) activeRecog.stop(); } catch (_) {}
      setTimeout(hardStop, 150);
      return;
    }

    // Re-tap to continue: don't clear fullTranscript
    // Only clear if textarea is empty
    const inputEl = document.getElementById(inputId);
    if (!inputEl || !inputEl.value.trim()) {
      fullTranscript = '';
    } else {
      // Resume from current textarea value
      fullTranscript = inputEl.value.trim();
    }

    shouldListen = true;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => buildAndStart())
        .catch(() => {
          shouldListen = false;
          alert('Please allow microphone access to use voice input.');
        });
    } else {
      buildAndStart();
    }
  });
}

/* ── Oracle API call ── */
async function callOracle() {
  const input    = document.getElementById('oracle-input');
  const userText = input ? input.value.trim() : '';

  if (userText.length < 5) {
    if (input) {
      input.focus();
      input.style.borderColor = 'var(--brass)';
      setTimeout(() => { input.style.borderColor = ''; }, 2000);
    }
    return;
  }

  const btn     = document.getElementById('oracle-btn');
  const loading = document.getElementById('oracle-loading');
  const card    = document.getElementById('result-card');

  btn.disabled    = true;
  btn.textContent = 'Listening...';
  if (loading) loading.classList.add('visible');
  if (card)    card.classList.remove('visible');

  try {
    const response = await fetch('/api/oracle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput: userText })
    });

    const data = await response.json();

    if (!response.ok || !data.oracle) {
      throw new Error(data.error || 'The oracle is resting.');
    }

    const oracle = data.oracle;
    const time   = parseInt(getSelected('g-time') || '10', 10);

    current = {
      id:               uid(),
      title:            oracle.book,
      author:           oracle.author,
      page:             oracle.page,
      time,
      userInput:        userText,
      mirror:           oracle.mirror,
      name:             oracle.name,
      offering:         oracle.offering,
      whyThisFits:      oracle.whyThisFits,
      singleStep:       oracle.singleStep,
      reflectionPrompt: oracle.reflectionPrompt,
    };

    renderOracle(oracle, time);
    logSession();

  } catch (err) {
    console.error('Oracle error:', err);
    showError(err.message || 'Something went quiet. Please try again.');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Find my chapter';
    if (loading) loading.classList.remove('visible');
  }
}

/* ── Render oracle response ── */
function renderOracle(oracle, time) {
  document.getElementById('r-mirror').textContent   = oracle.mirror           || '';
  document.getElementById('r-name').textContent     = oracle.name             || '';
  document.getElementById('r-offering').textContent = oracle.offering         || '';
  document.getElementById('r-title').textContent    = oracle.book             || '';
  document.getElementById('r-author').textContent   = oracle.author           || '';
  document.getElementById('r-page').textContent     = oracle.page             || '';
  document.getElementById('r-time').textContent     = time + ' min session';
  document.getElementById('r-why').textContent      = oracle.whyThisFits      || '';
  document.getElementById('r-step').textContent     = oracle.singleStep       || '';
  document.getElementById('r-prompt').textContent   = oracle.reflectionPrompt || '';

  const td  = today();
  const btn = document.getElementById('mark-btn');
  const dne = document.getElementById('r-done');

  // Reset mark-read for new session
  btn.textContent = 'Mark read today';
  btn.classList.remove('done');
  dne.style.display = 'none';

  // Clear reflection textarea for new session
  const rText = document.getElementById('r-text');
  if (rText) rText.value = '';

  const card = document.getElementById('result-card');
  card.classList.add('visible');
  setTimeout(() => {
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

/* ── Error display ── */
function showError(message) {
  document.getElementById('r-mirror').textContent   = message;
  document.getElementById('r-name').textContent     = '';
  document.getElementById('r-offering').textContent = '';
  document.getElementById('r-title').textContent    = '';
  document.getElementById('r-author').textContent   = '';
  document.getElementById('r-page').textContent     = '';
  document.getElementById('r-time').textContent     = '';
  document.getElementById('r-why').textContent      = '';
  document.getElementById('r-step').textContent     = '';
  document.getElementById('result-card').classList.add('visible');
}

/* ── Mark read ── */
function markRead() {
  const td = today();
  if (!current) return;
  if (state.markedDates.includes(td)) {
    const btn = document.getElementById('mark-btn');
    btn.textContent = 'Read today ✓';
    btn.classList.add('done');
    document.getElementById('r-done').style.display = 'inline';
    return;
  }
  state.markedDates.push(td);

  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  const yStr = yest.toISOString().split('T')[0];

  if (state.lastDate === yStr) {
    state.streak++;
  } else if (state.lastDate !== td) {
    state.streak = 1;
  }
  state.lastDate = td;

  if (state.log.length) state.log[0].marked = true;

  save();
  renderStats();
  renderLog();

  const btn = document.getElementById('mark-btn');
  btn.textContent = 'Read today ✓';
  btn.classList.add('done');
  document.getElementById('r-done').style.display = 'inline';
}

/* ── Save reflection ── */
function saveReflect() {
  const val = document.getElementById('r-text').value.trim();
  if (!val) return;

  const now = new Date();

  // Each save creates a new entry tied to this session
  const entry = {
    id:     current ? current.id : uid(),
    date:   today(),
    time:   now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    text:   val,
    book:   current ? current.title  : null,
    author: current ? current.author : null,
    page:   current ? current.page   : null,
  };

  // Check if entry for this session already exists — update it
  const existing = state.reflections.findIndex(r => r.id === entry.id);
  if (existing >= 0) {
    state.reflections[existing] = entry;
  } else {
    state.reflections.unshift(entry);
  }

  // Keep max 50 reflections
  if (state.reflections.length > 50) state.reflections.pop();

  save();

  const ok = document.getElementById('saved-ok');
  ok.style.display = 'inline';
  setTimeout(() => { ok.style.display = 'none'; }, 2200);

  // Clear textarea after save
  document.getElementById('r-text').value = '';

  renderReflections();
}

/* ── Log session ── */
function logSession() {
  if (!current) return;
  const now = new Date();
  const td  = today();

  if (state.lastDate !== td) {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
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
    mins:   current.time,
    input:  current.userInput ? current.userInput.slice(0, 60) + '...' : '',
    marked: false,
  });

  if (state.log.length > 30) state.log.pop();

  save();
  renderStats();
  renderLog();
}

/* ── Render stats ── */
function renderStats() {
  document.getElementById('s-streak').textContent = state.streak;
  document.getElementById('s-sess').textContent   = state.sessions;
  document.getElementById('s-mins').textContent   = state.mins;
}

/* ── Render session log ── */
function renderLog() {
  const el = document.getElementById('log-list');
  if (!el) return;

  if (!state.log.length) {
    el.innerHTML = '<p class="log-empty">No sessions yet. Find your first chapter to begin.</p>';
    return;
  }

  el.innerHTML = state.log.slice(0, 10).map(e => `
    <div class="log-entry">
      <div class="log-book">${e.title}</div>
      ${e.input ? `<div class="log-input">"${e.input}"</div>` : ''}
      <div class="log-meta">
        <span>${e.date} &middot; ${e.time}</span>
        <span class="log-pill">p.${e.page}</span>
        <span>${e.mins} min</span>
        ${e.marked ? '<span class="log-pill green">read ✓</span>' : ''}
      </div>
    </div>
  `).join('');
}

/* ── Render reflection journal (accordion) ── */
function renderReflections() {
  const el = document.getElementById('reflection-list');
  if (!el) return;

  if (!state.reflections.length) {
    el.innerHTML = '<p class="log-empty">No reflections yet. Write something after your next session.</p>';
    return;
  }

  el.innerHTML = state.reflections.slice(0, 30).map((entry, i) => {
    const d     = new Date(entry.date + 'T12:00:00');
    const label = d.toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
    const timeLabel = entry.time ? ' · ' + entry.time : '';
    const accordionId = 'reflection-acc-' + i;

    return `
      <div class="accordion-entry">
        <button
          type="button"
          class="accordion-header"
          aria-expanded="false"
          aria-controls="${accordionId}"
          onclick="toggleAccordion(this)"
        >
          <div class="accordion-meta">
            <span class="accordion-date">${label}${timeLabel}</span>
            ${entry.book ? `<span class="accordion-book">${entry.book}${entry.page ? ' · p.' + entry.page : ''}</span>` : ''}
          </div>
          <span class="accordion-chevron" aria-hidden="true">›</span>
        </button>
        <div class="accordion-body" id="${accordionId}" hidden>
          <div class="reflection-text">${entry.text}</div>
        </div>
      </div>
    `;
  }).join('');
}

/* ── Accordion toggle ── */
function toggleAccordion(btn) {
  const expanded = btn.getAttribute('aria-expanded') === 'true';
  const bodyId   = btn.getAttribute('aria-controls');
  const body     = document.getElementById(bodyId);

  btn.setAttribute('aria-expanded', !expanded);
  btn.classList.toggle('open', !expanded);
  if (body) body.hidden = expanded;
}

/* ── Reset oracle — full reset ── */
function resetOracle() {
  // Clear oracle input
  const input = document.getElementById('oracle-input');
  if (input) {
    input.value = '';
    const counter = document.getElementById('char-count');
    if (counter) counter.textContent = '500';
  }

  // Hide result card
  const card = document.getElementById('result-card');
  if (card) card.classList.remove('visible');

  // Reset mark-read button
  const markBtn = document.getElementById('mark-btn');
  if (markBtn) {
    markBtn.textContent = 'Mark read today';
    markBtn.classList.remove('done');
  }
  const done = document.getElementById('r-done');
  if (done) done.style.display = 'none';

  // Clear reflection textarea
  const rText = document.getElementById('r-text');
  if (rText) rText.value = '';

  // Reset reflection prompt
  const prompt = document.getElementById('r-prompt');
  if (prompt) prompt.textContent = 'Find your chapter above and your reflection prompt will appear here.';

  // Clear current session
  current = null;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', () => {
  initPills();
  initCharCount();

  // Desktop mic only — mobile uses native keyboard mic
  initMic('mic-btn',         'oracle-input', 'listening-bar');
  initMic('reflect-mic-btn', 'r-text',       'reflect-listening-bar');

  document.getElementById('oracle-btn').addEventListener('click', callOracle);
  document.getElementById('mark-btn').addEventListener('click', markRead);
  document.getElementById('save-reflect-btn').addEventListener('click', saveReflect);
  document.getElementById('new-reading-btn').addEventListener('click', resetOracle);

  document.getElementById('oracle-input').addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') callOracle();
  });

  renderStats();
  renderLog();
  renderReflections();
});
