import Phaser from "phaser";

export class ColorPalette {
    private static colors: Record<string, string> = {
        apricot: '#FBCEB1',
        babyPink: '#F4C2C2',
        celeste: '#B2FFFF',
        champagne: '#F7E7CE',
        cornflowerBlue: '#A0C4FF',
        creamyMint: '#D4F0E0',
        freshAir: '#A6D6D6',
        honeydew: '#F0FFF0',
        icyBlue: '#C1E9F2',
        lavenderBlue: '#C6B4FC',
        lavenderMist: '#E6E0F8',
        lightCoral: '#F4A7B9',
        lightCyan: '#E0FFFF',
        lightPink: '#FFB6C1',
        lightPlum: '#E1C4E1',
        lightYellow: '#FFF6C8',
        lilac: '#DCD0FF',
        magicMint: '#A0E7E5',
        mauve: '#E0BBE4',
        mistyRose: '#FDE2E4',
        orchid: '#E2B2E2',
        palePink: '#FADADD',
        palePurple: '#F2EBF5',
        pastelPink: '#FFDFD3',
        peach: '#FFDAB9',
        periwinkle: '#B4C6FC',
        powderBlue: '#B0E0E6',
        roseQuartz: '#F7CAC9',
        seafoamGreen: '#9FE2BF',
        serenity: '#B3CEE5',
        skyBlue: '#C3DDF2',
        soap: '#CEC8EF',
        softGreen: '#C1E1C1',
        thistle: '#D8BFD8',
        wisteria: '#C9A0DC',
        stageColor: '#b4c011',
        carrot: '#FFA500',
        black: '#000000',
    };

    private static colorNames: string[] = Object.keys(ColorPalette.colors);

    static randomColor(): string {
        const randomColorName = Phaser.Utils.Array.GetRandom(ColorPalette.colorNames);
        return ColorPalette.colors[randomColorName];
    }

    static getColor(name: string): string | undefined {
        return ColorPalette.colors[name];
    }
}