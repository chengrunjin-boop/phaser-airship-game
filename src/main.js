import Phaser from 'phaser'
import Game from './scenes/Game.js'

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,       // full browser width
    height: window.innerHeight,     // full browser height
    backgroundColor: '#a6d5ff',
    physics: {
        default: 'matter',
        matter: {
            debug: false,
            gravity: { y: 0 } // no global gravity, we control helium balls manually
        }
    },
        audio: {
        disableWebAudio: false
    },
    scene: [Game]
}


new Phaser.Game(config);