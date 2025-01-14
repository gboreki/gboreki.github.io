class SoundManager {
    constructor() {
        this.sounds = new Map();
        this.isMuted = localStorage.getItem('columnsSoundMuted') === 'true';
        this.initializeSounds();
    }

    initializeSounds() {
        // Create audio elements for each sound effect
        this.createSound('highScore', 'sounds/highscore.wav');
        this.createSound('match', 'sounds/match.wav');
        this.createSound('levelUp', 'sounds/levelup.wav');
    }

    createSound(name, soundPath) {
        const audio = new Audio(soundPath);
        audio.volume = 1.0;
        this.sounds.set(name, audio);
    }

    play(soundName) {
        if (this.isMuted) return;
        
        const sound = this.sounds.get(soundName);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('Sound play failed:', e));
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('columnsSoundMuted', this.isMuted);
        return this.isMuted;
    }

    isSoundMuted() {
        return this.isMuted;
    }
}

export default SoundManager; 