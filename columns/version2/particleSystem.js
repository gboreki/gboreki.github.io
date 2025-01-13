class ParticleSystem {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.canvas.id = 'particleCanvas';
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const gameBoard = document.querySelector('.game-board');
        if (gameBoard) {
            this.canvas.width = gameBoard.offsetWidth;
            this.canvas.height = gameBoard.offsetHeight;
            this.canvas.style.position = 'absolute';
            this.canvas.style.left = gameBoard.offsetLeft + 'px';
            this.canvas.style.top = gameBoard.offsetTop + 'px';
            this.canvas.style.pointerEvents = 'none';
            this.canvas.style.zIndex = '10';
        }
    }

    createExplosion(x, y, color) {
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = 2 + Math.random() * 3; // Randomize velocity
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                color: color,
                life: 1,
                size: 3 + Math.random() * 2 // Randomize size
            });
        }
        // Start animation if not already running
        if (this.particles.length > 0 && !this.animating) {
            this.animating = true;
            this.update();
        }
    }

    update() {
        if (this.particles.length === 0) {
            this.animating = false;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.03; // Slower fade
            particle.size *= 0.95;

            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();

            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        requestAnimationFrame(() => this.update());
    }

    attach(container) {
        container.appendChild(this.canvas);
    }
}

export default ParticleSystem; 