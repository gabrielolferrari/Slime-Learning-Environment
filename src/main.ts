import Phaser from "phaser";
import { ColorPalette } from "./utils/ColorPalette";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  SLIME_FRAME_WIDTH,
  SLIME_FRAME_HEIGHT,
  ASSET_KEYS,
} from "./constants";
import { Slime } from "./Slime";

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

    this.slimeGroup = this.add.group();

    for (let i = 0; i < this.passiveSlimeCount; i++) {
      this.createSlime(ASSET_KEYS.PASSIVE_SLIME);
    }

    for (let i = 0; i < this.aggressiveSlimeCount; i++) {
      this.createSlime(ASSET_KEYS.AGGRESSIVE_SLIME);
    }

    this.apple = this.createFruit(ASSET_KEYS.APPLE);

    this.physics.add.overlap(
      this.slimeGroup,
      this.apple,
      (slime, apple) => {
        this.handleAppleCollision(slime as Slime, apple as Phaser.Physics.Arcade.Image);
      },
      undefined,
      this
    );

    this.physics.add.collider(
      this.slimeGroup,
      this.slimeGroup,
      (slime1, slime2) => {
        (slime1 as Slime).handleSlimeCollision(slime2 as Slime);
      },
      undefined,
      this
    );
  }

  update() {
    this.slimeGroup.children.iterate(slime => {
      (slime as Slime).update(this.apple);
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

  private createSlime(kind: string, isChild: boolean = false): void {
    const birthRate = Math.random();
    if (!isChild || (isChild && birthRate > 0.5)) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT;
      const slime = new Slime(this, x, y, kind);
      this.slimeGroup.add(slime);
    }
  }

  private handleAppleCollision(slime: Slime, apple: Phaser.Physics.Arcade.Image) {
    apple.setPosition(
      Math.random() * GAME_WIDTH,
      Math.random() * GAME_HEIGHT
    );

    const slimeKind = slime.getSlimeType();
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