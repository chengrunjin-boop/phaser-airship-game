export function makeCloudTexture(scene) {
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(60, 40, 28);
  g.fillCircle(40, 50, 22);
  g.fillCircle(80, 48, 24);
  g.fillCircle(50, 35, 20);
  g.fillCircle(70, 32, 18);
  g.generateTexture('cloudTex', 120, 80);
  g.destroy();
}

export function spawnCloudLayer(scene, { key, count, scale, alpha, scrollX, scrollY, driftX }) {
  if (!scene.cloudLayers) scene.cloudLayers = [];
  const group = [];
  for (let i = 0; i < count; i++) {
    const x = Phaser.Math.Between(0, scene.worldWidth);
    const y = Phaser.Math.Between(40, scene.worldHeight * 0.75);
    const s = Phaser.Math.FloatBetween(scale[0], scale[1]);
    const img = scene.add.image(x, y, 'cloudTex').setScale(s).setAlpha(alpha).setScrollFactor(scrollX, scrollY).setDepth(-10);
    img._driftX = driftX * Phaser.Math.FloatBetween(0.5, 1.5) * (Math.random() < 0.5 ? -1 : 1);
    group.push(img);
  }
  scene.cloudLayers.push({ key, sprites: group, baseAlpha: alpha });
}

export function makeStarsTexture(scene) {
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(2, 2, 2);
  g.generateTexture('starTex', 4, 4);
  g.destroy();
}

export function spawnStars(scene, { count, scrollX, scrollY }) {
  scene.stars = [];
  for (let i = 0; i < count; i++) {
    const x = Phaser.Math.Between(0, scene.worldWidth);
    const y = Phaser.Math.Between(0, scene.worldHeight * 0.8);
    const s = scene.add.image(x, y, 'starTex').setAlpha(0).setScrollFactor(scrollX, scrollY).setDepth(-20);
    s._twinkle = Math.random() * Math.PI * 2;
    scene.stars.push(s);
  }
}

export function updateCloudDrift(scene) {
  if (!scene.cloudLayers) return;
  for (const layer of scene.cloudLayers) {
    for (const c of layer.sprites) {
      c.x += c._driftX;
      if (c.x < -150) c.x = scene.worldWidth + 150;
      if (c.x > scene.worldWidth + 150) c.x = -150;
    }
  }
}
