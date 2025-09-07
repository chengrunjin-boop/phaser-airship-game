// src/airship/FrameRectangle.js
export function buildRectFrame(scene, cx, cy, texW, texH, slots, struts = []) {
  const slotW = texW / slots;
  const parts = [];

  // frame rectangles
  parts.push(scene.matter.bodies.rectangle(cx, cy - texH / 2, texW, 4)); // top
  parts.push(scene.matter.bodies.rectangle(cx, cy + texH / 2, texW, 4)); // bottom
  parts.push(scene.matter.bodies.rectangle(cx - texW / 2, cy, 4, texH)); // left
  parts.push(scene.matter.bodies.rectangle(cx + texW / 2, cy, 4, texH)); // right
  for (let i = 1; i < slots; i++) {
    const x = cx - texW / 2 + i * slotW;
    parts.push(scene.matter.bodies.rectangle(x, cy, 4, texH));
  }

// struts (thin rectangles for landing gear)
struts.forEach(s => {
  const { xFrac, strutLen = 10, strutW = 6, wheelR = 5 } = s;
  const gx = cx - texW / 2 + xFrac * texW;
  const gyStrut = cy + texH / 2 + strutLen / 2; 
  const gyWheel = cy + texH / 2 + strutLen + wheelR;

  // strut rectangle
  parts.push(scene.matter.bodies.rectangle(gx, gyStrut, strutW, strutLen));

  // wheel circle (does not spin, part of frame)
  parts.push(scene.matter.bodies.circle(gx, gyWheel, wheelR));
});


  const body = scene.matter.body.create({ parts });
  scene.matter.world.add(body);
  return body;
}
