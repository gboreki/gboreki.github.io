class Player {
    constructor() {
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;
        this.x = CANVAS_WIDTH / 2 - this.width / 2;
        this.y = CANVAS_HEIGHT - this.height - 10;
        this.speed = PLAYER_SPEED;
        this.lives = PLAYER_START_LIVES;
        this.bullets = [];
        this.lastShot = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.blinkOn = true;
    }

    reset() {
        this.x = CANVAS_WIDTH / 2 - this.width / 2;
        this.y = CANVAS_HEIGHT - this.height - 10;
        this.bullets = [];
        this.lastShot = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
    }

    fullReset() {
        this.reset();
        this.lives = PLAYER_START_LIVES;
    }

    update(keys) {
        if (keys['ArrowLeft'] || keys['KeyA']) {
            this.x -= this.speed;
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
            this.x += this.speed;
        }
        this.x = Math.max(0, Math.min(CANVAS_WIDTH - this.width, this.x));

        if (keys['Space']) {
            this.shoot();
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].y -= BONE_SPEED;
            if (this.bullets[i].y + BONE_HEIGHT < 0) {
                this.bullets.splice(i, 1);
            }
        }

        if (this.invincible) {
            this.invincibleTimer--;
            this.blinkOn = Math.floor(this.invincibleTimer / 4) % 2 === 0;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
                this.blinkOn = true;
            }
        }
    }

    shoot() {
        const now = performance.now();
        if (now - this.lastShot < PLAYER_SHOOT_COOLDOWN) return;
        this.lastShot = now;

        this.bullets.push({
            x: this.x + this.width / 2 - BONE_WIDTH / 2,
            y: this.y - BONE_HEIGHT,
            width: BONE_WIDTH,
            height: BONE_HEIGHT
        });

        Audio.play('shoot');
    }

    hit() {
        if (this.invincible) return false;
        this.lives--;
        this.invincible = true;
        this.invincibleTimer = 90;
        Audio.play('playerHit');
        return this.lives <= 0;
    }

    draw(ctx) {
        if (!this.blinkOn) return;

        const img = Assets.get('chihuahua');
        if (img && img.complete) {
            ctx.drawImage(img, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#d4a574';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        const boneImg = Assets.get('bone-treat');
        this.bullets.forEach(b => {
            if (boneImg && boneImg.complete) {
                ctx.drawImage(boneImg, b.x, b.y, b.width, b.height);
            } else {
                ctx.fillStyle = '#f5deb3';
                ctx.fillRect(b.x, b.y, b.width, b.height);
            }
        });
    }
}
