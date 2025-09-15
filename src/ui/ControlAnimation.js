// src/ui/ControlAnimation.js

function createGraphics(scene, x, y) {
    const keyStyle = { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff', align: 'center' };
    const keyW = 40, keyH = 40;
    
    const keyW_bg = scene.add.rectangle(0, 0, keyW, keyH, 0x333333).setStrokeStyle(2, 0x888888);
    const keyW_text = scene.add.text(0, 0, 'W', keyStyle).setOrigin(0.5);
    const keyW_cont = scene.add.container(-keyW, -keyH, [keyW_bg, keyW_text]);

    const keyA_bg = scene.add.rectangle(0, 0, keyW, keyH, 0x333333).setStrokeStyle(2, 0x888888);
    const keyA_text = scene.add.text(0, 0, 'A', keyStyle).setOrigin(0.5);
    const keyA_cont = scene.add.container(-keyW * 2, 0, [keyA_bg, keyA_text]);

    const keyS_bg = scene.add.rectangle(0, 0, keyW, keyH, 0x333333).setStrokeStyle(2, 0x888888);
    const keyS_text = scene.add.text(0, 0, 'S', keyStyle).setOrigin(0.5);
    const keyS_cont = scene.add.container(-keyW, 0, [keyS_bg, keyS_text]);

    const keyD_bg = scene.add.rectangle(0, 0, keyW, keyH, 0x333333).setStrokeStyle(2, 0x888888);
    const keyD_text = scene.add.text(0, 0, 'D', keyStyle).setOrigin(0.5);
    const keyD_cont = scene.add.container(0, 0, [keyD_bg, keyD_text]);

    const texW = 32, texH = 52, offsetX = texW / 2, offsetY = texH / 2;
    const arrowGraphics = scene.add.graphics();
    arrowGraphics.fillStyle(0xffffff, 0.9).lineStyle(2, 0x111111, 0.9);
    arrowGraphics.beginPath();
    arrowGraphics.moveTo(0 + offsetX, -25 + offsetY);
    arrowGraphics.lineTo(15 + offsetX, -10 + offsetY);
    arrowGraphics.lineTo(5 + offsetX, -10 + offsetY);
    arrowGraphics.lineTo(5 + offsetX, 25 + offsetY);
    arrowGraphics.lineTo(-5 + offsetX, 25 + offsetY);
    arrowGraphics.lineTo(-5 + offsetX, -10 + offsetY);
    arrowGraphics.lineTo(-15 + offsetX, -10 + offsetY);
    arrowGraphics.closePath();
    arrowGraphics.fillPath().strokePath();
    if (!scene.textures.exists('motorArrow')) {
      arrowGraphics.generateTexture('motorArrow', texW, texH);
    }
    arrowGraphics.destroy();

    const arrow = scene.add.image(keyW + 60, -keyH / 2, 'motorArrow').setScale(1.2);

    const mainContainer = scene.add.container(x, y, [keyW_cont, keyA_cont, keyS_cont, keyD_cont, arrow]);

    return {
        keys: { w: keyW_cont, a: keyA_cont, s: keyS_cont, d: keyD_cont },
        arrow: arrow
    };
}

// --- MODIFIED: Replaced the timeline with a looping timer event ---
export function createControlAnimation(scene, x, y) {
    const elements = createGraphics(scene, x, y);
    const pressedColor = 0x88ff88;
    const defaultColor = 0x333333;

    // An array defining each step of the animation
    const sequence = [
        { key: 'w', angle: Phaser.Math.DegToRad(0) },
        { key: 'd', angle: Phaser.Math.DegToRad(90) },
        { key: 's', angle: Phaser.Math.DegToRad(180) },
        { key: 'a', angle: Phaser.Math.DegToRad(-90) }
    ];
    let sequenceIndex = 0;

     const playNextStep = () => {
        // Reset all keys to the default color before starting the next step.
        for (const key in elements.keys) {
            elements.keys[key].getAt(0).fillColor = defaultColor;
        }
        
        const currentStep = sequence[sequenceIndex];
        const keyElement = elements.keys[currentStep.key].getAt(0);

        // Turn the key on (it will stay on for the duration).
        keyElement.fillColor = pressedColor;

        // Animate the arrow rotation.
        scene.tweens.add({
            targets: elements.arrow,
            rotation: currentStep.angle,
            duration: 800, // A slightly longer, smoother rotation
            ease: 'Sine.InOut'
        });
        
        sequenceIndex++;
        if (sequenceIndex >= sequence.length) {
            sequenceIndex = 0;
        }
    };

    // Create a timer event that calls playNextStep every 1.5 seconds
    scene.time.addEvent({
        delay: 1500,
        callback: playNextStep,
        loop: true,
        callbackScope: this
    });

    playNextStep(); // Start the first step immediately
}