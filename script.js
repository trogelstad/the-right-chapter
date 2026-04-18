/* ═══════════════════════════════════════════
   THE RIGHT CHAPTER V2 — Complete Style Additions
   PASTE AT THE BOTTOM of existing style.css.
   Do not remove anything above.
═══════════════════════════════════════════ */

/* ── Screen router ── */
.screen { display: none; }
#screen-landing { display: block; }

/* ══════════════════════════════════════════
   LANDING
══════════════════════════════════════════ */
.landing-card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
  padding: 2.5rem 2rem;
  box-shadow: var(--sh-md);
  text-align: center;
  position: relative;
  overflow: hidden;
}
.landing-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: rgba(255,248,235,0.80);
  pointer-events: none;
}
.landing-headline {
  font-family: var(--serif);
  font-size: 26px;
  font-weight: 400;
  color: var(--ink);
  line-height: 1.35;
  margin-bottom: 0.75rem;
  letter-spacing: -0.01em;
}
.landing-sub {
  font-size: 15px;
  color: var(--ink-2);
  margin-bottom: 2rem;
  line-height: 1.6;
}
.landing-micro {
  font-size: 11px;
  color: var(--ink-4);
  margin-top: 1rem;
  letter-spacing: 0.04em;
  text-align: center;
}
.landing-divider {
  font-size: 11px;
  color: var(--ink-4);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin: 1.1rem 0 1rem;
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
}
.landing-divider::before,
.landing-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--line);
}
.sample-btn {
  display: block;
  width: 100%;
  padding: 14px 20px;
  border-radius: var(--r-xl);
  border: 1.5px solid var(--line-med);
  background: transparent;
  color: var(--ink-3);
  font-family: var(--sans);
  font-size: 15px;
  cursor: pointer;
  text-align: center;
  transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.12s;
  margin-bottom: 0;
}
.sample-btn:hover {
  background: var(--hover);
  color: var(--ink-2);
  border-color: var(--plum-ring);
  transform: translateY(-1px);
}

/* ══════════════════════════════════════════
   SHELF SETUP
══════════════════════════════════════════ */
.setup-intro { margin-bottom: 1.75rem; }
.setup-headline { font-family: var(--serif); font-size: 24px; font-weight: 400; color: var(--ink); margin-bottom: 0.5rem; }
.setup-sub { font-size: 14px; color: var(--ink-2); line-height: 1.65; }
.book-row {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: 1rem 1.1rem;
  margin-bottom: 0.75rem;
  box-shadow: var(--sh-xs);
}
.book-row-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 0.65rem;
}
.book-row-fields input {
  width: 100%;
  border: 1px solid var(--line-med);
  border-radius: var(--r-sm);
  padding: 9px 12px;
  font-size: 14px;
  font-family: var(--sans);
  color: var(--ink);
  background: var(--inset);
  box-shadow: inset 0 1px 3px rgba(45,30,10,0.05);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.book-row-fields input:focus {
  outline: none;
  border-color: var(--line-focus);
  box-shadow: 0 0 0 3px rgba(123,114,200,0.13);
}
.book-row-fields input::placeholder { color: var(--ink-4); }
.book-row-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.format-pills { display: flex; gap: 6px; flex-wrap: wrap; }
.fmt-pill {
  padding: 5px 12px;
  border-radius: 999px;
  border: 1.5px solid var(--line-med);
  background: var(--inset);
  color: var(--ink-3);
  font-family: var(--sans);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.14s, border-color 0.14s, color 0.14s;
}
.fmt-pill:hover { background: var(--hover); color: var(--ink-2); border-color: var(--plum-ring); }
.fmt-pill.on { background: var(--plum-tint); border-color: var(--plum-ring); color: var(--plum); font-weight: 500; }
.remove-book-btn {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 1px solid var(--line-med);
  background: var(--inset);
  color: var(--ink-3);
  font-size: 16px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background 0.14s, color 0.14s, border-color 0.14s;
}
.remove-book-btn:hover { background: #f9e8e8; color: #9b3030; border-color: #e0b0b0; }
.add-book-btn {
  display: inline-block;
  font-size: 13px; color: var(--plum);
  font-family: var(--sans); cursor: pointer;
  padding: 4px 0; margin-bottom: 1.25rem;
  border: none; background: none;
  text-decoration: underline;
  text-decoration-color: var(--plum-ring);
  text-underline-offset: 3px;
  transition: color 0.14s;
}
.add-book-btn:hover { color: var(--plum-mid); }
.shelf-progress { font-size: 12px; margin-bottom: 1.25rem; min-height: 20px; transition: color 0.2s; }
.shelf-progress.warn { color: var(--brass); }
.shelf-progress.ok   { color: var(--sage); font-weight: 500; }
.confirm-card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
  padding: 2rem 1.75rem;
  box-shadow: var(--sh-md);
  text-align: center;
}
.confirm-headline { font-family: var(--serif); font-size: 26px; font-weight: 400; color: var(--ink); margin-bottom: 0.5rem; }
.confirm-sub { font-size: 14px; color: var(--ink-2); line-height: 1.65; margin-bottom: 1.75rem; font-style: italic; }
.shelf-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--line); text-align: left; flex-wrap: wrap; }
.shelf-item:last-child { border-bottom: none; margin-bottom: 1.5rem; }
.shelf-item-title { font-size: 14px; font-weight: 500; color: var(--ink); flex: 1; min-width: 120px; }
.shelf-item-author { font-size: 13px; color: var(--ink-3); }
.b-format-print { background: var(--plum-tint);  color: var(--plum);  border-color: var(--plum-ring); }
.b-format-audio { background: var(--brass-tint); color: var(--brass); border-color: rgba(122,90,36,0.24); }
.b-format-ebook { background: var(--sage-tint);  color: var(--sage);  border-color: var(--sage-ring); }
.text-link {
  display: block; font-size: 13px; color: var(--ink-3);
  text-align: center; margin-top: 0.85rem;
  cursor: pointer; border: none; background: none;
  font-family: var(--sans);
  text-decoration: underline; text-decoration-color: var(--line-med);
  text-underline-offset: 3px; transition: color 0.14s;
}
.text-link:hover { color: var(--plum); }
.shelf-link { margin-top: 1rem; }

