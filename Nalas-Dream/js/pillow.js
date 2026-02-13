class Pillow {
    constructor() {
        this.width = PILLOW_WIDTH;
        this.height = PILLOW_HEIGHT;
        this.x = CANVAS_WIDTH / 2 - this.width / 2;
        this.y = 0;
        this.health = PILLOW_MAX_HEALTH;
        this.maxHealth = PILLOW_MAX_HEALTH;
        this.alive = true;
        this.direction = 1;
        this.speed = PILLOW_SPEED;
        this.hitFlash = 0;
    }

    reset(playerY) {
        this.x = CANVAS_WIDTH / 2 - this.width / 2;
        this.y = playerY - this.height - PILLOW_OFFSET_Y;
        this.health = PILLOW_MAX_HEALTH;
        this.alive = true;
        this.hitFlash = 0;
    }

    update() {
        if (!this.alive) return;

        this.x += this.speed * this.direction;

        if (this.x + this.width >= CANVAS_WIDTH) {
            this.direction = -1;
        } else if (this.x <= 0) {
            this.direction = 1;
        }

        if (this.hitFlash > 0) this.hitFlash--;
    }

    hit() {
        if (!this.alive) return;
        this.health--;
        this.hitFlash = 10;
        if (this.health <= 0) {
            this.alive = false;
        }
    }

    checkProjectileCollision(projectiles) {
        if (!this.alive) return false;

        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            if (p.x < this.x + this.width &&
                p.x + p.width > this.x &&
                p.y < this.y + this.height &&
                p.y + p.height > this.y) {
                projectiles.splice(i, 1);
                this.hit();
                Audio.play('hit');
                return true;
            }
        }
        return false;
    }

    draw(ctx) {
        if (!this.alive) return;

        if (this.hitFlash > 0 && Math.floor(this.hitFlash / 2) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        const img = Assets.get('pillow');
        if (img && img.complete) {
            ctx.drawImage(img, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#b8a9c9';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        ctx.globalAlpha = 1;

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        const hearts = '';
        for (let i = 0; i < this.health; i++) {
            ctx.fillText('\u2764', this.x + this.width / 2 - 12 + i * 12, this.y - 4);
        }
    }
}
