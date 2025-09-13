import Phaser from 'phaser'

export default class TitleScreen extends Phaser.Scene {
    constructor() {
        super('TitleScreen')
    }

    preload() {
        this.load.image('title', 'assets/title.png')
    }

    create() {
        // Create the text object and assign it to a variable
        const titleText = this.add.text(400, 300, 'hewwo', {
            fontSize: '64px', // Made the text bigger for a title screen
            color: '#ffffff'
        });
        // Now, you can set the origin of the text object
        titleText.setOrigin(0.5, 0.5); // Centered the text
    }
}