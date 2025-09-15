import { WORLD, SKY, ATMOSPHERE } from '../config/constants.js'; // Import ATMOSPHERE
import weightsConfig from '../config/weights.js';
import hullOptions from '../airship/options.js';
import { makeEllipseCylinderHullTexture } from '../airship/HullTexture.js';
import { buildRectFrame } from '../airship/FrameRectangle.js';
import { spawnHeliumBalls } from '../airship/HeliumBalls.js';
import { spawnPayloads } from '../airship/Payloads.js';
import { makeCloudTexture, spawnCloudLayer, makeStarsTexture, spawnStars, updateCloudDrift } from '../env/Background.js';
import { updateAltitudeFX, getAltitudeMeters } from '../ui/AltitudeFX.js'; // Import getAltitudeMeters
import { spawnMotors, updateMotors } from '../airship/Motors.js';
import { createControlPanel, updateControlPanel } from '../ui/ControlPanel.js';
import { createTelemetryPanel, updateTelemetryPanel } from '../ui/TelemetryPanel.js';
// --- NEW: Import the new atmospheric function ---
import { getDensityRatio } from '../env/Atmosphere.js';

export default class Game extends Phaser.Scene {
  constructor() { super({ key: 'Game' }); }

  create() {
    this.worldWidth = WORLD.width; this.worldHeight = WORLD.height;
    this.matter.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cam = this.cameras.main;
    this.cam.setBackgroundColor(SKY.near);
    this.cam.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.mPerPx = 10;
    
    // Background
    makeCloudTexture(this);
    spawnCloudLayer(this, { key: 'L1', count: 70, scale: [1.0, 1.5], alpha: 0.95, scrollX: 0.22, scrollY: 0.18, driftX: 0.025 });
    spawnCloudLayer(this, { key: 'L2', count: 60, scale: [0.9, 1.2], alpha: 0.95, scrollX: 0.38, scrollY: 0.30, driftX: 0.035 });
    spawnCloudLayer(this, { key: 'L3', count: 48, scale: [0.8, 1.1], alpha: 0.90, scrollX: 0.55, scrollY: 0.50, driftX: 0.05 });
    spawnCloudLayer(this, { key: 'CIRRUS', count: 36, scale: [0.6, 0.9], alpha: 0.65, scrollX: 0.35, scrollY: 0.25, driftX: 0.02 });
    makeStarsTexture(this);
    spawnStars(this, { count: 480, scrollX: 0.10, scrollY: 0.10 });
    
    // Ground
    const groundH = 160;
    const floorY = this.worldHeight - groundH / 2;
    this.floor = this.add.rectangle(this.worldWidth / 2, floorY, this.worldWidth, groundH, 0x86d26f);
    this.matter.add.gameObject(this.floor, { isStatic: true, friction: 0.9, frictionStatic: 1.0, restitution: 0, }).setScrollFactor(1);
    
    // Airship
    this.texWidth = 600; this.texHeight = 100;
    const slots = 10, payloadBaseH = 14, clearancePx = 8;
    const groundTopY = floorY - groundH / 2;
    const cx = 500, cy = (groundTopY - clearancePx) - (payloadBaseH + 2) - (this.texHeight / 2);
    makeEllipseCylinderHullTexture(this, 'airship', this.texWidth, this.texHeight, hullOptions);
    const gear = hullOptions.landingGear ?? [];
    this.frame = buildRectFrame(this, cx, cy, this.texWidth, this.texHeight, slots, gear);
    const hullSprite = this.add.image(0, 0, 'airship').setDepth(5);
    this.airshipContainer = this.add.container(cx, cy, [hullSprite]);
    this.motors = spawnMotors(this, this.airshipContainer, hullOptions.motors, this.texWidth);
    const strokePx = hullOptions.strokePx ?? 2;
    const gondolaExtra = hullOptions.gondola ? (hullOptions.gondola.offsetY + hullOptions.gondola.height + 4) : 0;
    const gearExtra = gear.length ? Math.max(...gear.map(s => (s.strutLen ?? 30) + (s.wheelR ?? 14) * 2 + (strokePx + 4))) : 0;
    const extraH = Math.max(gondolaExtra, gearExtra);
    const fullH = this.texHeight + extraH;
    const comShiftY = this.frame.position.y - cy;
    const originY = (this.texHeight * 0.5 + comShiftY) / fullH;
    hullSprite.setOrigin(0.5, originY);
    this.altZeroY = this.airshipContainer.y;
    this.balls = spawnHeliumBalls(this, cx, cy, this.texWidth, this.texHeight, slots, 3);
    this.payloads = spawnPayloads(this, this.frame, weightsConfig, cx, cy, this.texWidth, this.texHeight, slots, payloadBaseH);
    this.weightForceScale = 0.00012;

    // Controls
    this.directionCursors = this.input.keyboard.addKeys({ up: Phaser.Input.Keyboard.KeyCodes.W, down: Phaser.Input.Keyboard.KeyCodes.S, left: Phaser.Input.Keyboard.KeyCodes.A, right: Phaser.Input.Keyboard.KeyCodes.D });
    this.throttleCursors = this.input.keyboard.createCursorKeys();
    this.modeKeys = this.input.keyboard.addKeys({ manual: Phaser.Input.Keyboard.KeyCodes.M, neutral: Phaser.Input.Keyboard.KeyCodes.N, cruise: Phaser.Input.Keyboard.KeyCodes.C });

    // Motor and Throttle Setup
    this.motorVector = new Phaser.Math.Vector2(0, -1);
    this.motorForce = 0.008;
    this.throttle = 0;
    this.controlPanel = createControlPanel(this);
    this.motorMode = 1;

    // Telemetry Panel
    this.telemetryPanel = createTelemetryPanel(this);
    
    // Camera
    this.cam.startFollow(this.airshipContainer, true, 1, 1);
    
    // Settle Sequence
    this.settleFrames = 15;
    this.forceRamp = 0;
    this.matter.body.setStatic(this.frame, true);
    this.time.delayedCall(150, () => {
      this.matter.body.setStatic(this.frame, false);
      this.matter.body.setVelocity(this.frame, { x: 0, y: 0 });
      this.matter.body.setAngularVelocity(this.frame, 0);
      this.tweens.add({ targets: this, forceRamp: 1, duration: 300, ease: 'Sine.Out' });
      this.cam.startFollow(this.airshipContainer, true, 0.08, 0.08);
      this.cam.setDeadzone(this.sys.game.config.width * 0.25, this.sys.game.config.height * 0.35);
    });
  }

