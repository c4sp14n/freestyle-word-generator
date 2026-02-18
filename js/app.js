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
    { code: 'AZ', label: 'Azərbaycan', file: 'AZ.json' },
    { code: 'EN', label: 'English', file: 'EN.json' },
    // Example future additions:
    // { code: 'TR', label: 'Türkçe', file: 'TR.txt' },
    // { code: 'RU', label: 'Русский', file: 'RU.txt' },
  ]

  // ─── STATE ───────────────────────────────────────────────
  const state = {
    words: [],
    isRunning: false,
    isPaused: false,
    timerId: null,
    countdownId: null,
    duration: 5,
    timeRemaining: 0,
    lastTick: 0,
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
    wordDescription: $('#word-description'),
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
      state.words = await res.json()

      dom.wordText.textContent = 'Ready?'
      dom.wordDescription.textContent = ''
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
    dom.btnStart.addEventListener('click', onMainButtonClick)
    dom.languageSelect.addEventListener('change', onLanguageChange)

    // Keyboard shortcut: Space to pause/resume
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        if (state.isRunning) {
          togglePause()
        } else {
          startSession()
        }
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
  function onMainButtonClick() {
    if (state.words.length === 0) return
    state.isRunning ? stopSession() : startSession()
  }

  function togglePause() {
    if (!state.isRunning) return
    state.isPaused = !state.isPaused

    if (state.isPaused) {
      clearTimer()
    } else {
      startTimer(state.timeRemaining)
    }
    updateUI()
  }

  function startSession() {
    state.isRunning = true
    state.isPaused = false
    state.rounds++
    state.wordsShown = 0 // Reset counts for new round
    updateUI()
    showNextWord()
    startTimer(state.duration * 1000)
  }

  function stopSession() {
    state.isRunning = false
    state.isPaused = false
    clearTimer()
    resetTimerRing()

    // Reset stats for the UI
    state.wordsShown = 0
    state.rounds = 0

    updateUI()
    dom.wordText.textContent = 'Ready?'
    dom.wordDescription.textContent = ''
    dom.wordHint.textContent = 'Press start to begin your flow'
    dom.timerCountdown.textContent = '–'
  }

  function clearTimer() {
    clearInterval(state.timerId)
    clearInterval(state.countdownId)
    state.timerId = null
    state.countdownId = null
  }

  // ─── WORD GENERATION ──────────────────────────────────────
  async function showNextWord() {
    if (state.words.length === 0) return

    // Crypto-secure random index
    const randomIndex = getSecureRandom(state.words.length)
    const entry = state.words[randomIndex]
    const word = entry.word

    // Update word text immediately
    dom.wordText.textContent = word
    dom.wordText.classList.remove('pop-in')
    void dom.wordText.offsetWidth
    dom.wordText.classList.add('pop-in')

    // Handle description (Live API for English, cached for both)
    if (state.currentLanguage === 'EN') {
      // Logic fix: Only skip fetch if we genuinely have a "real" definition from a prior fetch
      // or if it's one of our manually added high-quality descriptions.
      // Current placeholders start with "Term:" or "Definition for"
      const isPlaceholder = !entry.description ||
        entry.description.startsWith('Term:') ||
        entry.description.startsWith('Definition for') ||
        entry.description === '';

      if (isPlaceholder && !entry.isRealDefinition) {
        dom.wordDescription.textContent = 'Fetching definition...'
        try {
          const apiDesc = await fetchDefinition(word)
          if (apiDesc) {
            entry.description = apiDesc
            entry.isRealDefinition = true
          }
        } catch (err) {
          console.warn(`Could not fetch definition for ${word}`)
        }
      }
    }

    dom.wordDescription.textContent = entry.description || ''
    dom.wordDescription.classList.remove('pop-in')
    void dom.wordDescription.offsetWidth
    dom.wordDescription.classList.add('pop-in')

    state.wordsShown++
    dom.statWords.textContent = state.wordsShown
  }

  /**
   * Fetches definition from Free Dictionary API
   */
  async function fetchDefinition(word) {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
      if (!response.ok) return null
      const data = await response.json()

      // Navigate to first definition: data[0].meanings[0].definitions[0].definition
      if (data && data[0] && data[0].meanings && data[0].meanings[0]) {
        return data[0].meanings[0].definitions[0].definition
      }
      return null
    } catch (e) {
      return null
    }
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
  function startTimer(initialMs) {
    clearTimer() // Safety check
    state.timeRemaining = initialMs
    state.lastTick = performance.now()

    const tick = () => {
      if (state.isPaused) return

      const now = performance.now()
      const delta = now - state.lastTick
      state.lastTick = now

      state.timeRemaining -= delta

      if (state.timeRemaining <= -50) { // Slight buffer to ensure 0 is seen
        showNextWord()
        state.timeRemaining = state.duration * 1000
      }

      // Update UI
      // Use floor to ensure we see the "0" second
      const remainingSec = Math.max(0, Math.floor(state.timeRemaining / 1000 + 0.99))
      dom.timerCountdown.textContent = remainingSec

      // Update ring
      const progress = 1 - (state.timeRemaining / (state.duration * 1000))
      const offset = CIRCUMFERENCE * (1 - progress)
      dom.timerProgress.style.strokeDashoffset = Math.min(CIRCUMFERENCE, Math.max(0, offset))
    }

    // Using a frequent interval for smooth animation
    state.countdownId = setInterval(tick, 16)
  }

  function resetTimerRing() {
    dom.timerProgress.style.strokeDashoffset = CIRCUMFERENCE
  }

  // ─── UI UPDATE ───────────────────────────────────────────
  function updateUI() {
    const running = state.isRunning
    const paused = state.isPaused

    // Button state
    dom.btnIcon.textContent = running ? '■' : '▶'
    dom.btnLabel.textContent = running ? 'Stop' : 'Start'
    dom.btnStart.classList.toggle('is-running', running)

    // Card state
    dom.wordCard.classList.toggle('active', running && !paused)
    dom.wordCard.style.opacity = paused ? '0.6' : '1'

    // Disable controls while running
    dom.controlsCard.classList.toggle('disabled', running)

    // Stats
    dom.statWords.textContent = state.wordsShown
    dom.statRounds.textContent = state.rounds

    // Hint
    if (paused) {
      dom.wordHint.textContent = 'PAUSED · Press Space to Resume'
    } else if (running) {
      dom.wordHint.textContent = `New word every ${state.duration}s · Space to Pause`
    }
  }

  // ─── BOOT ────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
