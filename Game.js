const form = document.getElementById('guessForm')
const input = document.getElementById('guessInput')
const inputWrap = document.getElementById('inputWrap')
const primaryBtn = document.getElementById('primaryBtn')
const primaryLabel = document.getElementById('primaryLabel')
const primaryKey = document.getElementById('primaryKey')
const hintBtn = document.getElementById('hintBtn')
const hintMeta = document.getElementById('hintMeta')
const newGameBtn = document.getElementById('newGameBtn')
const feedback = document.getElementById('feedback')
const feedbackTag = document.getElementById('feedbackTag')
const feedbackText = document.getElementById('feedbackText')
const consoleCode = document.getElementById('consoleCode')

const rangeReadout = document.getElementById('rangeReadout')
const attemptsReadout = document.getElementById('attemptsReadout')
const attemptsLeftEl = document.getElementById('attemptsLeft')
const attemptsTotalEl = document.getElementById('attemptsTotal')
const attemptsMeta = document.getElementById('attemptsMeta')
const bestReadout = document.getElementById('bestReadout')
const bandMeta = document.getElementById('bandMeta')

const rangeTrack = document.getElementById('rangeTrack')
const trackFill = document.getElementById('trackFill')
const trackStart = document.getElementById('trackStart')
const trackEnd = document.getElementById('trackEnd')
const lowerBound = document.getElementById('lowerBound')
const upperBound = document.getElementById('upperBound')
const spanReadout = document.getElementById('spanReadout')

const pips = document.getElementById('pips')
const guessLog = document.getElementById('guessLog')
const logMeta = document.getElementById('logMeta')
const inputHint = document.getElementById('inputHint')
const maxSuffix = document.getElementById('maxSuffix')

const soundToggle = document.getElementById('soundToggle')
const soundLabel = document.getElementById('soundLabel')
const confetti = document.getElementById('confetti')

const diffButtons = Array.from(document.querySelectorAll('.diff'))

const DIFFICULTIES = {
    short: { key: 'short', min: 1, max: 50, attempts: 7 },
    classic: { key: 'classic', min: 1, max: 100, attempts: 10 },
    wide: { key: 'wide', min: 1, max: 500, attempts: 12 }
}

const STORAGE_KEY = 'bestScore'
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

const state = {
    activeDifficulty: 'classic',
    min: 1,
    max: 100,
    maxAttempts: 10,
    secret: 0,
    attemptsUsed: 0,
    attemptsLeft: 10,
    low: 1,
    high: 100,
    hintsLeft: 2,
    gameOver: false,
    guesses: new Set(),
    soundOn: true
}

let bestScore = readBestScore()
let audioContext = null

function pad(value, length = 3) {
    return String(value).padStart(length, '0')
}

function readBestScore() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw === null || raw === '') return null
        const value = Number(raw)
        if (!Number.isFinite(value) || value <= 0) return null
        return Math.floor(value)
    } catch {
        return null
    }
}

function writeBestScore(value) {
    try {
        window.localStorage.setItem(STORAGE_KEY, String(value))
    } catch {
        return
    }
}

function renderBestScore() {
    bestReadout.textContent = bestScore === null ? '—' : pad(bestScore, 2)
    bestReadout.setAttribute('aria-label', bestScore === null ? 'No best score yet' : `Best score: ${bestScore} attempts`)
}

function buildPips() {
    pips.replaceChildren()
    for (let index = 0; index < state.maxAttempts; index += 1) {
        const pip = document.createElement('span')
        pip.className = 'pip'
        pips.append(pip)
    }
    paintPips()
}

function paintPips() {
    const children = pips.children
    for (let index = 0; index < children.length; index += 1) {
        children[index].classList.toggle('spent', index >= state.attemptsLeft)
    }
    pips.classList.toggle('is-critical', state.attemptsLeft > 0 && state.attemptsLeft <= 3)
}

function updateAttempts() {
    attemptsLeftEl.textContent = String(state.attemptsLeft)
    attemptsTotalEl.textContent = String(state.maxAttempts)
    attemptsReadout.setAttribute('aria-label', `${state.attemptsLeft} of ${state.maxAttempts} attempts remaining`)
    attemptsMeta.textContent = `${state.attemptsLeft} OF ${state.maxAttempts} REMAINING`
    paintPips()
}

