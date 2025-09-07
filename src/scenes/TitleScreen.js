import Phaser from 'phaser'

export default class TitleScreen extends Phaser.Scene {
    constructor() {
        super('TitleScreen')
    }

    preload() {
        this.load.image('title', 'assets/title.png')
    }

    create() {
        this.add.text(400, 300, 'hewwo')
        text.setOrigin(0.1, 0.5)
    }
}