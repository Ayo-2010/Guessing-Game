const minValEl = document.getElementById('minVal')
const maxValEl = document.getElementById('maxVal')
const rangeEl = document.getElementById('range')
const attemptsEl = document.getElementById('attempts')
const bestEl = document.getElementById('best')
const messageEl = document.getElementById('message')
const form = document.getElementById('guessForm')
const input = document.getElementById('guessInput')
const guessBtn = document.getElementById('guessBtn')
const restartBtn = document.getElementById('restartBtn')

let MIN = 1
let MAX = 100
let MAX_ATTEMPTS = 10
let secret = null
let attemptsLeft = MAX_ATTEMPTS
let attemptsUsed = 0

function newGame(min = MIN, max = MAX, maxAttempts = MAX_ATTEMPTS) {
    MIN = min
    MAX = max
    MAX_ATTEMPTS = maxAttempts
    secret = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN
    attemptsLeft = MAX_ATTEMPTS
    attemptsUsed = 0
    minValEl.textContent = MIN
    maxValEl.textContent = MAX
    rangeEl.textContent = `${MIN} - ${MAX}`
    attemptsEl.textContent = attemptsLeft
    messageEl.textContent = `I'm thinking of a number between ${MIN} and ${MAX}. Can you guess it?`
    input.value = ''
    input.min = MIN
    input.max = MAX
    input.focus()
}

function updateBest(score) {
    const prev = Number(localStorage.getItem('bestScore'))
    if (!prev || score < prev) {
        localStorage.setItem('bestScore', score)
        bestEl.textContent = score
    } else {
        bestEl.textContent = prev
    }
}

form.addEventListener('submit', (e) => {
    e.preventDefault()
    const guess = Number(input.value)
    if (!Number.isFinite(guess) || guess < MIN || guess > MAX) {
        messageEl.textContent = `Please enter a number between ${MIN} and ${MAX}.`
        return
    }
    attemptsUsed++
    attemptsLeft--
    attemptsEl.textContent = attemptsLeft

    if (guess === secret) {
        messageEl.textContent = `Correct! You found it in ${attemptsUsed} attempts.`
        updateBest(attemptsUsed)
        guessBtn.disabled = true
    } else if (attemptsLeft <= 0) {
        messageEl.textContent = `Game over — the number was ${secret}.`
        guessBtn.disabled = true
    } else {
        const hint = guess < secret ? 'higher' : 'lower'
        messageEl.textContent = `Wrong — try ${hint}. Attempts left: ${attemptsLeft}`
    }
    input.select()
})

restartBtn.addEventListener('click', () => {
    guessBtn.disabled = false
    newGame()
})

// Initialize best from localStorage
if (localStorage.getItem('bestScore')) bestEl.textContent = localStorage.getItem('bestScore')

// Start first game
newGame()