  update() {
    if (this.settleFrames > 0) {
      this.settleFrames--;
      this.airshipContainer.x = this.frame.position.x;
      this.airshipContainer.y = this.frame.position.y;
      this.airshipContainer.rotation = this.frame.angle;
      return;
    }
    
    // --- MODIFIED: Dynamic Buoyancy Calculation ---
    // 1. Get the current altitude in meters.
    const altitudeMeters = getAltitudeMeters(this);
    // 2. Calculate the current air density ratio based on altitude.
    const densityRatio = getDensityRatio(altitudeMeters);
    // 3. Calculate the final lift force for this frame.
    const currentLift = ATMOSPHERE.BASE_LIFT_FORCE * densityRatio;
    
    // 4. Apply this dynamic lift force to all helium balls.
    this.balls.forEach(ball => {
      // The force is negative to push upwards.
      const liftForce = { x: 0, y: -currentLift * this.forceRamp };
      this.matter.body.applyForce(ball, ball.position, liftForce);
    });
    
    // Handle Mode Switching
    if (Phaser.Input.Keyboard.JustDown(this.modeKeys.manual)) { this.motorMode = 1; }
    else if (Phaser.Input.Keyboard.JustDown(this.modeKeys.neutral)) { this.motorMode = 2; }
    else if (Phaser.Input.Keyboard.JustDown(this.modeKeys.cruise)) { this.motorMode = 3; }
    
    // Handle Throttle Input
    if (this.throttleCursors.up.isDown) { this.throttle += 0.01; }
    else if (this.throttleCursors.down.isDown) { this.throttle -= 0.01; }
    this.throttle = Phaser.Math.Clamp(this.throttle, 0, 1);

    // --- MODIFIED: Motor thrust logic updated for Cruise Mode ---
    let targetAngle;
    
    if (this.motorMode === 3) {
      // In cruise mode, force the UI arrow's target angle to be backward (180 degrees).
      targetAngle = Phaser.Math.DegToRad(0);
    } else {
      // In other modes, use the WASD input vector.
      const inputVector = new Phaser.Math.Vector2(0, 0);
      if (this.directionCursors.up.isDown) { inputVector.y -= 1; }
      if (this.directionCursors.down.isDown) { inputVector.y += 1; }
      if (this.directionCursors.left.isDown) { inputVector.x -= 1; }
      if (this.directionCursors.right.isDown) { inputVector.x += 1; }

      targetAngle = this.motorVector.angle(); // Default to current angle to stop rotation
      if (inputVector.length() > 0) {
          targetAngle = inputVector.angle();
      }
    }
    
    const newAngle = Phaser.Math.Angle.RotateTo(this.motorVector.angle(), targetAngle, 0.02);
    this.motorVector.setAngle(newAngle);
    
    const worldForceVector = new Phaser.Math.Vector2(this.motorVector);
    worldForceVector.rotate(this.frame.angle);
    
    const force = { 
      x: worldForceVector.x * this.motorForce * this.throttle,
      y: worldForceVector.y * this.motorForce * this.throttle
    };
    this.matter.body.applyForce(this.frame, this.frame.position, force);
    
    // Sync Visuals
    this.airshipContainer.x = this.frame.position.x;
    this.airshipContainer.y = this.frame.position.y;
    this.airshipContainer.rotation = this.frame.angle;
    
    // --- MODIFIED: Weights with Manual Mode Multiplier ---
    for (const p of this.payloads) {
      // Start with the base force
      let weightForce = (p.weight || 0) * this.weightForceScale * this.forceRamp;

      // If in manual mode, apply the multiplier
      if (this.motorMode === 1) {
        weightForce *= 1.5;
      }
      if (this.motorMode === 2) {
        weightForce *= 0.8;
      }
      // Apply the final calculated force
      if (weightForce) {
        this.matter.body.applyForce(p.body, p.body.position, { x: 0, y: weightForce });
      }
    }
    
    // Background & UI Updates
    updateCloudDrift(this);
    updateAltitudeFX(this);
    updateControlPanel(this.controlPanel, this.motorVector, this.throttle, this.motorMode);
    updateMotors(this.motors, this.motorVector, this.motorMode);
    updateTelemetryPanel(this, this.telemetryPanel);
  }
}