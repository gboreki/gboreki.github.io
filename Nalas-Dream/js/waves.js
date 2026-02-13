const WaveManager = {
    currentWave: 0,

    getWaveConfig(waveNumber) {
        const wave = waveNumber;
        let types = [];
        let rows = 3;

        if (wave === 1) {
            types = [ENEMY_TYPES.CHEW_TOY];
            rows = 3;
        } else if (wave === 2) {
            types = [ENEMY_TYPES.BALL];
            rows = 3;
        } else if (wave === 3) {
            types = [ENEMY_TYPES.STUFFED_ANIMAL];
            rows = 3;
        } else if (wave === 4) {
            types = [ENEMY_TYPES.RUBBER_DUCKY];
            rows = 3;
        } else if (wave === 5) {
            types = [ENEMY_TYPES.SOCK];
            rows = 3;
        } else if (wave === 6) {
            types = [ENEMY_TYPES.CHEW_TOY, ENEMY_TYPES.BALL, ENEMY_TYPES.RUBBER_DUCKY];
            rows = 4;
        } else if (wave === 7) {
            types = [ENEMY_TYPES.BALL, ENEMY_TYPES.STUFFED_ANIMAL, ENEMY_TYPES.SOCK];
            rows = 4;
        } else if (wave === 8) {
            types = [ENEMY_TYPES.CHEW_TOY, ENEMY_TYPES.RUBBER_DUCKY, ENEMY_TYPES.SOCK];
            rows = 4;
        } else if (wave === 9) {
            types = [ENEMY_TYPES.STUFFED_ANIMAL, ENEMY_TYPES.RUBBER_DUCKY, ENEMY_TYPES.SOCK];
            rows = 5;
        } else {
            types = [
                ENEMY_TYPES.CHEW_TOY,
                ENEMY_TYPES.BALL,
                ENEMY_TYPES.STUFFED_ANIMAL,
                ENEMY_TYPES.RUBBER_DUCKY,
                ENEMY_TYPES.SOCK
            ];
            rows = Math.min(6, 4 + Math.floor((wave - 10) / 3));
        }

        const speed = ENEMY_BASE_SPEED + (wave - 1) * ENEMY_SPEED_INCREMENT;

        return { types, rows, speed };
    }
};
