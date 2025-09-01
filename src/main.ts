import Phaser from "phaser";
import { ColorPalette } from "./utils/ColorPalette";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  SLIME_FRAME_WIDTH,
  SLIME_FRAME_HEIGHT,
  ASSET_KEYS,
  APPLE_COUNT,
  KIWI_COUNT,
} from "./constants";
import { Slime } from "./Slime";

class MainScene extends Phaser.Scene {
  private slimeGroup!: Phaser.GameObjects.Group;
  private appleGroup!: Phaser.GameObjects.Group;
  private kiwiGroup!: Phaser.GameObjects.Group;
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
    this.load.image(ASSET_KEYS.KIWI, "src/sprites/kiwi.png");
  }

  create() {
    this.add
      .text(GAME_WIDTH - 100, 10, "Pause", { fontSize: "20px", color: ColorPalette.getColor("black") })
      .setInteractive()
      .on("pointerdown", () => this.pause());

    this.slimeGroup = this.add.group();
    this.appleGroup = this.physics.add.group();
    this.kiwiGroup = this.physics.add.group();

    // Disponibiliza os grupos de frutas para toda a cena (para que os slimes possam "vê-los")
    this.registry.set('appleGroup', this.appleGroup);
    this.registry.set('kiwiGroup', this.kiwiGroup);

    for (let i = 0; i < this.passiveSlimeCount; i++) {
      this.createSlime(ASSET_KEYS.PASSIVE_SLIME);
    }

    for (let i = 0; i < this.aggressiveSlimeCount; i++) {
      this.createSlime(ASSET_KEYS.AGGRESSIVE_SLIME);
    }

    for (let i = 0; i < APPLE_COUNT; i++) {
      this.appleGroup.add(this.createFruit(ASSET_KEYS.APPLE));
    }

    for (let i = 0; i < KIWI_COUNT; i++) {
      this.kiwiGroup.add(this.createFruit(ASSET_KEYS.KIWI));
    }

    this.physics.add.overlap(this.slimeGroup, this.appleGroup, this.handleFruitCollision, undefined, this);
    this.physics.add.overlap(this.slimeGroup, this.kiwiGroup, this.handleFruitCollision, undefined, this);

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
    // O loop de update da cena agora é muito simples!
    // Cada slime toma suas próprias decisões em seu próprio timer.
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

  private handleFruitCollision(slimeObject: Phaser.GameObjects.GameObject, fruitObject: Phaser.GameObjects.GameObject) {
    const slime = slimeObject as Slime;
    const fruit = fruitObject as Phaser.Physics.Arcade.Image;
    const fruitKey = fruit.texture.key;

    // Informa o slime sobre a colisão para que ele possa aprender
    slime.handleFruitCollision(fruitKey, this.appleGroup, this.kiwiGroup);

    // Lógica de jogo (criar novo slime ou não)
    if (fruitKey === ASSET_KEYS.APPLE) {
        const slimeKind = slime.getSlimeType();
        if (slimeKind === ASSET_KEYS.PASSIVE_SLIME) {
            this.createSlime(ASSET_KEYS.PASSIVE_SLIME, true);
        } else if (slimeKind === ASSET_KEYS.AGGRESSIVE_SLIME) {
            this.createSlime(ASSET_KEYS.AGGRESSIVE_SLIME, true);
        }
    }

    fruit.setPosition(
        Math.random() * GAME_WIDTH,
        Math.random() * GAME_HEIGHT
    );
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