const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const PLAYER_SPEED = 5;
const PLAYER_WIDTH = 64;
const PLAYER_HEIGHT = 64;
const PLAYER_SHOOT_COOLDOWN = 300;
const PLAYER_START_LIVES = 3;

const BONE_SPEED = 7;
const BONE_WIDTH = 20;
const BONE_HEIGHT = 30;

const ENEMY_WIDTH = 52;
const ENEMY_HEIGHT = 52;
const ENEMY_PADDING = 10;
const ENEMY_BASE_SPEED = 1;
const ENEMY_DROP_DISTANCE = 20;
const ENEMY_SPEED_INCREMENT = 0.15;

const ENEMY_PROJECTILE_SPEED = 4;
const ENEMY_PROJECTILE_WIDTH = 12;
const ENEMY_PROJECTILE_HEIGHT = 12;

const ENEMY_BASE_SHOOT_CHANCE = 0.0008;
const ENEMY_SHOOT_CHANCE_INCREMENT = 0.0003;

const ENEMY_TYPES = {
    CHEW_TOY: {
        name: 'Chew Toy',
        image: 'chew-toy',
        points: 10,
        canShoot: true,
        shootChance: ENEMY_BASE_SHOOT_CHANCE,
        health: 1,
        movement: 'standard'
    },
    BALL: {
        name: 'Ball',
        image: 'ball',
        points: 20,
        canShoot: true,
        shootChance: ENEMY_BASE_SHOOT_CHANCE,
        health: 1,
        movement: 'zigzag'
    },
    STUFFED_ANIMAL: {
        name: 'Stuffed Animal',
        image: 'stuffed-animal',
        points: 30,
        canShoot: true,
        shootChance: ENEMY_BASE_SHOOT_CHANCE * 1.2,
        health: 2,
        movement: 'sway'
    },
    RUBBER_DUCKY: {
        name: 'Rubber Ducky',
        image: 'rubber-ducky',
        points: 40,
        canShoot: true,
        shootChance: ENEMY_BASE_SHOOT_CHANCE * 1.5,
        health: 1,
        movement: 'bounce'
    },
    SOCK: {
        name: 'Sock',
        image: 'sock',
        points: 60,
        canShoot: true,
        shootChance: ENEMY_BASE_SHOOT_CHANCE * 2,
        health: 3,
        movement: 'aggressive'
    }
};

const PILLOW_WIDTH = 100;
const PILLOW_HEIGHT = 30;
const PILLOW_SPEED = 2;
const PILLOW_MAX_HEALTH = 3;
const PILLOW_OFFSET_Y = 20;

const PARTICLE_COUNT = 8;
const PARTICLE_LIFETIME = 30;
