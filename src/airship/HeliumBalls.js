export function spawnHeliumBalls(scene, frameX, frameY, texW, texH, slots, perSlot = 3) {
  const arr = [];
  const r = 8;
  const topPad = r + 5;
  const topBand = 36;
  const slotW = texW / slots;
  const hullTopY = frameY - texH / 2;

  for (let i = 0; i < slots; i++) {
    for (let j = 0; j < perSlot; j++) {
      const bx = frameX - texW / 2 + i * slotW + slotW / 2;
      const by = Phaser.Math.Between(
        Math.floor(hullTopY + topPad),
        Math.floor(hullTopY + Math.min(topBand, texH - 2 * topPad))
      );
      const ball = scene.matter.add.circle(bx, by, r, { restitution: 0.6, frictionAir: 0.03 });
      scene.matter.body.setVelocity(ball, { x: 0, y: 0 });
      scene.matter.body.setAngularVelocity(ball, 0);
      arr.push(ball);
    }
  }
  return arr;
}