function updateHintControl() {
    if (state.gameOver) {
        hintBtn.disabled = true
        hintMeta.textContent = 'SIGNAL CLOSED'
        hintBtn.setAttribute('aria-label', 'Hint unavailable, the game is over')
        return
    }
    if (state.hintsLeft <= 0) {
        hintBtn.disabled = true
        hintMeta.textContent = 'EXHAUSTED'
        hintBtn.setAttribute('aria-label', 'No hints remaining')
        return
    }
    hintBtn.disabled = false
    hintMeta.textContent = `${state.hintsLeft} LEFT / -1 ATTEMPT`
    hintBtn.setAttribute('aria-label', `Request a hint. ${state.hintsLeft} remaining. Costs one attempt.`)
}

function setFeedback(kind, message) {
    const tag = kind.toUpperCase()
    feedback.dataset.state = kind
    feedbackTag.textContent = tag
    feedbackText.textContent = message
    consoleCode.textContent = `GS-01 / ${tag}`
    feedback.classList.remove('is-pulsing')
    void feedback.offsetWidth
    feedback.classList.add('is-pulsing')
}

function renderRange() {
    const span = state.max - state.min + 1
    const start = ((state.low - state.min) / span) * 100
    const end = ((state.high - state.min + 1) / span) * 100
    const width = Math.max(end - start, 0.7)

    trackFill.style.setProperty('--track-start', `${start}%`)
    trackFill.style.setProperty('--track-width', `${width}%`)
    trackStart.style.setProperty('--track-start', `${start}%`)
    trackEnd.style.setProperty('--track-end', `${end}%`)

    lowerBound.textContent = pad(state.low)
    upperBound.textContent = pad(state.high)
    spanReadout.textContent = `SPAN ${state.high - state.low + 1}`
    rangeTrack.setAttribute('aria-label', `Possible range: ${state.low} to ${state.high}`)
}

function addLogEntry(value, tag) {
    const empty = guessLog.querySelector('.log-empty')
    if (empty) empty.remove()

    const entry = document.createElement('li')
    entry.className = 'log-entry'

    const index = document.createElement('span')
    index.className = 'log-index'
    index.textContent = pad(state.guesses.size, 2)

    const number = document.createElement('span')
    number.className = 'log-value'
    number.textContent = `NO. ${pad(value)}`

    const badge = document.createElement('span')
    badge.className = 'log-tag'
    badge.dataset.tag = tag.toLowerCase()
    badge.textContent = tag

    entry.append(index, number, badge)
    guessLog.append(entry)

    const count = guessLog.querySelectorAll('.log-entry').length
    logMeta.textContent = `${count} ${count === 1 ? 'ENTRY' : 'ENTRIES'}`
    guessLog.scrollTop = guessLog.scrollHeight
}

function resetLog() {
    guessLog.replaceChildren()
    const empty = document.createElement('li')
    empty.className = 'log-empty mono'
    empty.textContent = 'NO TRANSMISSIONS LOGGED'
    guessLog.append(empty)
    logMeta.textContent = '0 ENTRIES'
}

function setActiveDifficulty(key) {
    diffButtons.forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.key === key))
    })
}

function setReplayMode() {
    primaryLabel.textContent = 'Play again'
    primaryKey.textContent = 'NEW'
    primaryBtn.classList.add('is-replay')
}

function ensureAudio() {
    if (!state.soundOn) return null
    try {
        if (!audioContext) {
            const AudioCtor = window.AudioContext || window.webkitAudioContext
            if (!AudioCtor) return null
            audioContext = new AudioCtor()
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume()
        }
        return audioContext
    } catch {
        return null
    }
}

function playTone(frequency, duration = 0.08, type = 'triangle', delay = 0, volume = 0.035) {
    const context = ensureAudio()
    if (!context) return
    const start = context.currentTime + delay
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

    oscillator.connect(gain).connect(context.destination)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.03)
}

function playLowSound() {
    playTone(360, 0.07, 'triangle', 0, 0.025)
}

function playHighSound() {
    playTone(270, 0.07, 'triangle', 0, 0.025)
}

function playInvalidSound() {
    playTone(130, 0.09, 'square', 0, 0.018)
    playTone(112, 0.1, 'square', 0.06, 0.014)
}

function playHintSound() {
    playTone(520, 0.06, 'sine', 0, 0.025)
    playTone(660, 0.08, 'sine', 0.07, 0.02)
}

