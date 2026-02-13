class Enemy {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = ENEMY_WIDTH;
        this.height = ENEMY_HEIGHT;
        this.health = type.health;
        this.alive = true;
        this.movementPhase = Math.random() * Math.PI * 2;
        this.baseX = x;
        this.baseY = y;
    }
}

class EnemyManager {
    constructor() {
        this.enemies = [];
        this.projectiles = [];
        this.direction = 1;
        this.speed = ENEMY_BASE_SPEED;
        this.particles = [];
        this.gridOffsetX = 0;
        this.gridOffsetY = 0;
        this.dropAmount = 0;
        this.frameCount = 0;
    }

    reset() {
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.direction = 1;
        this.gridOffsetX = 0;
        this.gridOffsetY = 0;
        this.dropAmount = 0;
        this.frameCount = 0;
    }

    spawnGrid(rows, enemyTypesForWave) {
        this.reset();
        const cols = 8;
        const startX = (CANVAS_WIDTH - cols * (ENEMY_WIDTH + ENEMY_PADDING)) / 2;
        const startY = 50;

        for (let row = 0; row < rows; row++) {
            const typeIndex = row % enemyTypesForWave.length;
            const type = enemyTypesForWave[typeIndex];

            for (let col = 0; col < cols; col++) {
                const x = startX + col * (ENEMY_WIDTH + ENEMY_PADDING);
                const y = startY + row * (ENEMY_HEIGHT + ENEMY_PADDING);
                this.enemies.push(new Enemy(type, x, y));
            }
        }
    }

    update(waveNumber) {
        this.frameCount++;
        const aliveEnemies = this.enemies.filter(e => e.alive);
        if (aliveEnemies.length === 0) return;

        let minX = Infinity, maxX = -Infinity;
        aliveEnemies.forEach(e => {
            const ex = e.baseX + this.gridOffsetX;
            if (ex < minX) minX = ex;
            if (ex + e.width > maxX) maxX = ex + e.width;
        });

        if (maxX >= CANVAS_WIDTH - 5 && this.direction === 1) {
            this.direction = -1;
            this.dropAmount = ENEMY_DROP_DISTANCE;
        } else if (minX <= 5 && this.direction === -1) {
            this.direction = 1;
            this.dropAmount = ENEMY_DROP_DISTANCE;
        }

        this.gridOffsetX += this.speed * this.direction;

        if (this.dropAmount > 0) {
            const dropStep = 2;
            this.gridOffsetY += dropStep;
            this.dropAmount -= dropStep;
        }

        aliveEnemies.forEach(e => {
            let offsetX = 0;
            let offsetY = 0;

            switch (e.type.movement) {
                case 'zigzag':
                    offsetX = Math.sin(this.frameCount * 0.05 + e.movementPhase) * 15;
                    break;
                case 'sway':
                    offsetX = Math.sin(this.frameCount * 0.02 + e.movementPhase) * 25;
                    offsetY = Math.cos(this.frameCount * 0.03 + e.movementPhase) * 5;
                    break;
                case 'bounce':
                    offsetY = Math.abs(Math.sin(this.frameCount * 0.04 + e.movementPhase)) * 10;
                    break;
                case 'aggressive':
                    offsetX = Math.sin(this.frameCount * 0.06 + e.movementPhase) * 12;
                    offsetY = Math.sin(this.frameCount * 0.03 + e.movementPhase) * 8;
                    break;
            }

            e.x = e.baseX + this.gridOffsetX + offsetX;
            e.y = e.baseY + this.gridOffsetY + offsetY;

            const waveShootBoost = 1 + (waveNumber - 1) * 0.15;
            if (e.type.canShoot && Math.random() < e.type.shootChance * waveShootBoost) {
                this.projectiles.push({
                    x: e.x + e.width / 2 - ENEMY_PROJECTILE_WIDTH / 2,
                    y: e.y + e.height,
                    width: ENEMY_PROJECTILE_WIDTH,
                    height: ENEMY_PROJECTILE_HEIGHT
                });
                Audio.play('enemyShoot');
            }
        });

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.projectiles[i].y += ENEMY_PROJECTILE_SPEED;
            if (this.projectiles[i].y > CANVAS_HEIGHT) {
                this.projectiles.splice(i, 1);
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    checkBulletCollisions(bullets) {
        let score = 0;
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            for (let j = 0; j < this.enemies.length; j++) {
                const e = this.enemies[j];
                if (!e.alive) continue;

                if (this.collides(b, e)) {
                    bullets.splice(i, 1);
                    e.health--;

                    if (e.health <= 0) {
                        e.alive = false;
                        score += e.type.points;
                        this.spawnParticles(e.x + e.width / 2, e.y + e.height / 2, e.type);
                        Audio.play('hit');
                    } else {
                        Audio.play('hit');
                    }
                    break;
                }
            }
        }
        return score;
    }

    checkPlayerCollision(player) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            if (this.collides(p, player)) {
                this.projectiles.splice(i, 1);
                return true;
            }
        }

        const aliveEnemies = this.enemies.filter(e => e.alive);
        for (const e of aliveEnemies) {
            if (this.collides(e, player)) {
                return true;
            }
        }

        return false;
    }

    collides(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    spawnParticles(x, y, type) {
        const colors = {
            'Chew Toy': ['#ff6b6b', '#ff8e8e', '#ffa0a0'],
            'Ball': ['#7bed7b', '#a0ffa0', '#60d060'],
            'Stuffed Animal': ['#c49a6c', '#d4a574', '#e8c89e'],
            'Rubber Ducky': ['#ffdd57', '#ffe882', '#fff3b0'],
            'Sock': ['#8b5cf6', '#a78bfa', '#c4b5fd']
        };

        const particleColors = colors[type.name] || ['#fff', '#ccc', '#aaa'];

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: PARTICLE_LIFETIME + Math.random() * 10,
                color: particleColors[Math.floor(Math.random() * particleColors.length)],
                size: 3 + Math.random() * 4
            });
        }
    }

    allDefeated() {
        return this.enemies.length > 0 && this.enemies.every(e => !e.alive);
    }

    draw(ctx) {
        this.enemies.forEach(e => {
            if (!e.alive) return;

            const img = Assets.get(e.type.image);
            if (img && img.complete) {
                ctx.drawImage(img, e.x, e.y, e.width, e.height);
            } else {
                ctx.fillStyle = '#ff6b6b';
                ctx.fillRect(e.x, e.y, e.width, e.height);
            }

            if (e.type.health > 1 && e.health < e.type.health) {
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.font = '12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(e.health, e.x + e.width / 2, e.y - 4);
            }
        });

        const projImg = Assets.get('enemy-projectile');
        this.projectiles.forEach(p => {
            if (projImg && projImg.complete) {
                ctx.drawImage(projImg, p.x, p.y, p.width, p.height);
            } else {
                ctx.fillStyle = '#e94560';
                ctx.fillRect(p.x, p.y, p.width, p.height);
            }
        });

        this.particles.forEach(p => {
            const alpha = p.life / PARTICLE_LIFETIME;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }
}
