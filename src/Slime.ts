import Phaser from 'phaser';
import {
    SLIME_ANIM_FRAME_RATE,
    SLIME_MOVE_SPEED,
    APPLE_DETECTION_RANGE,
    GAME_WIDTH,
    GAME_HEIGHT,
    ASSET_KEYS
} from './constants';

export class Slime extends Phaser.Physics.Arcade.Sprite {
    private wanderTarget?: Phaser.Math.Vector2;
    public velocityMultiplier: number = 1;
    private slimeType: string;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        this.slimeType = texture;

        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);

        this.wanderTarget = new Phaser.Math.Vector2(
            Math.random() * GAME_WIDTH,
            Math.random() * GAME_HEIGHT
        );

        const animKey = `${this.slimeType}_anim_${Math.random().toString(36).substr(2, 9)}`;
        this.anims.create({
            key: animKey,
            frames: this.anims.generateFrameNumbers(this.slimeType, { start: 0, end: 3 }),
            frameRate: SLIME_ANIM_FRAME_RATE,
            repeat: -1,
        });
        this.play(animKey);
    }

    public getSlimeType(): string {
        return this.slimeType;
    }

    public handleSlimeCollision(otherSlime: Slime) {
        if (this.slimeType === otherSlime.getSlimeType()) return;

        const fightRate = Math.random();
        if (fightRate > 0.5) {
            if (this.slimeType === ASSET_KEYS.PASSIVE_SLIME) {
                this.destroy();
            } else {
                otherSlime.destroy();
            }
            console.log("A slime has been defeated!");
        }
    }

    update(apple: Phaser.Physics.Arcade.Image) {
        if (!this.body) return;

        const speed = SLIME_MOVE_SPEED * this.velocityMultiplier;

        const distanceToApple = Phaser.Math.Distance.Between(
            this.x,
            this.y,
            apple.x,
            apple.y
        );

        if (distanceToApple > APPLE_DETECTION_RANGE) {
            if (!this.wanderTarget || Phaser.Math.Distance.Between(this.x, this.y, this.wanderTarget.x, this.wanderTarget.y) < 10) {
                this.wanderTarget = new Phaser.Math.Vector2(
                    Math.random() * GAME_WIDTH,
                    Math.random() * GAME_HEIGHT
                );
            }
            this.scene.physics.moveToObject(this, this.wanderTarget, speed);
        } else {
            this.scene.physics.moveToObject(this, apple, speed);
        }
    }
}