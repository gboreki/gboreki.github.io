import Piece from './piece.js';
import Board from './board.js';
import LeaderboardManager from './leaderboardManager.js';
import SoundManager from './soundManager.js';

class Game {
    constructor() {
        this.leaderboardManager = new LeaderboardManager();
        this.soundManager = new SoundManager();
        this.initializeState();
        this.setupControls();
        this.setupOverlay();
        this.setupTouchControls();
        this.setupLeaderboard();
        this.setupGameControls();
        this.resetGame(); // Start the game immediately
    }

    initializeState() {
        // Game board state
        this.board = new Board();
        this.currentPiece = null;
        this.nextPiece = null;

        // Scoring and progression
        this.score = 0;
        this.level = 1;
        this.linesCleared = 0;
        this.dropInterval = 1000;

        // Game state flags
        this.gameOver = false;
        this.isPaused = false;

        // Timing variables
        this.lastDrop = 0;
        this.lastUpdate = 0;
        this.lastRender = 0;

        // Input handling
        this.keyStates = new Map();
        this.keyRepeatDelays = {
            'ArrowLeft': { initial: 150, repeat: 50 },
            'ArrowRight': { initial: 150, repeat: 50 },
            'ArrowDown': { initial: 50, repeat: 50 }
        };
    }

    resetGame() {
        // Reset game state
        this.initializeState();
        
        // Start new game
        this.currentPiece = new Piece();
        this.nextPiece = new Piece();
        this.updateDisplay();
        
        // Reset timing and start game loop
        this.lastDrop = null;
        this.lastUpdate = null;
        this.lastRender = null;
        this.gameOver = false;
        this.isPaused = false;
        requestAnimationFrame(this.gameLoop.bind(this));

        // Show current high score
        const scores = this.leaderboardManager.getScores();
        const highScore = scores.length > 0 ? scores[0].score : 0;
        this.showHighScore(highScore);
    }

    showHighScore(highScore) {
        const scoreContainer = document.querySelector('.score-container');
        if (!document.getElementById('high-score')) {
            const highScoreDiv = document.createElement('div');
            highScoreDiv.id = 'high-score';
            highScoreDiv.innerHTML = `<small>High Score: ${highScore}</small>`;
            scoreContainer.appendChild(highScoreDiv);
        } else {
            document.getElementById('high-score').innerHTML = `<small>High Score: ${highScore}</small>`;
        }
    }

    updateScore(points) {
        this.score += points;
        document.getElementById('score').textContent = this.score;
        
        // Check if current score is approaching high score
        const scores = this.leaderboardManager.getScores();
        const highScore = scores.length > 0 ? scores[0].score : 0;
        
        if (this.score > highScore) {
            this.showHighScoreAnimation();
        }
    }

    showHighScoreAnimation() {
        const scoreElement = document.getElementById('score');
        scoreElement.classList.add('new-high-score');
        this.soundManager.play('highScore');
        setTimeout(() => scoreElement.classList.remove('new-high-score'), 1000);
    }

    pause() {
        if (!this.gameOver) {
            this.isPaused = true;
            this.showOverlay('Game Paused', 'Resume');
        }
    }

    resume() {
        if (!this.gameOver) {
            this.isPaused = false;
            this.lastDrop = performance.now();
            this.lastUpdate = performance.now();
            requestAnimationFrame(this.gameLoop.bind(this));
            document.getElementById('overlay').classList.remove('active');
        }
    }

    updateSpeed() {
        // Calculate level based on lines cleared instead of score
        const newLevel = Math.floor(this.linesCleared / 10) + 1;
        if (newLevel !== this.level) {
            this.level = newLevel;
            // Decrease interval by 10% per level, but not below 100ms
            this.dropInterval = Math.max(100, 1000 * Math.pow(0.9, this.level - 1));
            // Show level up message
            this.showLevelUpMessage();
        }
    }

