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

export default Piece; 