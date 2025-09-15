// src/ui/ControlPanel.js

export function createControlPanel(scene) {
  const viewW = scene.sys.game.config.width;
  const viewH = scene.sys.game.config.height;

  // Panel background
  const panelW = 300;
  const panelH = 120;
  const panelX = viewW - (panelW / 2) - 20;
  const panelY = viewH - (panelH / 2) - 20;
  const panel = scene.add.graphics();
  panel.fillStyle(0x000000, 0.4).fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 10);
  panel.setScrollFactor(0).setDepth(999);

  // Throttle bar
  const throttleBarW = 12;
  const throttleBarH = 80;
  const throttleBarX = panelX - 100;
  const throttleBarY = panelY + 10;
  const throttleBg = scene.add.graphics();
  throttleBg.fillStyle(0x111111, 0.8).fillRect(throttleBarX - throttleBarW / 2, throttleBarY - throttleBarH / 2, throttleBarW, throttleBarH);
  throttleBg.setScrollFactor(0).setDepth(1000);
  const throttleFill = scene.add.graphics();
  throttleFill.setScrollFactor(0).setDepth(1001);

  // Direction arrow
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
  arrowGraphics.generateTexture('motorArrow', texW, texH).destroy();
  const arrowX = panelX ;
  const arrowY = panelY + 10;
  const arrow = scene.add.image(arrowX, arrowY, 'motorArrow').setScrollFactor(0).setDepth(1002).setOrigin(0.5, 0.5);

  // Labels
  const labelStyle = { fontFamily: 'monospace', fontSize: '11px', color: '#ffffff', stroke: '#000000', strokeThickness: 2, align: 'center' };
  scene.add.text(throttleBarX, panelY - 48, 'THROTTLE', labelStyle).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1002);
  scene.add.text(arrowX, panelY - 48, 'DIRECTION', labelStyle).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1002);

  // --- NEW: Motor Mode Display ---
  const modeLabelStyle = { fontFamily: 'monospace', fontSize: '12px', color: '#ffffaa', stroke: '#000000', strokeThickness: 3, align: 'center' };
  const modeText = scene.add.text(panelX+100, panelY, '', modeLabelStyle)
    .setOrigin(0.5, 0.5)
    .setScrollFactor(0)
    .setDepth(1003);

  return {
    arrow: arrow,
    throttle: { x: throttleBarX, y: throttleBarY, width: throttleBarW, height: throttleBarH, fill: throttleFill },
    modeText: modeText // Return the new text object
  };
}

export function updateControlPanel(panel, motorVector, throttle, motorMode) {
  // Update arrow rotation
  panel.arrow.rotation = motorVector.angle() + Math.PI / 2;

  // Update throttle indicator
  const indicator = panel.throttle;
  indicator.fill.clear();
  const color = Phaser.Display.Color.Interpolate.ColorWithColor(
    Phaser.Display.Color.ValueToColor(0x00ff00),
    Phaser.Display.Color.ValueToColor(0xff0000),
    100,
    throttle * 100
  );
  indicator.fill.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 0.9);
  const fillH = indicator.height * throttle;
  indicator.fill.fillRect(indicator.x - indicator.width / 2, indicator.y + indicator.height / 2 - fillH, indicator.width, fillH);

  // --- NEW: Update Motor Mode Text ---
  let modeString = '';
  switch (motorMode) {
    case 1: modeString = 'MODE: MANUAL'; break;
    case 2: modeString = 'MODE: NEUTRAL'; break;
    case 3: modeString = 'MODE: CRUISE (WIP)'; break;
  }
  panel.modeText.setText(modeString);
}