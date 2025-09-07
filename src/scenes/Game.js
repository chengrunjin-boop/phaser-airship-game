// src/scenes/Game.js
import { WORLD, SKY } from '../config/constants.js';

import weightsConfig from '../config/weights.js';
import hullOptions from '../airship/options.js';

import { makeEllipseCylinderHullTexture } from '../airship/HullTexture.js';
import { buildRectFrame } from '../airship/FrameRectangle.js';
import { spawnHeliumBalls } from '../airship/HeliumBalls.js';
import { spawnPayloads } from '../airship/Payloads.js';

import { makeCloudTexture, spawnCloudLayer, makeStarsTexture, spawnStars, updateCloudDrift } from '../env/Background.js';
import { updateAltitudeFX } from '../ui/AltitudeFX.js';
import { createHUD, updateHUD } from '../ui/HUD.js';

export default class Game extends Phaser.Scene {
  constructor() { super({ key: 'Game' }); }

  create() {
    // world + camera
    this.worldWidth = WORLD.width; this.worldHeight = WORLD.height;
    this.matter.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cam = this.cameras.main; this.cam.setBackgroundColor(SKY.near);
    this.cam.setBounds(0, 0, this.worldWidth, this.worldHeight);

    // background
    makeCloudTexture(this);
    spawnCloudLayer(this, { key: 'L1', count: 70, scale: [1.0,1.5], alpha: 0.95, scrollX: 0.22, scrollY: 0.18, driftX: 0.025 });
    spawnCloudLayer(this, { key: 'L2', count: 60, scale: [0.9,1.2], alpha: 0.95, scrollX: 0.38, scrollY: 0.30, driftX: 0.035 });
    spawnCloudLayer(this, { key: 'L3', count: 48, scale: [0.8,1.1], alpha: 0.90, scrollX: 0.55, scrollY: 0.50, driftX: 0.05 });
    spawnCloudLayer(this, { key: 'CIRRUS', count: 36, scale: [0.6,0.9], alpha: 0.65, scrollX: 0.35, scrollY: 0.25, driftX: 0.02 });
    makeStarsTexture(this);
    spawnStars(this, { count: 480, scrollX: 0.10, scrollY: 0.10 });

    // ground
    const groundH = 160;
    const floorY  = this.worldHeight - groundH / 2;
    const groundTopY = floorY - groundH / 2;
    this.floor = this.add.rectangle(this.worldWidth / 2, floorY, this.worldWidth, groundH, 0x86d26f);
    this.matter.add.gameObject(this.floor, {
      isStatic: true,
      friction: 0.9,
      frictionStatic: 1.0,
      restitution: 0,
    }).setScrollFactor(1);

// ---- AIRSHIP ----
this.texWidth = 600; this.texHeight = 100;
const slots = 10;

const payloadBaseH = 14, clearancePx = 8;
const cx = 500;
const cy = (groundTopY - clearancePx) - (payloadBaseH + 2) - (this.texHeight / 2);

// Use landingGear from options for BOTH graphics and physics
const gear = hullOptions.landingGear ?? [];

// 1) Build hull texture (also draws gear visuals)
makeEllipseCylinderHullTexture(this, 'airship', this.texWidth, this.texHeight, hullOptions);

// 2) Build the physics frame FIRST (adds struts + circular “wheels” as parts)
this.frame = buildRectFrame(
  this,
  cx, cy,
  this.texWidth, this.texHeight,
  slots,
  gear
);

// 3) Compute origin using gondola + gear extra height (matches HullTexture.js)
const strokePx = hullOptions.strokePx ?? 2;
const gondolaExtra = hullOptions.gondola
  ? (hullOptions.gondola.offsetY + hullOptions.gondola.height + 4)
  : 0;
const gearExtra = gear.length
  ? Math.max(...gear.map(s =>
      (s.strutLen ?? 30) + (s.wheelR ?? 14) * 2 + (strokePx + 4)
    ))
  : 0;
const extraH = Math.max(gondolaExtra, gearExtra);
const fullH = this.texHeight + extraH;

// ✅ COM shift: Matter made frame.position.y the COM (below hull center)
const comShiftY = this.frame.position.y - cy;

// Anchor the sprite to the COM so it lines up with the frame
const originY = (this.texHeight * 0.5 + comShiftY) / fullH;

// 4) Create sprite with corrected origin
this.airshipSprite = this.add.image(cx, cy, 'airship')
  .setOrigin(0.5, originY)
  .setDepth(5);

this.altZeroY = this.airshipSprite.y;



    // helium balls + payloads
    this.balls = spawnHeliumBalls(this, cx, cy, this.texWidth, this.texHeight, slots, 3);
    this.payloads = spawnPayloads(this, this.frame, weightsConfig, cx, cy, this.texWidth, this.texHeight, slots, payloadBaseH);
    this.weightForceScale = 0.00012;

    // controls
    this.cursors = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // camera follow
    this.cam.startFollow(this.airshipSprite, true, 1, 1);

    // HUD
    createHUD(this);

    // settle
    this.settleFrames = 15;
    this.matter.body.setStatic(this.frame, true);
    this.forceRamp = 0;
    this.time.delayedCall(150, () => {
      this.matter.body.setStatic(this.frame, false);
      this.matter.body.setVelocity(this.frame, { x: 0, y: 0 });
      this.matter.body.setAngularVelocity(this.frame, 0);
      this.tweens.add({ targets: this, forceRamp: 1, duration: 300, ease: 'Sine.Out' });
      this.cam.startFollow(this.airshipSprite, true, 0.08, 0.08);
      this.cam.setDeadzone(this.sys.game.config.width * 0.25, this.sys.game.config.height * 0.35);
    });

    this.floorY = floorY;
  }

  update() {
    if (this.settleFrames > 0) {
      this.settleFrames--;
      this.airshipSprite.x = this.frame.position.x;
      this.airshipSprite.y = this.frame.position.y;
      this.airshipSprite.rotation = this.frame.angle;
      return;
    }

    // buoyancy
    const bottomBand = this.worldHeight - 100;
    this.balls.forEach(ball => {
      let lift = 0;
      if (ball.position.y > bottomBand)             lift = -0.00005;
      else if (ball.position.y > bottomBand * 0.66) lift = -0.00003;
      else if (ball.position.y > bottomBand * 0.33) lift = -0.00001;
      else                                          lift =  0.00001;
      if (this.forceRamp > 0) this.matter.body.applyForce(ball, ball.position, { x: 0, y: lift * this.forceRamp });
    });

    // thrust
    const force = 0.005;
    if (this.cursors.left.isDown)  this.matter.body.applyForce(this.frame, this.frame.position, { x: -force, y: 0 });
    if (this.cursors.right.isDown) this.matter.body.applyForce(this.frame, this.frame.position, { x:  force, y: 0 });
    if (this.cursors.up.isDown)    this.matter.body.applyForce(this.frame, this.frame.position, { x: 0, y: -force });
    if (this.cursors.down.isDown)  this.matter.body.applyForce(this.frame, this.frame.position, { x: 0, y:  force });

    // sync sprite
    this.airshipSprite.x = this.frame.position.x;
    this.airshipSprite.y = this.frame.position.y;
    this.airshipSprite.rotation = this.frame.angle;

    // weight forces
    for (const p of this.payloads) {
      const f = (p.weight || 0) * this.weightForceScale * this.forceRamp;
      if (f) this.matter.body.applyForce(p.body, p.body.position, { x: 0, y: f });
    }

    // bg + UI
    updateCloudDrift(this);
    updateAltitudeFX(this);
    updateHUD(this);
  }
}