function playWinSound() {
    playTone(523.25, 0.12, 'triangle', 0, 0.03)
    playTone(659.25, 0.12, 'triangle', 0.1, 0.03)
    playTone(783.99, 0.18, 'triangle', 0.2, 0.03)
    playTone(1046.5, 0.28, 'sine', 0.32, 0.024)
}

function playLossSound() {
    playTone(220, 0.16, 'sine', 0, 0.026)
    playTone(174.61, 0.18, 'sine', 0.14, 0.024)
    playTone(130.81, 0.3, 'sine', 0.3, 0.022)
}

function launchConfetti() {
    if (reduceMotion.matches) return
    clearConfetti()
    const colors = ['#ff5a2b', '#f3efe5', '#b8b2a3', '#ff9a7d']
    const fragment = document.createDocumentFragment()

    for (let index = 0; index < 56; index += 1) {
        const piece = document.createElement('span')
        piece.className = 'confetti-piece'
        piece.style.setProperty('--x', `${Math.random() * 100}%`)
        piece.style.setProperty('--w', `${4 + Math.random() * 7}px`)
        piece.style.setProperty('--h', `${7 + Math.random() * 12}px`)
        piece.style.setProperty('--c', colors[index % colors.length])
        piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 280}px`)
        piece.style.setProperty('--rot', `${180 + Math.random() * 900}deg`)
        piece.style.setProperty('--d', `${2.2 + Math.random() * 1.8}s`)
        piece.style.setProperty('--delay', `${Math.random() * 0.35}s`)
        fragment.append(piece)
    }

    confetti.append(fragment)
    window.setTimeout(clearConfetti, 4400)
}

function clearConfetti() {
    confetti.replaceChildren()
}

function shakeInput() {
    inputWrap.classList.remove('shake')
    void inputWrap.offsetWidth
    inputWrap.classList.add('shake')
    window.setTimeout(() => inputWrap.classList.remove('shake'), 380)
}

function invalidInput(message) {
    setFeedback('invalid', message)
    playInvalidSound()
    input.setAttribute('aria-invalid', 'true')
    shakeInput()
    input.focus()
    input.select()
}

function focusInput() {
    window.requestAnimationFrame(() => {
        input.focus({ preventScroll: true })
        input.select()
    })
}

function newGame(config) {
    const next = config || DIFFICULTIES[state.activeDifficulty] || DIFFICULTIES.classic

    state.activeDifficulty = next.key
    state.min = next.min
    state.max = next.max
    state.maxAttempts = next.attempts
    state.secret = Math.floor(Math.random() * (state.max - state.min + 1)) + state.min
    state.attemptsUsed = 0
    state.attemptsLeft = state.maxAttempts
    state.low = state.min
    state.high = state.max
    state.hintsLeft = 2
    state.gameOver = false
    state.guesses = new Set()

    input.disabled = false
    input.value = ''
    input.placeholder = '000'
    input.min = String(state.min)
    input.max = String(state.max)
    input.setAttribute('aria-invalid', 'false')
    inputHint.textContent = `${pad(state.min)}—${pad(state.max)}`
    maxSuffix.textContent = String(state.max)

    primaryLabel.textContent = 'Transmit guess'
    primaryKey.textContent = 'ENTER'
    primaryBtn.classList.remove('is-replay')

    rangeReadout.textContent = `${pad(state.min)}—${pad(state.max)}`
    bandMeta.textContent = `${state.maxAttempts} ATTEMPTS ALLOCATED`

    setActiveDifficulty(next.key)
    resetLog()
    clearConfetti()
    buildPips()
    updateAttempts()
    updateHintControl()
    renderRange()
    renderBestScore()
    setFeedback('ready', `Station open. Enter a number between ${pad(state.min)} and ${pad(state.max)}.`)
    focusInput()
}

function finishWin(guess) {
    state.gameOver = true
    input.disabled = true
    input.placeholder = '—'
    setReplayMode()
    updateHintControl()

    const isBest = bestScore === null || state.attemptsUsed < bestScore
    if (isBest) {
        bestScore = state.attemptsUsed
        writeBestScore(bestScore)
    }
    renderBestScore()

    const attemptWord = state.attemptsUsed === 1 ? 'attempt' : 'attempts'
    const bestLine = isBest ? ' New best score.' : ''
    setFeedback('win', `Correct. The number was ${pad(guess)}. Found in ${state.attemptsUsed} ${attemptWord}.${bestLine}`)

    playWinSound()
    launchConfetti()
    primaryBtn.focus({ preventScroll: true })
}

function finishLoss() {
    state.gameOver = true
    input.disabled = true
    input.placeholder = '—'
    setReplayMode()
    updateHintControl()

    const attemptWord = state.maxAttempts === 1 ? 'attempt' : 'attempts'
    setFeedback('loss', `Signal closed. The number was ${pad(state.secret)}. All ${state.maxAttempts} ${attemptWord} spent. Play again to reopen the channel.`)

    playLossSound()
    primaryBtn.focus({ preventScroll: true })
}

function handleGuess(event) {
    event.preventDefault()

    if (state.gameOver) {
        newGame()
        return
    }

    const raw = input.value.trim()
    if (raw === '') {
        invalidInput('No signal received. Enter a whole number before transmitting.')
        return
    }

    const guess = Number(raw)
    if (!Number.isInteger(guess)) {
        invalidInput(`Whole numbers only. Enter a value from ${state.min} to ${state.max}.`)
        return
    }
    if (guess < state.min || guess > state.max) {
        invalidInput(`Out of band. Enter a whole number from ${state.min} to ${state.max}.`)
        return
    }
    if (state.guesses.has(guess)) {
        invalidInput(`Duplicate reading rejected. ${pad(guess)} is already logged. Transmit a different value.`)
        return
    }

    input.setAttribute('aria-invalid', 'false')
    state.guesses.add(guess)
    state.attemptsUsed += 1
    state.attemptsLeft -= 1

    if (guess === state.secret) {
        addLogEntry(guess, 'WIN')
        updateAttempts()
        input.value = ''
        finishWin(guess)
        return
    }

    if (guess < state.secret) {
        state.low = Math.max(state.low, guess + 1)
        addLogEntry(guess, 'LOW')
    } else {
        state.high = Math.min(state.high, guess - 1)
        addLogEntry(guess, 'HIGH')
    }

    updateAttempts()
    updateHintControl()
    renderRange()
    input.value = ''

    if (state.attemptsLeft <= 0) {
        finishLoss()
        return
    }

    if (guess < state.secret) {
        setFeedback('low', `${pad(guess)} is too low. Guess higher — the target sits above it. Band narrowed to ${pad(state.low)}—${pad(state.high)}.`)
        playLowSound()
    } else {
        setFeedback('high', `${pad(guess)} is too high. Guess lower — the target sits below it. Band narrowed to ${pad(state.low)}—${pad(state.high)}.`)
        playHighSound()
    }

    focusInput()
}

function useHint() {
    if (state.gameOver || state.hintsLeft <= 0) return

    state.hintsLeft -= 1
    state.attemptsUsed += 1
    state.attemptsLeft -= 1

    updateAttempts()
    updateHintControl()

    if (state.attemptsLeft <= 0) {
        finishLoss()
        return
    }

    const parity = state.secret % 2 === 0 ? 'even' : 'odd'
    let position

    if (state.low === state.high) {
        position = 'the remaining band has collapsed to a single candidate'
    } else {
        const midpoint = Math.floor((state.low + state.high) / 2)
        const half = state.secret <= midpoint ? 'lower' : 'upper'
        position = `it sits in the ${half} half of the remaining band`
    }

    setFeedback('hint', `The target is ${parity}, and ${position}. The number itself remains sealed.`)
    playHintSound()
    input.focus({ preventScroll: true })
    input.select()
}

diffButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const config = DIFFICULTIES[button.dataset.key]
        if (!config) return
        newGame(config)
    })
})

form.addEventListener('submit', handleGuess)
hintBtn.addEventListener('click', useHint)
newGameBtn.addEventListener('click', () => newGame())

soundToggle.addEventListener('click', () => {
    state.soundOn = !state.soundOn
    soundToggle.setAttribute('aria-pressed', String(state.soundOn))
    soundToggle.setAttribute('aria-label', state.soundOn ? 'Mute sound' : 'Enable sound')
    soundLabel.textContent = state.soundOn ? 'AUDIO ON' : 'AUDIO OFF'
    if (state.soundOn) {
        ensureAudio()
        playTone(660, 0.06, 'sine', 0, 0.02)
    }
})

function primeAudio() {
    if (state.soundOn) ensureAudio()
}

document.addEventListener('pointerdown', primeAudio, { once: true })
document.addEventListener('keydown', primeAudio, { once: true })

newGame(DIFFICULTIES.classic)
