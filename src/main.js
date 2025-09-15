// src/main.js
import Game from './scenes/Game.js';
import TitleScreen from './scenes/TitleScreen.js'; // Import the TitleScreen scene

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#a6d5ff',
    physics: {
        default: 'matter',
        matter: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    audio: {
        disableWebAudio: false
    },
    // --- MODIFIED: Load TitleScreen first, then Game ---
    scene: [TitleScreen, Game]
};

new Phaser.Game(config);