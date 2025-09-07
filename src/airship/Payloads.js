export function spawnPayloads(scene, frame, weightsConfig, cx, cy, texW, texH, slots, payloadBaseH = 14) {
  const slotW = texW / slots;
  const payloadBaseW = Math.max(12, slotW * 0.35);
  const hullBottomY  = cy + texH / 2;

  const payloads = [];
  for (let i = 0; i < slots; i++) {
    const wVal = (weightsConfig.weights?.[i] ?? 0);
    const slotCenterX = cx - texW / 2 + i * slotW + slotW / 2;

    const payload = scene.matter.add.rectangle(
      slotCenterX, hullBottomY + payloadBaseH * 0.5 + 2,
      payloadBaseW, payloadBaseH,
      { isSensor: true, frictionAir: 0.02 + 0.01 * Math.min(wVal, 5), restitution: 0.1, chamfer: { radius: 2 } }
    );

    const localAx = slotCenterX - frame.position.x;
    const localAy = hullBottomY  - frame.position.y;
    scene.matter.add.constraint(frame, payload, 2, 0.9, {
      pointA: { x: localAx, y: localAy },
      pointB: { x: 0, y: -payloadBaseH / 2 }
    });

    scene.matter.body.setVelocity(payload, { x: 0, y: 0 });
    scene.matter.body.setAngularVelocity(payload, 0);
    payloads.push({ body: payload, weight: wVal });
  }
  return payloads;
}
