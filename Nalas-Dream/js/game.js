class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        this.player = new Player();
        this.enemyManager = new EnemyManager();
        this.pillow = new Pillow();
        this.keys = {};
        this.state = 'menu';
        this.score = 0;
        this.wave = 1;
        this.animFrame = null;
        this.waveTransition = false;
        this.waveTransitionTimer = 0;
        this.waveTransitionText = '';
        this.screenShake = 0;

        this.setupInput();
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    start() {
        this.score = 0;
        this.wave = 1;
        this.player.fullReset();
        this.startWave(this.wave);
        this.state = 'playing';
        this.updateHUD();
        this.hideOverlay();
        Audio.init();
        this.loop();
    }

    startWave(waveNumber) {
        const config = WaveManager.getWaveConfig(waveNumber);
        this.enemyManager.spawnGrid(config.rows, config.types);
        this.enemyManager.speed = config.speed;
        this.player.bullets = [];
        this.player.x = CANVAS_WIDTH / 2 - this.player.width / 2;
        this.pillow.reset(this.player.y);

        this.waveTransition = true;
        this.waveTransitionTimer = 120;
        this.waveTransitionText = `WAVE ${waveNumber}`;
    }

    loop() {
        if (this.state !== 'playing') return;

        this.update();
        this.draw();
        this.animFrame = requestAnimationFrame(() => this.loop());
    }

    update() {
        if (this.waveTransition) {
            this.waveTransitionTimer--;
            if (this.waveTransitionTimer <= 0) {
                this.waveTransition = false;
            }
            return;
        }

        this.player.update(this.keys);
        this.enemyManager.update(this.wave);
        this.pillow.update();

        this.pillow.checkProjectileCollision(this.enemyManager.projectiles);

        const points = this.enemyManager.checkBulletCollisions(this.player.bullets);
        if (points > 0) {
            this.score += points;
            this.updateHUD();
        }

        if (this.enemyManager.checkPlayerCollision(this.player)) {
            this.screenShake = 10;
            const dead = this.player.hit();
            this.enemyManager.projectiles = [];
            this.updateHUD();

            if (dead) {
                this.gameOver();
                return;
            }
        }

        if (this.screenShake > 0) this.screenShake--;

        if (this.enemyManager.allDefeated()) {
            Audio.play('waveComplete');
            this.wave++;
            this.startWave(this.wave);
            this.updateHUD();
        }
    }

    draw() {
        this.ctx.save();

        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(shakeX, shakeY);
        }

        this.ctx.fillStyle = '#0f3460';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        this.drawStars();

        this.enemyManager.draw(this.ctx);
        this.pillow.draw(this.ctx);
        this.player.draw(this.ctx);

        if (this.waveTransition) {
            const alpha = this.waveTransitionTimer > 90
                ? (120 - this.waveTransitionTimer) / 30
                : this.waveTransitionTimer > 30
                    ? 1
                    : this.waveTransitionTimer / 30;

            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 48px "Segoe UI", Tahoma, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(this.waveTransitionText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

            const config = WaveManager.getWaveConfig(this.wave);
            const typeNames = config.types.map(t => t.name).join(', ');
            this.ctx.font = '20px "Segoe UI", Tahoma, sans-serif';
            this.ctx.fillStyle = '#e94560';
            this.ctx.fillText(typeNames, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);

            this.ctx.globalAlpha = 1;
        }

        this.ctx.restore();
    }

    drawStars() {
        if (!this._stars) {
            this._stars = [];
            for (let i = 0; i < 60; i++) {
                this._stars.push({
                    x: Math.random() * CANVAS_WIDTH,
                    y: Math.random() * CANVAS_HEIGHT,
                    size: Math.random() * 2 + 0.5,
                    twinkle: Math.random() * Math.PI * 2
                });
            }
        }

        this._stars.forEach(s => {
            s.twinkle += 0.02;
            const alpha = 0.3 + Math.sin(s.twinkle) * 0.3;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }

    gameOver() {
        this.state = 'gameover';
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        Audio.play('gameOver');

        this.showGameOverOverlay();
    }

    updateHUD() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('wave').textContent = this.wave;

        const livesEl = document.getElementById('lives');
        livesEl.textContent = '';
        for (let i = 0; i < this.player.lives; i++) {
            livesEl.textContent += '\u{1F436} ';
        }

        document.getElementById('highscore').textContent = HighScores.getHighest();
    }

    showOverlay() {
        document.getElementById('overlay').classList.remove('hidden');
    }

    hideOverlay() {
        document.getElementById('overlay').classList.add('hidden');
    }

    showMenu() {
        const title = document.getElementById('overlay-title');
        const subtitle = document.getElementById('overlay-subtitle');
        const scoresDiv = document.getElementById('overlay-scores');
        const startBtn = document.getElementById('start-btn');
        const highscoreList = document.getElementById('highscore-list');

        title.textContent = "Nala's Dream";
        subtitle.textContent = 'Defend your turf from the invading toys!';
        scoresDiv.classList.add('hidden');
        highscoreList.classList.add('hidden');
        document.getElementById('name-input-wrapper').classList.add('hidden');
        startBtn.classList.remove('hidden');
        startBtn.textContent = 'START GAME';

        this.showOverlay();
    }

    showHighScores() {
        const highscoreList = document.getElementById('highscore-list');
        const scoreList = document.getElementById('score-list');
        const scores = HighScores.getScores();

        scoreList.innerHTML = '';
        if (scores.length === 0) {
            scoreList.innerHTML = '<li>No scores yet!</li>';
        } else {
            scores.forEach((s, i) => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="rank">#${i + 1}</span><span class="name">${s.name || '???'}</span><span class="score-info">${s.score} pts - W${s.wave}</span>`;
                scoreList.appendChild(li);
            });
        }

        highscoreList.classList.toggle('hidden');
    }
}

const HighScores = {
    STORAGE_KEY: 'chihuahua-invaders-highscores',

    getScores() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },

    addScore(name, score, wave) {
        const scores = this.getScores();
        scores.push({ name: name || '???', score, wave, date: new Date().toISOString() });
        scores.sort((a, b) => b.score - a.score);
        const top10 = scores.slice(0, 10);
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(top10));
        } catch {
            // storage not available
        }
    },

    getHighest() {
        const scores = this.getScores();
        return scores.length > 0 ? scores[0].score : 0;
    }
};