/* ══════════════════════════════════════════
   SAMPLE BANNER (oracle screen, sample mode)
══════════════════════════════════════════ */
.sample-banner {
  background: var(--plum-tint);
  border: 1px solid var(--plum-ring);
  border-radius: var(--r-md);
  padding: 10px 14px;
  font-size: 13px;
  color: var(--plum);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 1rem;
}
.sample-banner-link {
  font-size: 12px;
  font-weight: 500;
  color: var(--plum);
  text-decoration: underline;
  border: none;
  background: none;
  cursor: pointer;
  white-space: nowrap;
}

/* ══════════════════════════════════════════
   ORACLE INTRO — V1 style above the input card
══════════════════════════════════════════ */
.oracle-intro {
  text-align: center;
  margin-bottom: 2rem;
  padding: 0 0.5rem;
}
.oracle-intro-headline {
  font-family: var(--serif);
  font-size: 28px;
  font-weight: 400;
  font-style: italic;
  color: var(--ink);
  line-height: 1.35;
  margin-bottom: 0.5rem;
  letter-spacing: -0.01em;
}
.oracle-intro-sub {
  font-family: var(--serif);
  font-size: 20px;
  font-weight: 400;
  font-style: italic;
  color: var(--plum);
  line-height: 1.4;
  margin-bottom: 1rem;
}
.oracle-intro-copy {
  font-size: 14px;
  color: var(--ink-3);
  line-height: 1.75;
}
.oracle-intro::after {
  content: '';
  display: block;
  width: 60px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--plum-ring), transparent);
  margin: 1.25rem auto 0;
}

/* ══════════════════════════════════════════
   ORACLE INPUT CARD
══════════════════════════════════════════ */
.oracle-card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
  padding: 1.75rem 1.75rem 1.5rem;
  box-shadow: var(--sh-md);
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
}
.oracle-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--plum) 0%, var(--plum-soft) 50%, var(--sage) 100%);
}
.oracle-question {
  font-family: var(--serif);
  font-size: 26px;
  font-weight: 400;
  color: var(--ink);
  line-height: 1.25;
  margin-bottom: 1rem;
  letter-spacing: -0.015em;
}
.oracle-input-wrap {
  position: relative;
  margin-bottom: 1.25rem;
}
.oracle-input-wrap textarea { min-height: 130px; width: 100%; }
.char-count {
  position: absolute;
  bottom: 10px; right: 44px; /* shift left to leave room for mic button */
  font-size: 11px;
  color: var(--ink-4);
  display: none;
  pointer-events: none;
}

