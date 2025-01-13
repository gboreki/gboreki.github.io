class Piece {
    constructor() {
        this.position = { x: 4, y: 0 }; // Start at top-center
        this.colors = this.generateColors();
    }

    generateColors() {
        const possibleColors = ['red', 'blue', 'green', 'yellow', 'purple', 'cyan'];
        return Array(3).fill().map(() => 
            possibleColors[Math.floor(Math.random() * possibleColors.length)]
        );
    }

    moveLeft() {
        this.position.x--;
    }

    moveRight() {
        this.position.x++;
    }

    moveDown() {
        this.position.y++;
    }

    rotate() {
        // Rotate colors: last becomes first
        this.colors.unshift(this.colors.pop());
    }
}

class Game {
    constructor() {
        this.initializeState();
        this.setupControls();
        this.setupOverlay();
        this.setupTouchControls();
        this.resetGame(); // Start the game immediately
    }

    initializeState() {
        // Game board state
        this.board = Array(20).fill().map(() => Array(10).fill(null));
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
        this.isFirstGame = true;

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

        // Create the grid cells (only if first time or cells don't exist)
        const gameBoard = document.querySelector('.game-board');
        if (this.isFirstGame || gameBoard.children.length === 0) {
            gameBoard.innerHTML = '';
            for (let i = 0; i < 20 * 10; i++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                gameBoard.appendChild(cell);
            }
            this.isFirstGame = false;
        }
    }

    resetGame() {
        // Save high score before reset
        const highScore = localStorage.getItem('highScore') || 0;
        if (this.score > highScore) {
            localStorage.setItem('highScore', this.score);
        }

        // Reset game state
        this.initializeState();
        
        // Start new game
        this.currentPiece = new Piece();
        this.nextPiece = new Piece();
        this.updateDisplay();
        
        // Reset timing and start game loop
        this.lastDrop = performance.now();
        this.lastUpdate = performance.now();
        this.gameLoop(performance.now());
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
        
        setTimeout(() => message.remove(), 1500);
    }

    checkGameOver() {
        // Game is over if:
        // 1. Can't place new piece
        // 2. Board is filled up to top
        // 3. Piece would spawn inside existing blocks
        if (!this.canMove(this.currentPiece, 0, 0) || 
            this.board[0].some(cell => cell !== null)) {
            this.gameOver = true;
            const highScore = localStorage.getItem('highScore') || 0;
            const newHighScore = this.score > highScore;
            
            if (newHighScore) {
                localStorage.setItem('highScore', this.score);
                this.showOverlay(
                    `Game Over!\nNew High Score: ${this.score}!`,
                    'Play Again'
                );
            } else {
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

        gameBoard.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        gameBoard.addEventListener('touchmove', (e) => {
            if (!touchStartX || !touchStartY) return;

            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const deltaX = touchX - touchStartX;
            const deltaY = touchY - touchStartY;

            // Require minimum movement to trigger
            if (Math.abs(deltaX) > 30) {
                if (deltaX > 0) {
                    this.handleInput('ArrowRight');
                } else {
                    this.handleInput('ArrowLeft');
                }
                touchStartX = touchX;
            }

            if (deltaY > 30) {
                this.handleInput('ArrowDown');
                touchStartY = touchY;
            }

            e.preventDefault();
        });

        gameBoard.addEventListener('touchend', () => {
            touchStartX = null;
            touchStartY = null;
        });

        // Double tap for rotation
        let lastTap = 0;
        gameBoard.addEventListener('touchstart', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 300 && tapLength > 0) {
                this.handleInput('ArrowUp');
                e.preventDefault();
            }
            lastTap = currentTime;
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
                }
                break;
            case 'ArrowRight':
                if (this.canMove(this.currentPiece, 1, 0)) {
                    this.currentPiece.moveRight();
                }
                break;
            case 'ArrowDown':
                if (this.canMove(this.currentPiece, 0, 1)) {
                    this.currentPiece.moveDown();
                    this.score += 1;
                }
                break;
            case 'ArrowUp':
                this.currentPiece.rotate();
                break;
            case ' ':
                while (this.canMove(this.currentPiece, 0, 1)) {
                    this.currentPiece.moveDown();
                    this.score += 2;
                }
                this.lockPiece();
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
            } else {
                this.lockPiece();
            }
            this.lastDrop = timestamp;
        }

