// ============================================
// DOM ELEMENTS
// ============================================
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

// ============================================
// GAME VARIABLES
// ============================================
let MIN = 1
let MAX = 100
let MAX_ATTEMPTS = 10
let secret = null
let attemptsLeft = MAX_ATTEMPTS
let attemptsUsed = 0
let gameOver = false
let previousGuess = null

// ============================================
// SOUND EFFECTS (Optional - no external libs)
// ============================================
const audioContext = new (window.AudioContext || window.webkitAudioContext)()

function playSound(frequency, duration, type = 'sine') {
    try {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = frequency
        oscillator.type = type

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + duration)
    } catch (e) {
        // Silently fail if audio context has issues
    }
}

function playSuccessSound() {
    playSound(523.25, 0.2) // C5
    setTimeout(() => playSound(659.25, 0.2), 100) // E5
    setTimeout(() => playSound(783.99, 0.4), 200) // G5
}

function playErrorSound() {
    playSound(200, 0.1)
    setTimeout(() => playSound(150, 0.2), 50)
}

function playHintSound() {
    playSound(440, 0.1) // A4
}

// ============================================
// PARTICLE ANIMATION
// ============================================
function createConfetti() {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f59e0b', '#10b981']
    
    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div')
        confetti.style.cssText = `
            position: fixed;
            width: 8px;
            height: 8px;
            background-color: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            animation: confettiFall ${2 + Math.random() * 2}s ease-out forwards;
            left: 50%;
            top: 50%;
        `
        document.body.appendChild(confetti)
        
        setTimeout(() => confetti.remove(), 4000)
    }
}

const style = document.createElement('style')
style.textContent = `
    @keyframes confettiFall {
        to {
            transform: translate(${(Math.random() - 0.5) * 300}px, 500px) rotate(360deg);
            opacity: 0;
        }
    }
`
document.head.appendChild(style)

// ============================================
// ANIMATION UTILITIES
// ============================================
function addBounceAnimation(element) {
    element.style.animation = 'none'
    setTimeout(() => {
        element.style.animation = 'bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
    }, 10)
}

function addShakeAnimation(element) {
    element.style.animation = 'none'
    setTimeout(() => {
        element.style.animation = 'shake 0.4s ease-in-out'
    }, 10)
}

// ============================================
// INITIALIZE GAME
// ============================================
function newGame(min = MIN, max = MAX, maxAttempts = MAX_ATTEMPTS) {
    MIN = min
    MAX = max
    MAX_ATTEMPTS = maxAttempts
    secret = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN
    attemptsLeft = MAX_ATTEMPTS
    attemptsUsed = 0
    gameOver = false
    previousGuess = null
    
    minValEl.textContent = MIN
    maxValEl.textContent = MAX
    rangeEl.textContent = `${MIN} - ${MAX}`
    attemptsEl.textContent = attemptsLeft
    
    messageEl.textContent = `I'm thinking of a number between ${MIN} and ${MAX}. Can you guess it?`
    messageEl.className = 'message-box'
    messageEl.style.borderLeftColor = '#6366f1'
    messageEl.style.background = 'linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%)'
    messageEl.style.color = '#1f2937'
    
    input.value = ''
    input.min = MIN
    input.max = MAX
    input.disabled = false
    input.focus()
    
    guessBtn.disabled = false
    restartBtn.textContent = '🔄 New Game'
}

// ============================================
// UPDATE BEST SCORE
// ============================================
function updateBest(score) {
    const prev = Number(localStorage.getItem('bestScore'))
    if (!prev || score < prev) {
        localStorage.setItem('bestScore', score)
        bestEl.textContent = score
        addBounceAnimation(bestEl.parentElement)
    } else {
        bestEl.textContent = prev
    }
}

// ============================================
// DISPLAY MESSAGE WITH STYLING
// ============================================
function displayMessage(text, type = 'info') {
    messageEl.textContent = text
    messageEl.className = 'message-box'
    messageEl.style.animation = 'none'
    
    setTimeout(() => {
        messageEl.style.animation = 'slideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
    }, 10)
    
    switch (type) {
        case 'success':
            messageEl.style.borderLeftColor = '#10b981'
            messageEl.style.background = 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
            messageEl.style.color = '#047857'
            playSuccessSound()
            createConfetti()
            addBounceAnimation(messageEl)
            break
        case 'error':
            messageEl.style.borderLeftColor = '#ef4444'
            messageEl.style.background = 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
            messageEl.style.color = '#991b1b'
            playErrorSound()
            addShakeAnimation(messageEl)
            break
        case 'hint':
            messageEl.style.borderLeftColor = '#f59e0b'
            messageEl.style.background = 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
            messageEl.style.color = '#92400e'
            playHintSound()
            break
        default:
            messageEl.style.borderLeftColor = '#6366f1'
            messageEl.style.background = 'linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%)'
            messageEl.style.color = '#1f2937'
    }
}

// ============================================
// FORM SUBMISSION
// ============================================
form.addEventListener('submit', (e) => {
    e.preventDefault()
    
    if (gameOver) return
    
    const guess = Number(input.value)
    
    // Validation
    if (!Number.isFinite(guess) || guess < MIN || guess > MAX) {
        displayMessage(`❌ Please enter a number between ${MIN} and ${MAX}.`, 'error')
        addShakeAnimation(input)
        return
    }
    
    attemptsUsed++
    attemptsLeft--
    attemptsEl.textContent = attemptsLeft
    addBounceAnimation(attemptsEl.parentElement)
    
    // Check if guess is correct
    if (guess === secret) {
        gameOver = true
        displayMessage(
            `🎉 Correct! You found it in ${attemptsUsed} ${attemptsUsed === 1 ? 'attempt' : 'attempts'}. Fantastic!`,
            'success'
        )
        updateBest(attemptsUsed)
        guessBtn.disabled = true
        input.disabled = true
        restartBtn.textContent = '🎮 Play Again'
    }
    // Check if out of attempts
    else if (attemptsLeft <= 0) {
        gameOver = true
        displayMessage(
            `💔 Game Over! The number was ${secret}. Better luck next time!`,
            'error'
        )
        guessBtn.disabled = true
        input.disabled = true
        restartBtn.textContent = '🎮 Play Again'
    }
    // Provide hint
    else {
        const difference = Math.abs(guess - secret)
        let hintText = ''
        
        if (difference === 1) {
            hintText = `🔥 Extremely close! You're ${guess < secret ? 'higher' : 'lower'} by just 1.`
        } else if (difference <= 5) {
            hintText = `🌡️ Very close! Try ${guess < secret ? 'higher' : 'lower'}.`
        } else if (difference <= 20) {
            hintText = `👍 Getting closer! Try ${guess < secret ? 'higher' : 'lower'}.`
        } else {
            hintText = `❄️ Still searching! Try ${guess < secret ? 'higher' : 'lower'}.`
        }
        
        hintText += ` Attempts left: ${attemptsLeft}`
        displayMessage(hintText, 'hint')
        previousGuess = guess
    }
    
    input.select()
})

// ============================================
// RESTART BUTTON
// ============================================
restartBtn.addEventListener('click', () => {
    newGame()
})

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && form.contains(document.activeElement)) {
        form.dispatchEvent(new Event('submit'))
    }
})

// ============================================
// INIT GAME ON PAGE LOAD
// ============================================
function init() {
    if (localStorage.getItem('bestScore')) {
        bestEl.textContent = localStorage.getItem('bestScore')
    }
    newGame()
}

// Start the game
init()
