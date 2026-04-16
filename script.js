/* The Right Chapter — script.js v3 */
'use strict';

/* ── State ── */
const STORAGE_KEY = 'the_right_chapter_v1';
let state = load();
let current = null;
let recognition = null;
let isListening = false;

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

/* ── Helpers ── */
function today() { return new Date().toISOString().split('T')[0]; }

function getSelected(groupId) {
  const el = document.querySelector('#' + groupId + ' .pill.on');
  return el ? el.dataset.v : '10';
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

/* ── Voice / Mic ── */
function initMic() {
  const micBtn = document.getElementById('mic-btn');
  if (!micBtn) return;

  // Check browser support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micBtn.style.display = 'none';
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isListening = true;
    micBtn.classList.add('listening');
    showListening(true);
  };

  recognition.onresult = (e) => {
    const input = document.getElementById('oracle-input');
    const counter = document.getElementById('char-count');
    let transcript = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript;
    }
    if (input) {
      input.value = transcript;
      if (counter) {
        const remaining = 500 - transcript.length;
        counter.textContent = remaining;
        counter.style.color = remaining < 50 ? 'var(--brass)' : 'var(--ink-4)';
      }
    }
  };

  recognition.onerror = (e) => {
    console.error('Speech error:', e.error);
    stopListening();
  };

  recognition.onend = () => {
    stopListening();
  };

  micBtn.addEventListener('click', () => {
    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error('Mic error:', err);
      }
    }
  });
}

function stopListening() {
  isListening = false;
  const micBtn = document.getElementById('mic-btn');
  if (micBtn) micBtn.classList.remove('listening');
  showListening(false);
}

function showListening(show) {
  const bar = document.getElementById('listening-bar');
  if (bar) {
    if (show) {
      bar.classList.add('visible');
    } else {
      bar.classList.remove('visible');
    }
  }
}

/* ── Oracle call ── */
async function callOracle() {
  const input = document.getElementById('oracle-input');
  const userText = input ? input.value.trim() : '';

  if (userText.length < 5) {
    if (input) {
      input.focus();
      input.style.borderColor = 'var(--brass)';
      setTimeout(() => { input.style.borderColor = ''; }, 2000);
    }
    return;
  }

  // Stop mic if listening
  if (isListening && recognition) {
    recognition.stop();
  }

  const btn = document.getElementById('oracle-btn');
  const loading = document.getElementById('oracle-loading');
  const card = document.getElementById('result-card');

  btn.disabled = true;
  btn.textContent = 'Listening...';
  if (loading) loading.classList.add('visible');
  if (card) card.classList.remove('visible');

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
    const time = parseInt(getSelected('g-time') || '10', 10);

    current = {
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
    btn.disabled = false;
    btn.textContent = 'Find my chapter';
    if (loading) loading.classList.remove('visible');
  }
}

/* ── Render oracle response ── */
function renderOracle(oracle, time) {
  document.getElementById('r-mirror').textContent   = oracle.mirror;
  document.getElementById('r-name').textContent     = oracle.name;
  document.getElementById('r-offering').textContent = oracle.offering;
  document.getElementById('r-title').textContent    = oracle.book;
  document.getElementById('r-author').textContent   = oracle.author;
  document.getElementById('r-page').textContent     = oracle.page;
  document.getElementById('r-time').textContent     = time + ' min session';
  document.getElementById('r-why').textContent      = oracle.whyThisFits;
  document.getElementById('r-step').textContent     = oracle.singleStep;
  document.getElementById('r-prompt').textContent   = oracle.reflectionPrompt;

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
  if (state.markedDates.includes(td)) return;
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

  if (state.log.length) { state.log[0].marked = true; }

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
  state.reflections[today()] = val;
  save();
  const ok = document.getElementById('saved-ok');
  ok.style.display = 'inline';
  setTimeout(() => { ok.style.display = 'none'; }, 2200);
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

/* ── Render log ── */
function renderLog() {
  const el = document.getElementById('log-list');
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

/* ── Reset ── */
function resetOracle() {
  const input = document.getElementById('oracle-input');
  if (input) {
    input.value = '';
    const counter = document.getElementById('char-count');
    if (counter) counter.textContent = '500';
    input.focus();
  }
  document.getElementById('result-card').classList.remove('visible');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', () => {
  initPills();
  initCharCount();
  initMic();

  document.getElementById('oracle-btn').addEventListener('click', callOracle);
  document.getElementById('mark-btn').addEventListener('click', markRead);
  document.getElementById('save-reflect-btn').addEventListener('click', saveReflect);
  document.getElementById('new-reading-btn').addEventListener('click', resetOracle);

  document.getElementById('oracle-input').addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') callOracle();
  });

  renderStats();
  renderLog();
});
