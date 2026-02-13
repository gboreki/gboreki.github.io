let game;
let menuAnimFrame;

window.addEventListener('DOMContentLoaded', async () => {
    await Assets.load();

    const canvas = document.getElementById('gameCanvas');
    game = new Game(canvas);

    game.updateHUD();
    game.showMenu();
    menuLoop();

    document.getElementById('start-btn').addEventListener('click', () => {
        if (menuAnimFrame) {
            cancelAnimationFrame(menuAnimFrame);
            menuAnimFrame = null;
        }
        game.start();
    });

    document.getElementById('scores-btn').addEventListener('click', () => {
        game.showHighScores();
    });

    document.getElementById('save-score-btn').addEventListener('click', () => {
        saveScore();
    });

    document.getElementById('player-name').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveScore();
        }
        e.stopPropagation();
    });

    document.getElementById('player-name').addEventListener('keyup', (e) => {
        e.stopPropagation();
    });
});

function saveScore() {
    const nameInput = document.getElementById('player-name');
    const name = nameInput.value.trim() || '???';
    HighScores.addScore(name, game.score, game.wave);

    document.getElementById('name-input-wrapper').classList.add('hidden');
    document.getElementById('start-btn').classList.remove('hidden');
    document.getElementById('start-btn').textContent = 'PLAY AGAIN';

    document.getElementById('highscore-display').querySelector('span').textContent = HighScores.getHighest();

    game.showHighScores();
    const highscoreList = document.getElementById('highscore-list');
    if (highscoreList.classList.contains('hidden')) {
        highscoreList.classList.remove('hidden');
    }
}

function menuLoop() {
    if (game.state === 'playing') return;
    game.drawMenuBackground();
    menuAnimFrame = requestAnimationFrame(menuLoop);
}

Game.prototype.drawMenuBackground = function () {
    this.ctx.fillStyle = '#0f3460';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.drawStars();

    const img = Assets.get('chihuahua');
    if (img && img.complete) {
        this.ctx.globalAlpha = 0.3;
        this.ctx.drawImage(img, CANVAS_WIDTH / 2 - 64, CANVAS_HEIGHT / 2 - 64, 128, 128);
        this.ctx.globalAlpha = 1;
    }
};

Game.prototype.showGameOverOverlay = function () {
    const overlay = document.getElementById('overlay');
    const title = document.getElementById('overlay-title');
    const subtitle = document.getElementById('overlay-subtitle');
    const scoresDiv = document.getElementById('overlay-scores');
    const nameWrapper = document.getElementById('name-input-wrapper');
    const startBtn = document.getElementById('start-btn');
    const highscoreList = document.getElementById('highscore-list');

    title.textContent = 'GAME OVER';
    subtitle.textContent = 'The toys got you this time!';
    scoresDiv.classList.remove('hidden');
    document.getElementById('final-score').textContent = this.score;
    document.getElementById('final-wave').textContent = this.wave;

    nameWrapper.classList.remove('hidden');
    const nameInput = document.getElementById('player-name');
    nameInput.value = '';
    startBtn.classList.add('hidden');
    highscoreList.classList.add('hidden');

    overlay.classList.remove('hidden');
    menuLoop();

    setTimeout(() => nameInput.focus(), 100);
};
