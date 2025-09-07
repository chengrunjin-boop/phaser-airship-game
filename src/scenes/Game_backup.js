import Phaser from 'phaser';
import weightsConfig from '../config/weights.js';

export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });
  }

  create() {
    // ==== VIEW / WORLD ====
    const viewW = this.sys.game.config.width;
    const viewH = this.sys.game.config.height;

    this.worldWidth  = 9000;
    this.worldHeight = 15000;
    this.matter.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

    // ==== ALTITUDE MODEL ====
    this.mPerPx = 10; // 10 meters per pixel
    this.kmTroposphereTop  = 12;
    this.kmStratosphereTop = 50;
    this.kmMesosphereTop   = 85;

    // ==== SKY ====
    this.skyNear = 0x9fd6ff;
    this.skyHigh = 0x081327;
    this.cam = this.cameras.main;
    this.cam.setBackgroundColor(this.skyNear);

    // ==== CLOUDS ====
    this.makeCloudTexture();
    this.spawnCloudLayer({ key: 'L1', count: 70, scale: [1.0, 1.5], alpha: 0.95, scrollX: 0.22, scrollY: 0.18, driftX: 0.025 });
    this.spawnCloudLayer({ key: 'L2', count: 60, scale: [0.9, 1.2], alpha: 0.95, scrollX: 0.38, scrollY: 0.30, driftX: 0.035 });
    this.spawnCloudLayer({ key: 'L3', count: 48, scale: [0.8, 1.1], alpha: 0.90, scrollX: 0.55, scrollY: 0.50, driftX: 0.05  });
    this.spawnCloudLayer({ key: 'CIRRUS', count: 36, scale: [0.6, 0.9], alpha: 0.65, scrollX: 0.35, scrollY: 0.25, driftX: 0.02 });

    // ==== STARS ====
    this.makeStarsTexture();
    this.spawnStars({ count: 480, scrollX: 0.10, scrollY: 0.10 });

    // ==== GROUND ====
    const groundH = 160;
    const floorY  = this.worldHeight - groundH / 2;           // ground body center Y
    const groundTopY = floorY - groundH / 2;                   // visible top surface
    this.floor = this.add.rectangle(this.worldWidth / 2, floorY, this.worldWidth, groundH, 0x86d26f);
    this.matter.add.gameObject(this.floor, { isStatic: true });
    this.floor.setScrollFactor(1);

    // ==== AIRSHIP ====
    this.texWidth  = 600;
    this.texHeight = 100;
    const slots = 10;
    const slotWidth = this.texWidth / slots;

    // payload dims defined early so we can compute spawn height safely
    const payloadBaseH = 14;
    const clearancePx = 8; // space between lowest payload edge & ground

    const cx = 500;

    // ---- CORRECTED cy (weights bottom = groundTopY - clearancePx) ----
    // weight bottom Y at spawn = hullBottomY + payloadBaseH + 2
    // hullBottomY = cy + texHeight/2
    // => cy = (groundTopY - clearancePx) - (payloadBaseH + 2) - texHeight/2
    const cy = (groundTopY - clearancePx) - (payloadBaseH + 2) - (this.texHeight / 2);

this.makeEllipseCylinderHullTexture('airship', this.texWidth, this.texHeight, {
  tailFrac: 0.3,
  midFrac:  0.5,
  noseFrac: 0.20,
  color:    0xffffff,
  outline:  0x000000,
  strokePx: 2,

  ribCount:     3,
  ribColor:     0x000000,
  ribWidthPx:   1,
  ribAlpha:     0.18,
  ribInnerFrac: 1,

  tailSharpness: 1.5    ,   // try 1.3–1.8
  noseSharpness: 1.3        // independently sharpen the nose
});



this.airshipSprite = this.add.image(cx, cy, 'airship').setOrigin(0.5);
this.altZeroY = this.airshipSprite.y; // altitude 0 at spawn

// Hull frame (compound)
    const parts = [];
    parts.push(this.matter.bodies.rectangle(cx, cy - this.texHeight / 2, this.texWidth, 4));
    parts.push(this.matter.bodies.rectangle(cx, cy + this.texHeight / 2, this.texWidth, 4));
    parts.push(this.matter.bodies.rectangle(cx - this.texWidth / 2, cy, 4, this.texHeight));
    parts.push(this.matter.bodies.rectangle(cx + this.texWidth / 2, cy, 4, this.texHeight));
    for (let i = 1; i < slots; i++) {
      const x = cx - this.texWidth / 2 + i * slotWidth;
      parts.push(this.matter.bodies.rectangle(x, cy, 4, this.texHeight));
    }
    this.frame = this.matter.body.create({ parts });
    this.matter.world.add(this.frame);

// --- Helium balls (spawn near TOP of hull) ---
this.balls = [];
const r = 8;
const hullTopY = cy - this.texHeight / 2;
const topPad = r + 5;         // was r+3; gives a tad more safety
const topBand = 36;
for (let i = 0; i < slots; i++) {
  for (let j = 0; j < 3; j++) {
    const bx = cx - this.texWidth / 2 + i * slotWidth + slotWidth / 2;
    const by = Phaser.Math.Between(
      Math.floor(hullTopY + topPad),
      Math.floor(hullTopY + Math.min(topBand, this.texHeight - 2 * topPad))
    );
    const ball = this.matter.add.circle(bx, by, r, {
      restitution: 0.6,
      frictionAir: 0.03
    });
    this.matter.body.setVelocity(ball, { x: 0, y: 0 });
    this.matter.body.setAngularVelocity(ball, 0);
    this.balls.push(ball);
  }
}


    // Payload weights (non-colliding sensors)
    const W = weightsConfig;
    this.payloads = [];
    this.weightForceScale = 0.00012;
    const payloadBaseW = Math.max(12, slotWidth * 0.35);
    const hullBottomY  = cy + this.texHeight / 2;

    for (let i = 0; i < slots; i++) {
      const wVal = (W.weights?.[i] ?? 0);
      const slotCenterX = cx - this.texWidth / 2 + i * slotWidth + slotWidth / 2;

      // create payload
      const payload = this.matter.add.rectangle(
        slotCenterX,
        hullBottomY + payloadBaseH * 0.5 + 2,
        payloadBaseW,
        payloadBaseH,
        {
          isSensor: true, // no collisions; still constrained
          frictionAir: 0.02 + 0.01 * Math.min(wVal, 5),
          restitution: 0.1,
          chamfer: { radius: 2 }
        }
      );

      // attach with exact rest length (2px) to avoid first-frame impulse
      const localAx = slotCenterX - this.frame.position.x;
      const localAy = hullBottomY  - this.frame.position.y;
      const restLen = 2;
      this.matter.add.constraint(this.frame, payload, restLen, 0.9, {
        pointA: { x: localAx, y: localAy },
        pointB: { x: 0, y: -payloadBaseH / 2 }
      });

      // ensure no initial velocity
      this.matter.body.setVelocity(payload, { x: 0, y: 0 });
      this.matter.body.setAngularVelocity(payload, 0);

      this.payloads.push({ body: payload, weight: wVal });
    }

    // Controls
    this.cursors = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // Camera
    this.cam.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cam.startFollow(this.airshipSprite, true, 1, 1); // during settle

    // HUD
    this.altText = this.add.text(16, 16, '', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#001a33',
      backgroundColor: '#ffffffcc',
      padding: { left: 8, right: 8, top: 4, bottom: 4 }
    }).setScrollFactor(0).setDepth(1000);

    // --- brief static settle to prevent first-frame pops ---
    this.settleFrames = 15; // ~200ms
    this.matter.body.setStatic(this.frame, true);

    // ramp forces in after release to avoid a "kick"
    this.forceRamp = 0; // 0..1 multiplier for buoyancy + weights

    this.time.delayedCall(150, () => {
      this.matter.body.setStatic(this.frame, false);
      this.matter.body.setVelocity(this.frame, { x: 0, y: 0 });
      this.matter.body.setAngularVelocity(this.frame, 0);

      // tween ramp from 0 -> 1 over 300ms
      this.tweens.add({
        targets: this,
        forceRamp: 1,
        duration: 300,
        ease: 'Sine.Out'
      });

      // after settle, restore comfy camera smoothing + deadzone
      this.cam.startFollow(this.airshipSprite, true, 0.08, 0.08);
      this.cam.setDeadzone(viewW * 0.25, viewH * 0.35);
    });

    // Useful references
    this.floorY = floorY;
  }

  update() {
    // ---- skip forces while settling ----
    if (this.settleFrames > 0) {
      this.settleFrames--;
      // keep sprite synced during settle
      this.airshipSprite.x = this.frame.position.x;
      this.airshipSprite.y = this.frame.position.y;
      this.airshipSprite.rotation = this.frame.angle;
      return;
    }

    // Buoyancy (scaled by forceRamp to avoid a kick)
    const bottomBand = this.worldHeight - 100;
    this.balls.forEach(ball => {
      let lift = 0;
      if (ball.position.y > bottomBand)             lift = -0.00005;
      else if (ball.position.y > bottomBand * 0.66) lift = -0.00003;
      else if (ball.position.y > bottomBand * 0.33) lift = -0.00001;
      else                                          lift =  0.00001;
      if (this.forceRamp > 0) {
        this.matter.body.applyForce(ball, ball.position, { x: 0, y: lift * this.forceRamp });
      }
    });

    // WASD thrust
    const force = 0.005;
    if (this.cursors.left.isDown)  this.matter.body.applyForce(this.frame, this.frame.position, { x: -force, y: 0 });
    if (this.cursors.right.isDown) this.matter.body.applyForce(this.frame, this.frame.position, { x:  force, y: 0 });
    if (this.cursors.up.isDown)    this.matter.body.applyForce(this.frame, this.frame.position, { x: 0, y: -force });
    if (this.cursors.down.isDown)  this.matter.body.applyForce(this.frame, this.frame.position, { x: 0, y:  force });

    // Sync hull sprite
    this.airshipSprite.x = this.frame.position.x;
    this.airshipSprite.y = this.frame.position.y;
    this.airshipSprite.rotation = this.frame.angle;

    // Weight forces (scaled by forceRamp)
    for (const p of this.payloads) {
      const f = (p.weight || 0) * this.weightForceScale * this.forceRamp;
      if (f) this.matter.body.applyForce(p.body, p.body.position, { x: 0, y: f });
    }

    // Background / FX / HUD
    this.updateCloudDrift();
    this.updateAltitudeFX();
    this.updateAltitudeHUD();
  }

  // ==== Altitude helpers ====
  getAltitudeMeters() {
    const y = this.airshipSprite.y;
    const altPx = Math.max(0, (this.altZeroY - y)); // 0 at spawn
    return altPx * this.mPerPx;
  }

  getLayerName(km) {
    if (km < this.kmTroposphereTop) return 'Troposphere';
    if (km < this.kmStratosphereTop) return 'Stratosphere';
    if (km < this.kmMesosphereTop)   return 'Mesosphere';
    return 'Thermosphere';
  }

  // ==== Altitude FX: quicker cloud fade + earlier stars, ground stays visible ====
  updateAltitudeFX() {
    const altM  = this.getAltitudeMeters();
    const altKm = altM / 1000;

    // Earlier, stronger sky shift (0 → 30 km)
    const tColor = Phaser.Math.Clamp(altKm / 30, 0, 1);
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.IntegerToColor(this.skyNear),
      Phaser.Display.Color.IntegerToColor(this.skyHigh),
      1000, Math.floor(tColor * 1000)
    );
    this.cam.setBackgroundColor(Phaser.Display.Color.GetColor(c.r, c.g, c.b));

    // --- Cloud density: ramp fast, peak low, gone by ~20 km ---
    let cloudFactor;
    if (altKm <= 2) {
      cloudFactor = Phaser.Math.Easing.Cubic.Out(altKm / 2);
    } else if (altKm <= 3.5) {
      cloudFactor = 1.0;
    } else if (altKm <= 20) {
      const t = (altKm - 3.5) / (20 - 3.5);
      cloudFactor = Phaser.Math.Easing.Quadratic.In(1 - t);
    } else {
      cloudFactor = 0;
    }

    // Cirrus band only ~2–6 km
    let cirrusFactor = 0;
    if (altKm <= 2) {
      cirrusFactor = Phaser.Math.Easing.Sine.InOut(altKm / 2);
    } else if (altKm <= 6) {
      cirrusFactor = 1 - ((altKm - 2) / 4);
    }

    // Apply to cloud layers
    if (this.cloudLayers) {
      for (const layer of this.cloudLayers) {
        const isCirrus = (layer.key === 'CIRRUS');
        const f = isCirrus ? cirrusFactor : cloudFactor;
        for (const spr of layer.sprites) spr.setAlpha(layer.baseAlpha * f);
      }
    }

    // --- Stars: start ~25 km, full by ~45 km ---
    let starAlpha = 0;
    if (altKm >= 25 && altKm < 45) {
      starAlpha = (altKm - 25) / (45 - 25);
    } else if (altKm >= 45) {
      starAlpha = 1;
    }
    if (this.stars) {
      const tNow = this.time.now * 0.004;
      for (const s of this.stars) {
        const tw = (Math.sin(tNow + s._twinkle) * 0.25) + 0.85;
        s.setAlpha(starAlpha * tw);
      }
    }
  }

  // ==== HUD ====
  updateAltitudeHUD() {
    const altM  = this.getAltitudeMeters();
    const altKm = altM / 1000;
    const layer = this.getLayerName(altKm);
    this.altText.setText(`Altitude: ${altKm.toFixed(2)} km  |  Layer: ${layer}`);
  }

  // ==== Clouds ====
  makeCloudTexture() {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(60, 40, 28);
    g.fillCircle(40, 50, 22);
    g.fillCircle(80, 48, 24);
    g.fillCircle(50, 35, 20);
    g.fillCircle(70, 32, 18);
    g.generateTexture('cloudTex', 120, 80);
    g.destroy();
  }

  spawnCloudLayer({ key, count, scale, alpha, scrollX, scrollY, driftX }) {
    if (!this.cloudLayers) this.cloudLayers = [];
    const group = [];
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(0, this.worldWidth);
      const y = Phaser.Math.Between(40, this.worldHeight * 0.75);
      const s = Phaser.Math.FloatBetween(scale[0], scale[1]);
      const img = this.add.image(x, y, 'cloudTex')
        .setScale(s)
        .setAlpha(alpha)
        .setScrollFactor(scrollX, scrollY)
        .setDepth(-10);
      img._driftX = driftX * Phaser.Math.FloatBetween(0.5, 1.5) * (Math.random() < 0.5 ? -1 : 1);
      group.push(img);
    }
    this.cloudLayers.push({ key, sprites: group, baseAlpha: alpha });
  }

  updateCloudDrift() {
    if (!this.cloudLayers) return;
    for (const layer of this.cloudLayers) {
      for (const c of layer.sprites) {
        c.x += c._driftX;
        if (c.x < -150) c.x = this.worldWidth + 150;
        if (c.x > this.worldWidth + 150) c.x = -150;
      }
    }
  }

  // ==== Stars ====
  makeStarsTexture() {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(2, 2, 2);
    g.generateTexture('starTex', 4, 4);
    g.destroy();
  }

  spawnStars({ count, scrollX, scrollY }) {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(0, this.worldWidth);
      const y = Phaser.Math.Between(0, this.worldHeight * 0.8);
      const s = this.add.image(x, y, 'starTex')
        .setAlpha(0)
        .setScrollFactor(scrollX, scrollY)
        .setDepth(-20);
      s._twinkle = Math.random() * Math.PI * 2;
      this.stars.push(s);
    }
  }
