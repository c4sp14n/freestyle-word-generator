/**
 * FreestyleFlow – Random Word Generator for Freestyle Practice
 * Static, secure, no external API calls. All data loaded from local files.
 */

; (() => {
  'use strict'

  // ─── CONFIG ──────────────────────────────────────────────
  // Add new languages here. The `file` value must match a .txt file
  // inside the `data/` directory. Each line in the file = one word.
  const LANGUAGES = [
    { code: 'AZ', label: 'Azərbaycan', file: 'AZ.txt' },
    { code: 'EN', label: 'English', file: 'EN.txt' },
    // Example future additions:
    // { code: 'TR', label: 'Türkçe', file: 'TR.txt' },
    // { code: 'RU', label: 'Русский', file: 'RU.txt' },
  ]

  // ─── STATE ───────────────────────────────────────────────
  const state = {
    words: [],
    isRunning: false,
    timerId: null,
    countdownId: null,
    duration: 5,
    wordsShown: 0,
    rounds: 0,
    currentLanguage: LANGUAGES[0].code,
  }

  // ─── DOM REFERENCES ──────────────────────────────────────
  const $ = (sel) => document.querySelector(sel)
  const dom = {
    languageSelect: $('#language-select'),
    durationSlider: $('#duration-slider'),
    durationBadge: $('#duration-badge'),
    wordText: $('#word-text'),
    wordHint: $('#word-hint'),
    wordCard: $('#word-card'),
    btnStart: $('#btn-start'),
    btnIcon: $('#btn-icon'),
    btnLabel: $('#btn-label'),
    timerCountdown: $('#timer-countdown'),
    timerProgress: $('#timer-ring-progress'),
    statWords: $('#stat-words'),
    statRounds: $('#stat-rounds'),
    controlsCard: document.querySelector('.controls-card'),
  }

  // ─── TIMER RING CONSTANTS ───────────────────────────────
  const CIRCUMFERENCE = 2 * Math.PI * 90 // r=90 in SVG

  // ─── INIT ────────────────────────────────────────────────
  function init() {
    injectSVGGradient()
    populateLanguages()
    attachEvents()
    loadWords(state.currentLanguage)
  }

  /**
   * SVG gradient definitions for the timer ring stroke.
   * We inject this into the SVG so we can use `url(#timerGradient)`.
   */
  function injectSVGGradient() {
    const svg = document.querySelector('.timer-ring')
    if (!svg) return
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    defs.innerHTML = `
      <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#a855f7" />
        <stop offset="100%" style="stop-color:#6366f1" />
      </linearGradient>
    `
    svg.prepend(defs)
  }

  // ─── LANGUAGE SELECT ─────────────────────────────────────
  function populateLanguages() {
    dom.languageSelect.innerHTML = LANGUAGES.map(
      (lang) => `<option value="${lang.code}">${lang.label}</option>`
    ).join('')
  }

  // ─── LOAD WORDS ──────────────────────────────────────────
  async function loadWords(langCode) {
    const lang = LANGUAGES.find((l) => l.code === langCode)
    if (!lang) return

    dom.wordText.textContent = '...'
    dom.wordHint.textContent = 'Loading words…'

    try {
      const res = await fetch(`data/${lang.file}`)
      if (!res.ok) throw new Error(`Failed to load ${lang.file}`)
      const text = await res.text()
      state.words = text
        .split('\n')
        .map((w) => w.trim())
        .filter((w) => w.length > 0)

      dom.wordText.textContent = 'Ready?'
      dom.wordHint.textContent = `${state.words.length} words loaded · Press start`
    } catch (err) {
      console.error(err)
      dom.wordText.textContent = 'Error'
      dom.wordHint.textContent = 'Could not load word list'
      state.words = []
    }
  }

  // ─── EVENTS ──────────────────────────────────────────────
  function attachEvents() {
    dom.durationSlider.addEventListener('input', onDurationChange)
    dom.btnStart.addEventListener('click', toggleRunning)
    dom.languageSelect.addEventListener('change', onLanguageChange)

    // Keyboard shortcut: Space to start/stop
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        toggleRunning()
      }
    })
  }

  function onDurationChange() {
    state.duration = parseInt(dom.durationSlider.value, 10)
    dom.durationBadge.textContent = `${state.duration}s`
  }

  function onLanguageChange() {
    const newLang = dom.languageSelect.value
    if (state.isRunning) stopSession()
    state.currentLanguage = newLang
    loadWords(newLang)
  }

  // ─── SESSION CONTROL ─────────────────────────────────────
  function toggleRunning() {
    if (state.words.length === 0) return
    state.isRunning ? stopSession() : startSession()
  }

  function startSession() {
    state.isRunning = true
    state.rounds++
    updateUI()
    showNextWord()
    startTimer()
  }

  function stopSession() {
    state.isRunning = false
    clearInterval(state.timerId)
    clearInterval(state.countdownId)
    state.timerId = null
    state.countdownId = null
    resetTimerRing()
    updateUI()
    dom.wordText.textContent = 'Ready?'
    dom.wordHint.textContent = 'Press start to begin your flow'
    dom.timerCountdown.textContent = '–'
  }

  // ─── WORD GENERATION ──────────────────────────────────────
  function showNextWord() {
    if (state.words.length === 0) return

    // Crypto-secure random index
    const randomIndex = getSecureRandom(state.words.length)
    const word = state.words[randomIndex]

    dom.wordText.textContent = word
    dom.wordText.classList.remove('pop-in')
    // Force reflow so animation replays
    void dom.wordText.offsetWidth
    dom.wordText.classList.add('pop-in')

    state.wordsShown++
    dom.statWords.textContent = state.wordsShown
  }

  /**
   * Returns a cryptographically secure random integer in [0, max).
   * Uses window.crypto for security; falls back to Math.random.
   */
  function getSecureRandom(max) {
    if (window.crypto && window.crypto.getRandomValues) {
      const arr = new Uint32Array(1)
      window.crypto.getRandomValues(arr)
      return arr[0] % max
    }
    return Math.floor(Math.random() * max)
  }

  // ─── TIMER ────────────────────────────────────────────────
  function startTimer() {
    const durationMs = state.duration * 1000
    let startTime = performance.now()

    // Show first countdown immediately
    dom.timerCountdown.textContent = state.duration

    // Word change at each interval
    state.timerId = setInterval(() => {
      showNextWord()
      startTime = performance.now()
    }, durationMs)

    // Countdown tick (every 100ms for smooth ring)
    state.countdownId = setInterval(() => {
      const elapsed = performance.now() - startTime
      const remaining = Math.max(0, durationMs - elapsed)
      const remainingSec = Math.ceil(remaining / 1000)
      dom.timerCountdown.textContent = remainingSec

      // Update ring
      const progress = elapsed / durationMs
      const offset = CIRCUMFERENCE * (1 - progress)
      dom.timerProgress.style.strokeDashoffset = Math.max(0, offset)
    }, 50)
  }

  function resetTimerRing() {
    dom.timerProgress.style.strokeDashoffset = CIRCUMFERENCE
  }

  // ─── UI UPDATE ───────────────────────────────────────────
  function updateUI() {
    const running = state.isRunning

    // Button state
    dom.btnIcon.textContent = running ? '■' : '▶'
    dom.btnLabel.textContent = running ? 'Stop' : 'Start'
    dom.btnStart.classList.toggle('is-running', running)

    // Card glow
    dom.wordCard.classList.toggle('active', running)

    // Disable controls while running
    dom.controlsCard.classList.toggle('disabled', running)

    // Stats
    dom.statWords.textContent = state.wordsShown
    dom.statRounds.textContent = state.rounds

    // Hint
    if (running) {
      dom.wordHint.textContent = `New word every ${state.duration}s · Press Space or Stop`
    }
  }

  // ─── BOOT ────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