        this.updateSpeed();
    }

    render() {
        this.updateDisplay();
    }

    gameLoop(timestamp) {
        if (this.gameOver || this.isPaused) return;

        // Initialize timing if needed
        if (!this.lastUpdate) this.lastUpdate = timestamp;
        if (!this.lastRender) this.lastRender = timestamp;

        // Calculate time deltas
        const updateDelta = timestamp - this.lastUpdate;
        const renderDelta = timestamp - this.lastRender;

        // Update at fixed time step (16ms ≈ 60fps)
        if (updateDelta >= 16) {
            this.update(timestamp);
            this.lastUpdate = timestamp;
        }

        // Render as often as possible
        this.render();
        this.lastRender = timestamp;

        if (!this.gameOver && !this.isPaused) {
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }

    setupOverlay() {
        const overlay = document.getElementById('overlay');
        const overlayButton = document.getElementById('overlay-button');
        const overlayMessage = document.getElementById('overlay-message');

        overlayButton.addEventListener('click', () => {
            if (this.gameOver) {
                this.resetGame();
            } else {
                this.resume();
            }
            overlay.classList.remove('active');
        });
    }

    showOverlay(message, buttonText) {
        const overlay = document.getElementById('overlay');
        const overlayButton = document.getElementById('overlay-button');
        const overlayMessage = document.getElementById('overlay-message');
        
        overlay.classList.remove('active');
        void overlay.offsetWidth; // Force reflow
        
        overlayMessage.textContent = message;
        overlayButton.textContent = buttonText;
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
            if (checkY >= 0 && this.board[checkY][newX]) return false;
        }

        return true;
    }

    lockPiece() {
        const { x, y } = this.currentPiece.position;
        for (let i = 0; i < 3; i++) {
            if (y + i >= 0 && y + i < 20) {
                this.board[y + i][x] = this.currentPiece.colors[i];
            }
        }
        this.checkMatches();
        this.currentPiece = this.nextPiece;
        this.nextPiece = new Piece();

        // Check game over
        if (!this.canMove(this.currentPiece, 0, 0)) {
            this.gameOver = true;
            this.showOverlay('Game Over!\nScore: ' + this.score, 'Play Again');
        }
    }

    checkMatches() {
        let matchFound = false;
        const markedForClearing = Array(20).fill().map(() => Array(10).fill(false));
        const visited = Array(20).fill().map(() => Array(10).fill(false));

        // Helper function to find all connected cells of the same color
        const floodFill = (x, y, color) => {
            if (x < 0 || x >= 10 || y < 0 || y >= 20 || 
                visited[y][x] || this.board[y][x] !== color) {
                return;
            }

            visited[y][x] = true;
            markedForClearing[y][x] = true;

            // Check all adjacent cells
            floodFill(x, y - 1, color); // up
            floodFill(x + 1, y, color); // right
            floodFill(x, y + 1, color); // down
            floodFill(x - 1, y, color); // left
        };

        // Check vertical matches (3+ in a column)
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 18; y++) {
                if (!this.board[y][x]) continue;
                
                let matchLength = 1;
                let color = this.board[y][x];
                
                // Count consecutive cells of same color
                while (y + matchLength < 20 && 
                       this.board[y + matchLength][x] === color) {
                    matchLength++;
                }
                
                // If we found a match of 3 or more
                if (matchLength >= 3) {
                    matchFound = true;
                    // Flood fill from each cell in the match
                    for (let i = 0; i < matchLength; i++) {
                        floodFill(x, y + i, color);
                    }
                }
            }
        }

        // Check horizontal matches (3+ in a row)
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 8; x++) {
                if (!this.board[y][x]) continue;
                
                let matchLength = 1;
                let color = this.board[y][x];
                
                // Count consecutive cells of same color
                while (x + matchLength < 10 && 
                       this.board[y][x + matchLength] === color) {
                    matchLength++;
                }
                
                // If we found a match of 3 or more
                if (matchLength >= 3) {
                    matchFound = true;
                    // Flood fill from each cell in the match
                    for (let i = 0; i < matchLength; i++) {
                        floodFill(x + i, y, color);
                    }
                }
            }
        }

        // Clear matched cells and calculate score
        if (matchFound) {
            let clearedCells = 0;
            let linesCleared = new Set(); // Track unique lines cleared
            const cells = document.querySelectorAll('.cell');

            // Count cleared cells and lines
            for (let y = 0; y < 20; y++) {
                for (let x = 0; x < 10; x++) {
                    if (markedForClearing[y][x]) {
                        clearedCells++;
                        linesCleared.add(y);
                    }
                }
            }

            // Update lines cleared count
            this.linesCleared += linesCleared.size;

            // Bonus points for clearing multiple lines at once
            const lineBonus = [0, 100, 300, 500, 800];
            this.score += clearedCells * 10 + (lineBonus[linesCleared.size] || 1000);

            // First, animate the matches
            for (let y = 0; y < 20; y++) {
                for (let x = 0; x < 10; x++) {
                    if (markedForClearing[y][x]) {
                        const cell = cells[y * 10 + x];
                        cell.classList.add('match');
                        clearedCells++;
                    }
                }
            }

            // Wait for animation to complete before clearing
            setTimeout(() => {
                for (let y = 0; y < 20; y++) {
                    for (let x = 0; x < 10; x++) {
                        if (markedForClearing[y][x]) {
                            this.board[y][x] = null;
                            cells[y * 10 + x].classList.remove('match');
                        }
                    }
                }
                
                // Apply gravity and update score
                this.applyGravity();
                this.score += clearedCells * 10;
                this.updateDisplay();
                
                // Recursively check for new matches after gravity
                this.checkMatches();
            }, 500); // Match animation duration
        }
    }

    applyGravity() {
        // For each column
        for (let x = 0; x < 10; x++) {
            // Start from the bottom, find empty cells and pull down cells above them
            for (let y = 19; y >= 0; y--) {
                if (this.board[y][x] === null) {
                    // Find the first non-empty cell above
                    let sourceY = y - 1;
                    while (sourceY >= 0 && this.board[sourceY][x] === null) {
                        sourceY--;
                    }
                    
                    // If we found a non-empty cell, move it down
                    if (sourceY >= 0) {
                        this.board[y][x] = this.board[sourceY][x];
                        this.board[sourceY][x] = null;
                    }
                }
            }
        }
    }

    updateDisplay() {
        const cells = document.querySelectorAll('.cell');
        const previewCells = document.querySelectorAll('.preview-cell');
        
        // Reset all cells to default state
        cells.forEach(cell => {
            cell.style.removeProperty('--ghost-color');
            cell.style.backgroundColor = 'var(--cell-bg)';
            cell.classList.remove('ghost', 'match');
        });

        // Draw the board state (locked pieces)
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                if (this.board[y][x]) {
                    const cell = cells[y * 10 + x];
                    cell.style.backgroundColor = this.board[y][x];
                }
            }
        }

        // Draw current piece with ghost piece
        if (this.currentPiece) {
            const { x } = this.currentPiece.position;
            
            // Calculate ghost position
            let ghostY = this.currentPiece.position.y;
            while (this.canMove(this.currentPiece, 0, ghostY - this.currentPiece.position.y + 1)) {
                ghostY++;
            }

            // Draw ghost piece first (if it's not in the same position as the actual piece)
            if (ghostY !== this.currentPiece.position.y) {
                this.currentPiece.colors.forEach((color, i) => {
                    if (ghostY + i >= 0 && ghostY + i < 20 && !this.board[ghostY + i][x]) {
                        const cell = cells[(ghostY + i) * 10 + x];
                        cell.style.setProperty('--ghost-color', color);
                        cell.classList.add('ghost');
                    }
                });
            }

            // Draw actual piece (always on top)
            const y = this.currentPiece.position.y;
            this.currentPiece.colors.forEach((color, i) => {
                if (y + i >= 0 && y + i < 20) {
                    const cell = cells[(y + i) * 10 + x];
                    cell.style.backgroundColor = color;
                    cell.classList.remove('ghost');
                }
            });
        }

        // Update preview
        this.nextPiece.colors.forEach((color, i) => {
            previewCells[i].style.backgroundColor = color;
        });

        // Update score and level
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
    }
}

// Start the game
const game = new Game(); 