/* ══════════════════════════════════════════
   MIC BUTTON (voice-to-text)
   Injected by JS into .oracle-input-wrap
══════════════════════════════════════════ */
.mic-btn {
  position: absolute;
  bottom: 10px; right: 10px;
  width: 32px; height: 32px;
  border-radius: 50%;
  border: 1px solid var(--line-med);
  background: var(--card);
  color: var(--ink-3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--sh-xs);
  transition: background 0.14s, color 0.14s, box-shadow 0.14s, border-color 0.14s;
  z-index: 1;
}
.mic-btn:hover {
  background: var(--hover);
  color: var(--ink);
  border-color: var(--plum-ring);
}
.mic-btn.listening {
  background: var(--plum-tint);
  border-color: var(--plum);
  color: var(--plum);
  animation: pulse-mic 1.2s ease-in-out infinite;
}
@keyframes pulse-mic {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59,47,110,0.3); }
  50%       { box-shadow: 0 0 0 6px rgba(59,47,110,0); }
}

/* ══════════════════════════════════════════
   TIME SELECTOR (10 / 20 / 30 min)
══════════════════════════════════════════ */
.time-selector {
  margin-bottom: 1.25rem;
}
.time-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.time-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--ink-3);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.time-pills { display: flex; gap: 8px; }
.time-pill {
  padding: 7px 18px;
  border-radius: 999px;
  border: 1.5px solid var(--line-med);
  background: var(--card);
  color: var(--ink-2);
  font-family: var(--sans);
  font-size: 13px;
  cursor: pointer;
  box-shadow: var(--sh-xs);
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.time-pill:hover { background: var(--hover); color: var(--ink); border-color: var(--plum-ring); }
.time-pill.on {
  background: var(--plum);
  border-color: var(--plum);
  color: #f5f0e8;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(59,47,110,0.25);
}

/* ══════════════════════════════════════════
   LOADING CARD
══════════════════════════════════════════ */
.loading-card { text-align: center; padding: 4rem 2rem; }
.loading-glyph {
  font-size: 28px; color: var(--plum-soft);
  display: block; margin-bottom: 1.5rem;
  animation: pulse-glyph 2.4s ease-in-out infinite;
}
@keyframes pulse-glyph {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50%       { opacity: 1;   transform: scale(1.12); }
}
.loading-msg {
  font-family: var(--serif); font-size: 20px; font-weight: 400;
  color: var(--ink-2); font-style: italic; transition: opacity 0.3s ease;
}

/* ══════════════════════════════════════════
   ORACLE SPEAKS CARD
   Pull quote (large italic serif) +
   body text (smaller sans with left border)
══════════════════════════════════════════ */
.oracle-speaks-card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: 1.75rem;
  margin-bottom: 1.25rem;
  box-shadow: var(--sh-sm);
  position: relative;
  overflow: hidden;
}
.oracle-speaks-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 1px;
  background: rgba(255,248,235,0.80);
  pointer-events: none;
}
.oracle-label {
  font-size: 10px; font-weight: 500; color: var(--plum);
  letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 1rem;
}
/* Pull quote — first 2 sentences, large italic serif */
.oracle-pull {
  font-family: var(--serif);
  font-size: 20px;
  font-style: italic;
  color: var(--ink);
  line-height: 1.55;
  margin-bottom: 1.1rem;
  letter-spacing: -0.01em;
}
/* Body text — remaining sentences, smaller with left border */
.oracle-body {
  font-family: var(--sans);
  font-size: 14px;
  color: var(--ink-2);
  line-height: 1.75;
  border-left: 2px solid var(--plum-ring);
  padding-left: 1rem;
  margin: 0;
}