// Tail half-ellipse + mid rectangle + nose half-ellipse,
// with optional ribs and a middle horizontal line.
// New: tailSharpness & noseSharpness (>=1) make ends pointier independently.
makeEllipseCylinderHullTexture(key, w, h, opts = {}) {
  const {
    tailFrac = 0.28,
    midFrac  = 0.44,
    noseFrac = 0.28,
    color    = 0x3498db,
    outline  = 0x000000,
    strokePx = 2,

    // ribs
    ribCount     = 8,
    ribColor     = 0x000000,
    ribWidthPx   = 1,
    ribAlpha     = 0.20,
    ribInnerFrac = 0.85,

    // sharpness controls (>= 1.0). 1.0 = normal ellipse (no change)
    tailSharpness = 1.0,
    noseSharpness = 1.0
  } = opts;

  // Normalize fractions so they fill the texture width
  const sum = Math.max(0.001, tailFrac + midFrac + noseFrac);
  const tailW = (w * tailFrac) / sum;   // semi-major of tail half-ellipse
  const midW  = (w * midFrac)  / sum;   // rect width
  const noseW = (w * noseFrac) / sum;   // semi-major of nose half-ellipse

  // Seams and geometry
  const seamTail = tailW;               // [0 .. tailW]
  const seamNose = tailW + midW;        // [tailW .. tailW+midW]
  const cY       = h / 2;
  const bPad     = Math.max(1, strokePx + 1); // keep stroke inside vertically
  const b        = (h / 2) - bPad;      // shared semi-minor (vertical radius)

  const N = 64; // curve resolution

  // Build a closed contour at a given vertical radius (bVal)
  const buildContours = (bVal) => {
    const top = [];
    const bottom = [];

    // ---- Tail top: x 0 -> seamTail (LEFT -> RIGHT), center at seamTail
    for (let i = 0; i <= N; i++) {
      const x  = (i / N) * seamTail;
      const dx = x - seamTail; // ≤ 0
      const under = 1 - (dx * dx) / (tailW * tailW);
      const dy = under > 0 ? bVal * Math.pow(under, tailSharpness * 0.5) : 0;
      top.push(new Phaser.Math.Vector2(x, cY - dy));
    }

    // ---- Top rectangle edge: seamTail -> seamNose (straight, y = cY - bVal)
    top.push(new Phaser.Math.Vector2(seamNose, cY - bVal));

    // ---- Nose top: seamNose -> w (RIGHT side), center at seamNose
    for (let i = 1; i <= N; i++) {
      const x  = seamNose + (i / N) * (w - seamNose);
      const dx = x - seamNose; // ≥ 0
      const under = 1 - (dx * dx) / (noseW * noseW);
      const dy = under > 0 ? bVal * Math.pow(under, noseSharpness * 0.5) : 0;
      top.push(new Phaser.Math.Vector2(x, cY - dy));
    }

    // ---- Nose bottom: w -> seamNose (RIGHT -> LEFT)
    for (let i = 0; i <= N; i++) {
      const x  = w - (i / N) * (w - seamNose);
      const dx = x - seamNose;
      const under = 1 - (dx * dx) / (noseW * noseW);
      const dy = under > 0 ? bVal * Math.pow(under, noseSharpness * 0.5) : 0;
      bottom.push(new Phaser.Math.Vector2(x, cY + dy));
    }

    // ---- Bottom rectangle: seamNose -> seamTail (RIGHT -> LEFT)
    bottom.push(new Phaser.Math.Vector2(seamTail, cY + bVal));

    // ---- Tail bottom: seamTail -> 0 (RIGHT -> LEFT), sharp tail formula too
    for (let i = 0; i <= N; i++) {
      const x  = seamTail - (i / N) * seamTail;
      const dx = x - seamTail; // ≤ 0
      const under = 1 - (dx * dx) / (tailW * tailW);
      const dy = under > 0 ? bVal * Math.pow(under, tailSharpness * 0.5) : 0;
      bottom.push(new Phaser.Math.Vector2(x, cY + dy));
    }

    return top.concat(bottom); // single, non-self-intersecting loop
  };

  // --- draw filled hull (outer contour) ---
  const outerPoly = buildContours(b);
  const g = this.add.graphics();
  g.clear();
  g.fillStyle(color, 1);
  g.lineStyle(strokePx, outline, 1);
  g.beginPath();
  g.moveTo(outerPoly[0].x, outerPoly[0].y);
  for (let i = 1; i < outerPoly.length; i++) g.lineTo(outerPoly[i].x, outerPoly[i].y);
  g.closePath();
  g.fillPath();
  g.strokePath();

  // --- ribs (inner outlines only) ---
  if (ribCount > 0) {
    for (let k = 1; k <= ribCount; k++) {
      const t = k / (ribCount + 1);
      const depth  = t * ribInnerFrac;
      const bInner = b * (1 - depth);
      if (bInner <= 0) continue;

      const ribPoly = buildContours(bInner);
      g.lineStyle(ribWidthPx, ribColor, ribAlpha);
      g.beginPath();
      g.moveTo(ribPoly[0].x, ribPoly[0].y);
      for (let i = 1; i < ribPoly.length; i++) g.lineTo(ribPoly[i].x, ribPoly[i].y);
      g.closePath();
      g.strokePath();
    }
  }

  // --- middle horizontal line ---
  g.lineStyle(ribWidthPx, ribColor, ribAlpha);
  g.beginPath();
  g.moveTo(0, cY);
  g.lineTo(w, cY);
  g.strokePath();

  g.generateTexture(key, w, h);
  g.destroy();
}

}