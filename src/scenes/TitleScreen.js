// src/scenes/TitleScreen.js
import { createControlAnimation } from '../ui/ControlAnimation.js';

export default class TitleScreen extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScreen' });
    }

    create() {
        const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

        // --- Semi-transparent background ---
        this.add.rectangle(screenCenterX, screenCenterY, 600, 450, 0x000000, 0.7)
            .setStrokeStyle(2, 0xffffff);

        // --- Title ---
        this.add.text(screenCenterX, screenCenterY - 180, 'AIRSHIP SIMULATOR', {
            fontFamily: 'monospace',
            fontSize: '36px',
            color: '#ffffaa',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5);

        // --- Create the animated control graphic ---
        createControlAnimation(this, screenCenterX, screenCenterY - 40);

        // --- Instructions Text (positioned next to the animation) ---
        const instructions = [
            '   ----- CONTROLS -----',
            '',
            '',
            '',
            '',
            '[W/A/S/D]...Motor Direction',
            '[UP/DOWN]...Adjust Throttle',
            '[M].........Manual Mode',
            '[N].........Neutral Mode',
            '[C].........Cruise Mode'
        ];

        this.add.text(screenCenterX, screenCenterY , instructions, {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#ffffff',
            align: 'left',
            lineSpacing: 10
        }).setOrigin(0.5);

        // --- Start Prompt ---
        const startText = this.add.text(screenCenterX, screenCenterY + 180, 'Click anywhere to Start', {
            fontFamily: 'monospace',
            fontSize: '22px',
            color: '#aaffaa'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: startText,
            alpha: 0,
            duration: 700,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // --- Input Handler ---
        this.input.once('pointerdown', () => {
            this.scene.start('Game');
        });
    }
}