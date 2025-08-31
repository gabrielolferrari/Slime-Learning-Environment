import Phaser from "phaser";
import { ColorPalette } from "./utils/ColorPalette";

// Constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const SLIME_FRAME_WIDTH = 32;
const SLIME_FRAME_HEIGHT = 32;
const SLIME_VELOCITY = 50;
const SLIME_MOVE_SPEED = 100;
const SLIME_ANIM_FRAME_RATE = 5;

const ASSET_KEYS = {
  PASSIVE_SLIME: "passiveSlime",
  AGGRESSIVE_SLIME: "aggressiveSlime",
  APPLE: "apple",
};

class MainScene extends Phaser.Scene {
  private slimeGroup!: Phaser.GameObjects.Group;
  private apple!: Phaser.Physics.Arcade.Image;
  private passiveSlimeCount = 1;
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

    this.add
      .text(GAME_WIDTH - 100, 10, "Pause", { fontSize: "20px", color: ColorPalette.getColor("wisteria") })
      .setInteractive()
      .on("pointerdown", () => this.pause());

  }

  update() {
    this.slimeGroup.children.iterate((child: Phaser.GameObjects.GameObject) => {
      const slimeChild = child as Phaser.GameObjects.Sprite;
      if (slimeChild && slimeChild.body && this.apple) {
        this.physics.moveToObject(slimeChild, this.apple, SLIME_MOVE_SPEED);
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
  ): Phaser.GameObjects.Sprite | undefined {
    const birthRate = Math.random();

    if (!isChild || (isChild && birthRate > 0.5)) {
      const uniqueSlime = `${kind}_${Math.random().toString(36).substr(2, 9)}`;
      const slime = this.physics.add.sprite(
        Math.random() * GAME_WIDTH,
        Math.random() * GAME_HEIGHT,
        uniqueSlime
      );
      slime.setBounce(1);
      slime.setCollideWorldBounds(true);
      slime.setVelocity(SLIME_VELOCITY, SLIME_VELOCITY);

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
      console.log("No slime born due to birth rate");
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

    console.log("slimeKind", slimeKind);

    if (slimeKind === ASSET_KEYS.PASSIVE_SLIME) {
      this.createSlime(ASSET_KEYS.PASSIVE_SLIME, true);
    } else if (slimeKind === ASSET_KEYS.AGGRESSIVE_SLIME) {
      this.createSlime(ASSET_KEYS.AGGRESSIVE_SLIME, true);
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