    showLevelUpMessage() {
        const message = document.createElement('div');
        message.textContent = `Level ${this.level}!`;
        message.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 24px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            animation: levelUp 1.5s ease-out forwards;
            pointer-events: none;
        `;
        document.querySelector('.game-board').appendChild(message);
        this.soundManager.play('levelUp');
        setTimeout(() => message.remove(), 1500);
    }

    checkGameOver() {
        // Game is over if:
        // 1. Can't place new piece
        // 2. Board is filled up to top
        // 3. Piece would spawn inside existing blocks
        if (!this.canMove(this.currentPiece, 0, 0) || 
            this.board.grid[0].some(cell => cell !== null)) {
            this.gameOver = true;
            
            if (this.leaderboardManager.isHighScore(this.score)) {
                this.showOverlay(
                    `New High Score: ${this.score}!\nEnter your name:`,
                    'Submit Score'
                );
                // We'll add the name input UI in the next task
            } else {
                const scores = this.leaderboardManager.getScores();
                const highScore = scores.length > 0 ? scores[0].score : 0;
                this.showOverlay(
                    `Game Over!\nScore: ${this.score}\nHigh Score: ${highScore}`,
                    'Play Again'
                );
            }
            return true;
        }
        return false;
    }

    setupTouchControls() {
        const gameBoard = document.querySelector('.game-board');
        let touchStartX = null;
        let touchStartY = null;
        let touchStartTime = null;
        const SWIPE_THRESHOLD = 30;
        const TAP_THRESHOLD = 200; // milliseconds
        let lastTapTime = 0;

        gameBoard.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
            e.preventDefault();
        });

        gameBoard.addEventListener('touchmove', (e) => {
            if (!touchStartX || !touchStartY) return;

            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const deltaX = touchX - touchStartX;
            const deltaY = touchY - touchStartY;
            const deltaTime = Date.now() - touchStartTime;

            // If it's a quick swipe (less than 300ms), use smaller threshold
            const threshold = deltaTime < 300 ? SWIPE_THRESHOLD / 2 : SWIPE_THRESHOLD;

            // Determine the dominant direction of the swipe
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (Math.abs(deltaX) > threshold) {
                    if (deltaX > 0) {
                        this.handleInput('ArrowRight');
                    } else {
                        this.handleInput('ArrowLeft');
                    }
                    touchStartX = touchX;
                }
            } else {
                // Vertical swipe
                if (Math.abs(deltaY) > threshold) {
                    if (deltaY > 0) {
                        this.handleInput('ArrowDown');
                    } else {
                        // Swipe up for rotation
                        this.handleInput('ArrowUp');
                    }
                    touchStartY = touchY;
                }
            }

            e.preventDefault();
        });

        gameBoard.addEventListener('touchend', (e) => {
            const deltaTime = Date.now() - touchStartTime;
            const currentTime = Date.now();

            // Handle taps for rotation
            if (deltaTime < TAP_THRESHOLD) {
                if (currentTime - lastTapTime < 300) {
                    // Double tap detected
                    this.handleInput('ArrowUp');
                    lastTapTime = 0; // Reset to prevent triple-tap
                } else {
                    lastTapTime = currentTime;
                }
            }

            touchStartX = null;
            touchStartY = null;
            touchStartTime = null;
            e.preventDefault();
        });

        // Prevent default touch behaviors
        gameBoard.addEventListener('touchcancel', (e) => {
            touchStartX = null;
            touchStartY = null;
            touchStartTime = null;
            e.preventDefault();
        });

        // Hard drop on double tap
        let lastDoubleTapTime = 0;
        gameBoard.addEventListener('touchstart', (e) => {
            const currentTime = Date.now();
            if (currentTime - lastDoubleTapTime < 300) {
                // Triple tap detected - hard drop
                this.handleInput(' '); // Space for hard drop
                e.preventDefault();
            }
            lastDoubleTapTime = currentTime;
        });
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.keyStates.has(e.key)) {
                this.keyStates.set(e.key, {
                    pressed: true,
                    lastAction: performance.now()
                });
                this.handleInput(e.key);
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keyStates.delete(e.key);
        });
    }

    handleInput(key) {
        if (this.gameOver) return;

        if (key === 'Escape') {
            if (this.isPaused) {
                this.resume();
            } else {
                this.pause();
            }
            return;
        }

        if (this.isPaused) return;

        switch (key) {
            case 'ArrowLeft':
                if (this.canMove(this.currentPiece, -1, 0)) {
                    this.currentPiece.moveLeft();
                    this.updateDisplay();
                }
                break;
            case 'ArrowRight':
                if (this.canMove(this.currentPiece, 1, 0)) {
                    this.currentPiece.moveRight();
                    this.updateDisplay();
                }
                break;
            case 'ArrowDown':
                if (this.canMove(this.currentPiece, 0, 1)) {
                    this.currentPiece.moveDown();
                    this.score += 1;
                    this.updateDisplay();
                }
                break;
            case 'ArrowUp':
                this.currentPiece.rotate();
                this.updateDisplay();
                break;
            case ' ':
                while (this.canMove(this.currentPiece, 0, 1)) {
                    this.currentPiece.moveDown();
                    this.score += 2;
                }
                this.lockPiece();
                this.updateDisplay();
                break;
        }
    }

    update(timestamp) {
        // Handle key repeats
        for (const [key, state] of this.keyStates.entries()) {
            const delay = this.keyRepeatDelays[key];
            if (delay) {
                const timeSinceLastAction = timestamp - state.lastAction;
                const requiredDelay = state.firstRepeat ? delay.repeat : delay.initial;
                
                if (timeSinceLastAction >= requiredDelay) {
                    this.handleInput(key);
                    state.lastAction = timestamp;
                    state.firstRepeat = true;
                }
            }
        }

        // Update game state
        if (timestamp - this.lastDrop > this.dropInterval) {
            if (this.canMove(this.currentPiece, 0, 1)) {
                this.currentPiece.moveDown();
                this.updateDisplay();
            } else {
                this.lockPiece();
            }
            this.lastDrop = timestamp;
        }

        this.updateSpeed();
    }

    gameLoop(timestamp) {
        if (this.gameOver || this.isPaused) {
            // Ensure the game is completely stopped
            this.lastUpdate = null;
            this.lastRender = null;
            this.lastDrop = null;
            return;
        }

        // Initialize timing if needed
        if (!this.lastUpdate) this.lastUpdate = timestamp;
        if (!this.lastRender) this.lastRender = timestamp;
        if (!this.lastDrop) this.lastDrop = timestamp;

        // Calculate time deltas
        const updateDelta = timestamp - this.lastUpdate;
        const renderDelta = timestamp - this.lastRender;

        // Update at fixed time step (16ms ≈ 60fps)
        if (updateDelta >= 16) {
            this.update(timestamp);
            this.lastUpdate = timestamp;
        }

        // Render as often as possible
        this.updateDisplay();
        this.lastRender = timestamp;

        if (!this.gameOver && !this.isPaused) {
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }

    setupOverlay() {
        const overlay = document.getElementById('overlay');
        const overlayButton = document.getElementById('overlay-button');
        const overlayMessage = document.getElementById('overlay-message');
        const nameForm = document.getElementById('name-input-form');

        overlayButton.addEventListener('click', () => {
            if (this.gameOver) {
                if (nameForm.style.display === 'block') {
                    // Handle name submission
                    const nameInput = document.getElementById('player-name');
                    if (this.validateAndSubmitName(nameInput.value)) {
                        this.resetGame();
                        overlay.classList.remove('active');
                        nameForm.style.display = 'none';
                    }
                } else {
                    this.resetGame();
                    overlay.classList.remove('active');
                }
            } else {
                this.resume();
            }
        });

        // Handle form submission
        nameForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('player-name');
            if (this.validateAndSubmitName(nameInput.value)) {
                this.resetGame();
                overlay.classList.remove('active');
                nameForm.style.display = 'none';
            }
        });
    }

    validateAndSubmitName(name) {
        const nameInput = document.getElementById('player-name');
        const errorDiv = document.querySelector('.name-input-error');
        const trimmedName = name.trim();

        // Validation rules
        if (!trimmedName) {
            errorDiv.textContent = 'Please enter your name';
            nameInput.focus();
            return false;
        }
        if (trimmedName.length < 2) {
            errorDiv.textContent = 'Name must be at least 2 characters';
            nameInput.focus();
            return false;
        }
        if (!/^[A-Za-z0-9 ]+$/.test(trimmedName)) {
            errorDiv.textContent = 'Only letters, numbers, and spaces allowed';
            nameInput.focus();
            return false;
        }

        // Submit score and update leaderboard
        this.leaderboardManager.addScore(trimmedName, this.score);
        this.updateLeaderboard();
        this.soundManager.play('highScore');
        return true;
    }

    showOverlay(message, buttonText) {
        const overlay = document.getElementById('overlay');
        const overlayButton = document.getElementById('overlay-button');
        const overlayMessage = document.getElementById('overlay-message');
        const nameForm = document.getElementById('name-input-form');
        const nameInput = document.getElementById('player-name');
        const errorDiv = document.querySelector('.name-input-error');
        
        overlay.classList.remove('active');
        void overlay.offsetWidth; // Force reflow
        
        overlayMessage.textContent = message;
        overlayButton.textContent = buttonText;

        // Show/hide name input form based on context
        if (buttonText === 'Submit Score') {
            nameForm.style.display = 'block';
            nameInput.value = '';
            errorDiv.textContent = '';
            // Focus the input after the overlay animation
            setTimeout(() => nameInput.focus(), 300);
        } else {
            nameForm.style.display = 'none';
        }
        
        overlay.classList.add('active');
    }

    canMove(piece, deltaX, deltaY) {
        const newX = piece.position.x + deltaX;
        const newY = piece.position.y + deltaY;

        // Check horizontal bounds
        if (newX < 0 || newX >= 10) return false;

        // Check vertical bounds and collision with locked pieces
        for (let i = 0; i < 3; i++) {
            const checkY = newY + i;
            if (checkY >= 20) return false;
            if (checkY >= 0 && this.board.grid[checkY][newX]) return false;
        }

        return true;
    }

    lockPiece() {
        const { x, y } = this.currentPiece.position;
        for (let i = 0; i < 3; i++) {
            if (y + i >= 0 && y + i < 20) {
                this.board.grid[y + i][x] = this.currentPiece.colors[i];
            }
        }
        
        // Check for matches and update score
        const clearedCells = this.board.checkMatches();
        if (clearedCells > 0) {
            // Update lines cleared count
            this.linesCleared += Math.floor(clearedCells / 3);
            
            // Bonus points for clearing multiple cells at once
            const lineBonus = [0, 100, 300, 500, 800];
            const points = clearedCells * 10 + (lineBonus[Math.floor(clearedCells / 3)] || 1000);
            this.updateScore(points);
            this.soundManager.play('match');
        }

        this.currentPiece = this.nextPiece;
        this.nextPiece = new Piece();

        // Check game over
        if (!this.canMove(this.currentPiece, 0, 0)) {
            this.gameOver = true;
            this.handleGameOver();
        }
    }

    handleGameOver() {
        this.gameOver = true;
        // Ensure game stops immediately
        this.isPaused = true;
        
        const scores = this.leaderboardManager.getScores();
        const highScore = scores.length > 0 ? scores[0].score : 0;
        const isNewHighScore = this.leaderboardManager.isHighScore(this.score);
        
        let message = `Game Over!\nScore: ${this.score}`;
        if (isNewHighScore) {
            message = `New High Score: ${this.score}!\nEnter your name:`;
            this.showOverlay(message, 'Submit Score');
        } else {
            const rank = this.getScoreRank();
            message += `\nHigh Score: ${highScore}`;
            if (rank <= this.leaderboardManager.maxEntries) {
                message += `\nRank: ${rank}`;
            }
            this.showOverlay(message, 'Play Again');
        }
    }

    getScoreRank() {
        const scores = this.leaderboardManager.getScores();
        for (let i = 0; i < scores.length; i++) {
            if (this.score >= scores[i].score) {
                return i + 1;
            }
        }
        return scores.length + 1;
    }

    updateDisplay() {
        // Update game board with current piece
        this.board.updateDisplay(this.currentPiece);

        // Update preview area
        const previewCells = document.querySelectorAll('.preview-cell');
        this.nextPiece.colors.forEach((color, i) => {
            previewCells[i].style.backgroundColor = color;
        });

        // Update score and level
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
    }

    setupLeaderboard() {
        const toggleBtn = document.getElementById('toggle-leaderboard');
        const leaderboard = document.getElementById('leaderboard');
        
        // Initial state - collapsed
        leaderboard.style.maxHeight = '0px';
        
        toggleBtn.addEventListener('click', () => {
            toggleBtn.classList.toggle('active');
            if (leaderboard.classList.contains('visible')) {
                leaderboard.classList.remove('visible');
                leaderboard.style.maxHeight = '0px';
            } else {
                leaderboard.classList.add('visible');
                leaderboard.style.maxHeight = '300px';
            }
            this.updateLeaderboard();
        });

        // Initial leaderboard population
        this.updateLeaderboard();
    }

    updateLeaderboard() {
        const entries = document.querySelector('.leaderboard-entries');
        const scores = this.leaderboardManager.getScores();
        
        entries.innerHTML = '';
        
        scores.forEach((score, index) => {
            const entry = document.createElement('div');
            entry.className = 'leaderboard-entry';
            if (this.gameOver && score.score === this.score) {
                entry.classList.add('highlight');
            }
            
            entry.innerHTML = `
                <span>${index + 1}</span>
                <span>${this.escapeHtml(score.name)}</span>
                <span>${score.score.toLocaleString()}</span>
                <span>${this.formatDate(new Date(score.date))}</span>
            `;
            
            entries.appendChild(entry);
        });

        if (scores.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'leaderboard-entry';
            emptyMessage.innerHTML = '<span colspan="4">No scores yet!</span>';
            entries.appendChild(emptyMessage);
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    formatDate(date) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }

    setupGameControls() {
        const muteButton = document.getElementById('mute-button');
        const clearButton = document.getElementById('clear-scores');

        // Setup mute button
        muteButton.textContent = this.soundManager.isSoundMuted() ? '🔈' : '🔊';
        muteButton.addEventListener('click', () => {
            const isMuted = this.soundManager.toggleMute();
            muteButton.textContent = isMuted ? '🔈' : '🔊';
            muteButton.classList.toggle('muted', isMuted);
        });

        // Setup clear scores button
        let clearTimeout;
        clearButton.addEventListener('click', () => {
            if (clearButton.classList.contains('clear-confirm')) {
                // Confirmed - clear scores
                this.leaderboardManager.clearLeaderboard();
                this.updateLeaderboard();
                clearButton.classList.remove('clear-confirm');
                clearButton.title = 'Clear Scores';
                if (clearTimeout) clearTimeout(clearTimeout);
            } else {
                // First click - ask for confirmation
                clearButton.classList.add('clear-confirm');
                clearButton.title = 'Click again to confirm';
                clearTimeout = setTimeout(() => {
                    clearButton.classList.remove('clear-confirm');
                    clearButton.title = 'Clear Scores';
                }, 3000);
            }
        });
    }
}

// Start the game (only once)
const game = new Game(); 