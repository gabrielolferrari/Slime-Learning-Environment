import Phaser from 'phaser';
import {
    SLIME_MOVE_SPEED,
    GAME_WIDTH,
    GAME_HEIGHT,
    ASSET_KEYS
} from './constants';
import { SlimeBrain, ACTIONS, STATE_SIZE } from './SlimeBrain';

export class Slime extends Phaser.Physics.Arcade.Sprite {
    private brain: SlimeBrain;
    private slimeType: string;

    // Propriedades para o ciclo de aprendizado
    private lastState: number[] | null = null;
    private lastAction: number | null = null;
    private moveTimer: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        this.slimeType = texture;
        this.brain = new SlimeBrain();

        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);

        const animKey = `${this.slimeType}_anim_${Math.random().toString(36).substr(2, 9)}`;
        this.anims.create({
            key: animKey,
            frames: this.anims.generateFrameNumbers(this.slimeType, { start: 0, end: 3 }),
            frameRate: 5,
            repeat: -1,
        });
        this.play(animKey);

        // A cada 500ms, o slime vai observar o ambiente e tomar uma decisão.
        this.moveTimer = this.scene.time.addEvent({
            delay: 500,
            callback: this.decideNextMove,
            callbackScope: this,
            loop: true
        });
    }

    private getState(appleGroup: Phaser.GameObjects.Group, kiwiGroup: Phaser.GameObjects.Group): number[] {
        const closestApple = this.scene.physics.closest(this, appleGroup.getChildren()) as Phaser.Physics.Arcade.Image;
        const closestKiwi = this.scene.physics.closest(this, kiwiGroup.getChildren()) as Phaser.Physics.Arcade.Image;

        // Normaliza as posições para a rede neural (valores entre 0 e 1)
        const normalize = (val: number, max: number) => val / max;

        return [
            normalize(this.x, GAME_WIDTH),
            normalize(this.y, GAME_HEIGHT),
            normalize(closestApple?.x || 0, GAME_WIDTH),
            normalize(closestApple?.y || 0, GAME_HEIGHT),
            normalize(closestKiwi?.x || 0, GAME_WIDTH),
            normalize(closestKiwi?.y || 0, GAME_HEIGHT),
        ];
    }

    private decideNextMove() {
        // A cena principal nos fornecerá os grupos de frutas através de um registro
        const appleGroup = this.scene.registry.get('appleGroup');
        const kiwiGroup = this.scene.registry.get('kiwiGroup');

        if (!appleGroup || !kiwiGroup) return;

        const state = this.getState(appleGroup, kiwiGroup);
        const action = this.brain.chooseAction(state);

        // Treina com a experiência da ação anterior
        if (this.lastState && this.lastAction !== null) {
            // A recompensa padrão é um pequeno incentivo para se mover
            let reward = -0.1; 
            this.brain.train(this.lastState, this.lastAction, reward, state, false);
        }

        this.lastState = state;
        this.lastAction = action;

        this.executeAction(action);
    }

    private executeAction(action: number) {
        const speed = SLIME_MOVE_SPEED;
        switch (ACTIONS[action]) {
            case 'up':
                this.setVelocity(0, -speed);
                break;
            case 'down':
                this.setVelocity(0, speed);
                break;
            case 'left':
                this.setVelocity(-speed, 0);
                break;
            case 'right':
                this.setVelocity(speed, 0);
                break;
        }
    }

    public handleFruitCollision(fruitKey: string, appleGroup: Phaser.GameObjects.Group, kiwiGroup: Phaser.GameObjects.Group) {
        const reward = fruitKey === ASSET_KEYS.APPLE ? 100 : -100;
        const state = this.getState(appleGroup, kiwiGroup);

        if (this.lastState && this.lastAction !== null) {
            this.brain.train(this.lastState, this.lastAction, reward, state, true);
        }

        // Reseta o estado para o próximo "episódio" de aprendizado
        this.lastState = null;
        this.lastAction = null;
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
        }
    }

    destroy(fromScene?: boolean) {
        this.moveTimer.destroy();
        super.destroy(fromScene);
    }
}
