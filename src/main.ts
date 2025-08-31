import Phaser from "phaser";
import { ColorPalette } from "./utils/ColorPalette";

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const SLIME_FRAME_WIDTH = 32;
const SLIME_FRAME_HEIGHT = 32;
const SLIME_MOVE_SPEED = 100;
const SLIME_ANIM_FRAME_RATE = 5;
const APPLE_DETECTION_RANGE = 150;

const ASSET_KEYS = {
  PASSIVE_SLIME: "passiveSlime",
  AGGRESSIVE_SLIME: "aggressiveSlime",
  APPLE: "apple",
};

interface CustomSlimeSprite extends Phaser.GameObjects.Sprite {
    wanderTarget?: Phaser.Math.Vector2;
}

class MainScene extends Phaser.Scene {
  private slimeGroup!: Phaser.GameObjects.Group;
  private apple!: Phaser.Physics.Arcade.Image;
  private passiveSlimeCount = 5;
  private aggressiveSlimeCount = 1;

  constructor() {
    super({ key: "MainScene" });
  }

  preload() {
    this.load.spritesheet(
      ASSET_KEYS.PASSIVE_SLIME,
      "src/sprites/slimeBlueAnimated.png",
      { frameWidth: SLIME_FRAME_WIDTH, frameHeight: SLIME_FRAME_HEIGHT }
    );

    this.load.spritesheet(
      ASSET_KEYS.AGGRESSIVE_SLIME,
      "src/sprites/slimeRedAnimated.png",
      { frameWidth: SLIME_FRAME_WIDTH, frameHeight: SLIME_FRAME_HEIGHT }
    );

    this.load.image(ASSET_KEYS.APPLE, "src/sprites/apple.png");
  }

  create() {

    this.add
      .text(GAME_WIDTH - 100, 10, "Pause", { fontSize: "20px", color: ColorPalette.getColor("black") })
      .setInteractive()
      .on("pointerdown", () => this.pause());

    this.slimeGroup = this.physics.add.group();

    for (let i = 0; i < this.passiveSlimeCount; i++)
      this.createSlime(ASSET_KEYS.PASSIVE_SLIME);

    for (let i = 0; i < this.aggressiveSlimeCount; i++)
      this.createSlime(ASSET_KEYS.AGGRESSIVE_SLIME);

    this.apple = this.createFruit(ASSET_KEYS.APPLE);

    this.physics.add.overlap(
      this.slimeGroup,
      this.apple,
      this.handleCollision,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.slimeGroup,
      this.slimeGroup,
      this.slimeFight,
      undefined,
      this
    );

    this.physics.add.collider(this.slimeGroup, this.slimeGroup);

  }

  update() {
    this.slimeGroup.children.iterate((child: Phaser.GameObjects.GameObject) => {
      const slimeChild = child as CustomSlimeSprite;
      if (slimeChild && slimeChild.body && this.apple) {
        const distance = Phaser.Math.Distance.Between(
          slimeChild.x,
          slimeChild.y,
          this.apple.x,
          this.apple.y
        );

        if (distance > APPLE_DETECTION_RANGE) {
          // Wander behavior
          if (!slimeChild.wanderTarget || Phaser.Math.Distance.Between(
            slimeChild.x,
            slimeChild.y,
            slimeChild.wanderTarget.x,
            slimeChild.wanderTarget.y
          ) < 10) { // If no target or reached target (within 10 pixels)
            slimeChild.wanderTarget = new Phaser.Math.Vector2(
              Math.random() * GAME_WIDTH,
              Math.random() * GAME_HEIGHT
            );
          }
          this.physics.moveToObject(slimeChild, slimeChild.wanderTarget, SLIME_MOVE_SPEED);
        } else {
          // Move towards the apple
          this.physics.moveToObject(slimeChild, this.apple, SLIME_MOVE_SPEED);
        }
      }
      return true;
    });
  }

  private createFruit(kind: string): Phaser.Physics.Arcade.Image {
    const fruit = this.physics.add.image(
      Math.random() * GAME_WIDTH,
      Math.random() * GAME_HEIGHT,
      kind
    );
    return fruit;
  }

  private createSlime(
    kind: string,
    isChild: boolean = false
  ): CustomSlimeSprite | undefined {
    const birthRate = Math.random();

    if (!isChild || (isChild && birthRate > 0.5)) {
      const uniqueSlime = `${kind}_${Math.random().toString(36).substr(2, 9)}`;
      const slime = this.physics.add.sprite(
        Math.random() * GAME_WIDTH,
        Math.random() * GAME_HEIGHT,
        uniqueSlime
      ) as CustomSlimeSprite;

      // Initialize wander target
      slime.wanderTarget = new Phaser.Math.Vector2(
        Math.random() * GAME_WIDTH,
        Math.random() * GAME_HEIGHT
      );

      this.anims.create({
        key: `${uniqueSlime}Animation`,
        frames: this.anims.generateFrameNumbers(kind, { start: 0, end: 3 }),
        frameRate: SLIME_ANIM_FRAME_RATE,
        repeat: -1,
      });

      slime.play(`${uniqueSlime}Animation`);
      this.slimeGroup.add(slime);

      return slime;
    } else {
      return undefined
    }
  }

  private handleCollision(apple: any, slime: any) {
    const appleSprite = apple as Phaser.Physics.Arcade.Image;
    appleSprite.setPosition(
      Math.random() * GAME_WIDTH,
      Math.random() * GAME_HEIGHT
    );

    const slimeSprite = slime as Phaser.GameObjects.Sprite;
    const slimeKind = slimeSprite.texture.key;

    if (slimeKind === ASSET_KEYS.PASSIVE_SLIME) {
      this.createSlime(ASSET_KEYS.PASSIVE_SLIME, true);
    } else if (slimeKind === ASSET_KEYS.AGGRESSIVE_SLIME) {
      this.createSlime(ASSET_KEYS.AGGRESSIVE_SLIME, true);
    }
  }

  private slimeFight(slime1: any, slime2: any) {
    const slimeSprite1 = slime1 as Phaser.GameObjects.Sprite;
    const slimeSprite2 = slime2 as Phaser.GameObjects.Sprite;

    const slimeKind1 = slimeSprite1.texture.key;
    const slimeKind2 = slimeSprite2.texture.key;

    if (
      (slimeKind1 === ASSET_KEYS.PASSIVE_SLIME &&
        slimeKind2 === ASSET_KEYS.AGGRESSIVE_SLIME) ||
      (slimeKind1 === ASSET_KEYS.AGGRESSIVE_SLIME &&
        slimeKind2 === ASSET_KEYS.PASSIVE_SLIME)
    ) {
        const fightRate = Math.random();
        if(fightRate > 0.5) {
            if (slimeKind1 === ASSET_KEYS.PASSIVE_SLIME) {
                this.slimeGroup.remove(slimeSprite1, true, true);
            } else {
                this.slimeGroup.remove(slimeSprite2, true, true);
            }
            console.log("A slime has been defeated!");
        }
    }
  }

  private pause() {
    this.scene.pause();
  }

}

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: ColorPalette.getColor("stageColor"),
  physics: {
    default: "arcade",
  },
  scene: MainScene,
};

new Phaser.Game(gameConfig);
