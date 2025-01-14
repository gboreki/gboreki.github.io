import ParticleSystem from './particleSystem.js';

class Board {
    constructor(width = 10, height = 20) {
        this.width = width;
        this.height = height;
        this.grid = Array(height).fill().map(() => Array(width).fill(null));
        this.element = document.querySelector('.game-board');
        this.particles = new ParticleSystem();
        this.initializeBoard();
        this.particles.attach(document.querySelector('.game-container'));
    }

    initializeBoard() {
        // Create the grid cells
        this.element.innerHTML = '';
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                this.element.appendChild(cell);
            }
        }
    }

    updateDisplay(currentPiece = null) {
        const cells = this.element.querySelectorAll('.cell');
        
        // Reset all cells to default state
        cells.forEach(cell => {
            cell.style.backgroundColor = '#111';
            cell.classList.remove('ghost', 'match');
        });

        // Draw the board state (locked pieces)
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x]) {
                    const cell = cells[y * this.width + x];
                    cell.style.backgroundColor = this.grid[y][x];
                }
            }
        }

        // Draw current piece if provided
        if (currentPiece) {
            const { x, y } = currentPiece.position;
            currentPiece.colors.forEach((color, i) => {
                if (y + i >= 0 && y + i < this.height) {
                    const cell = cells[(y + i) * this.width + x];
                    cell.style.backgroundColor = color;
                }
            });
        }
    }

    clearMatch(matches) {
        const cells = this.element.querySelectorAll('.cell');
        matches.forEach(({x, y}) => {
            const cell = cells[y * this.width + x];
            const color = this.grid[y][x];
            
            // Add break animation
            cell.classList.add('break');
            
            // Create particle effect
            const rect = cell.getBoundingClientRect();
            const gameRect = this.element.getBoundingClientRect();
            const cellCenterX = rect.left - gameRect.left + rect.width / 2;
            const cellCenterY = rect.top - gameRect.top + rect.height / 2;
            
            // Create multiple particle explosions for each cell
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    this.particles.createExplosion(
                        cellCenterX,
                        cellCenterY,
                        color
                    );
                }, i * 100); // Stagger the explosions
            }

            // Clear cell after animation
            setTimeout(() => {
                this.grid[y][x] = null;
                cell.style.backgroundColor = '#111';
                cell.classList.remove('break');
            }, 300);
        });
    }

    checkMatches() {
        let matchFound = false;
        const markedForClearing = Array(this.height).fill().map(() => Array(this.width).fill(false));
        const visited = Array(this.height).fill().map(() => Array(this.width).fill(false));
        const matchesToClear = [];

        // Helper function to find all connected cells of the same color
        const floodFill = (x, y, color) => {
            if (x < 0 || x >= this.width || y < 0 || y >= this.height || 
                visited[y][x] || this.grid[y][x] !== color) {
                return;
            }

            visited[y][x] = true;
            markedForClearing[y][x] = true;
            matchesToClear.push({x, y});

            // Check all adjacent cells
            floodFill(x, y - 1, color); // up
            floodFill(x + 1, y, color); // right
            floodFill(x, y + 1, color); // down
            floodFill(x - 1, y, color); // left
        };

        // Check vertical matches (3+ in a column)
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height - 2; y++) {
                if (!this.grid[y][x]) continue;
                
                let matchLength = 1;
                let color = this.grid[y][x];
                
                // Count consecutive cells of same color
                while (y + matchLength < this.height && 
                       this.grid[y + matchLength][x] === color) {
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
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width - 2; x++) {
                if (!this.grid[y][x]) continue;
                
                let matchLength = 1;
                let color = this.grid[y][x];
                
                // Count consecutive cells of same color
                while (x + matchLength < this.width && 
                       this.grid[y][x + matchLength] === color) {
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
            // Call clearMatch with the matches found
            this.clearMatch(matchesToClear);
            
            // Apply gravity after a delay to allow animations to complete
            setTimeout(() => {
                this.applyGravity();
                this.updateDisplay();
                
                // Recursively check for new matches after gravity
                this.checkMatches();
            }, 500); // Match animation duration

            return matchesToClear.length; // Return number of cells cleared for scoring
        }

        return 0;
    }

    applyGravity() {
        // For each column
        for (let x = 0; x < this.width; x++) {
            // Start from the bottom, find empty cells and pull down cells above them
            for (let y = this.height - 1; y >= 0; y--) {
                if (this.grid[y][x] === null) {
                    // Find the first non-empty cell above
                    let sourceY = y - 1;
                    while (sourceY >= 0 && this.grid[sourceY][x] === null) {
                        sourceY--;
                    }
                    
                    // If we found a non-empty cell, move it down
                    if (sourceY >= 0) {
                        this.grid[y][x] = this.grid[sourceY][x];
                        this.grid[sourceY][x] = null;
                    }
                }
            }
        }
    }
}

export default Board; 