/* ══════════════════════════════════════════
   BOOK REVEAL CARD
══════════════════════════════════════════ */
.b-time {
  background: var(--sage-tint);
  color: var(--sage);
  border-color: var(--sage-ring);
}

/* ══════════════════════════════════════════
   PAGE WHY — italic paragraph with left border
   "Around page X, you'll find…"
══════════════════════════════════════════ */
.oracle-why {
  font-family: var(--serif);
  font-size: 15px;
  font-style: italic;
  color: var(--ink-2);
  line-height: 1.75;
  border-left: 2px solid var(--plum-ring);
  padding-left: 1rem;
  margin: 1.25rem 0;
  min-height: 1em;
}

/* ══════════════════════════════════════════
   AFTER READING NUDGE CARD
══════════════════════════════════════════ */
.oracle-step-block {
  background: var(--plum-tint);
  border: 1px solid var(--plum-ring);
  border-radius: var(--r-lg);
  padding: 1rem 1.1rem;
  margin: 1rem 0 1.25rem;
}
.oracle-step-label {
  font-size: 9px;
  font-weight: 600;
  color: var(--plum);
  letter-spacing: 0.20em;
  text-transform: uppercase;
  margin-bottom: 0.4rem;
}
.oracle-step {
  font-size: 14px;
  color: var(--ink-2);
  line-height: 1.65;
}

/* ══════════════════════════════════════════
   AUDIBLE LINK
══════════════════════════════════════════ */
.audible-link {
  display: inline-block; margin: 0.75rem 0 1rem;
  font-size: 13px; font-weight: 500; color: var(--plum);
  text-decoration: underline; text-decoration-color: var(--plum-ring);
  text-underline-offset: 3px; transition: color 0.14s;
}
.audible-link:hover { color: var(--plum-mid); }

/* ══════════════════════════════════════════
   SAMPLE UPGRADE PROMPT (reveal, sample mode)
══════════════════════════════════════════ */
.sample-upgrade {
  margin: 1.5rem 0;
  background: var(--card);
  border: 1px solid var(--plum-ring);
  border-radius: var(--r-xl);
  padding: 1.75rem;
  text-align: center;
}
.sample-upgrade-text {
  font-family: var(--serif);
  font-size: 20px;
  font-weight: 400;
  color: var(--ink);
  margin-bottom: 1rem;
}

/* ══════════════════════════════════════════
   JOURNAL ACCORDION
══════════════════════════════════════════ */
.accordion-entry {
  border-bottom: 1px solid var(--line);
}
.accordion-entry:last-child {
  border-bottom: none;
}
.accordion-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: var(--sans);
  transition: opacity 0.14s;
}
.accordion-header:hover { opacity: 0.75; }
.accordion-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.accordion-date {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
}
.accordion-book {
  font-size: 11px;
  color: var(--plum);
  font-style: italic;
}
.accordion-chevron {
  font-size: 20px;
  color: var(--ink-3);
  transition: transform 0.2s;
  flex-shrink: 0;
  margin-left: 8px;
}
.accordion-header.open .accordion-chevron {
  transform: rotate(90deg);
}
.accordion-body {
  padding: 0.5rem 0 1rem;
}
.journal-prompt {
  font-size: 12px;
  font-weight: 500;
  color: var(--plum);
  font-style: italic;
  margin-bottom: 8px;
  letter-spacing: 0.02em;
}
.reflection-text {
  font-size: 14px;
  color: var(--ink-2);
  line-height: 1.7;
}

/* ── Disabled button ── */
.spin-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; transform: none; }

/* ══════════════════════════════════════════
   MOBILE
══════════════════════════════════════════ */
@media (max-width: 540px) {
  .book-row-fields { grid-template-columns: 1fr; }
  .oracle-intro-headline { font-size: 22px; }
  .oracle-intro-sub { font-size: 17px; }
  .oracle-question { font-size: 22px; }
  .oracle-card { padding: 1.4rem 1.25rem 1.25rem; }
  .landing-card, .confirm-card { padding: 1.75rem 1.25rem; }
  .shelf-item { gap: 6px; }
  .oracle-pull { font-size: 17px; }
  .oracle-why { font-size: 14px; }
  .time-pills { flex-wrap: wrap; }
}
