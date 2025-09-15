// src/ui/TelemetryPanel.js
import { getAltitudeMeters } from './AltitudeFX.js';

export function createTelemetryPanel(scene) {
  // --- 1. Create the panel background ---
  const panelW = 200;
  const panelH = 100;
  const panelX = 20; // Position on the left
  const panelY = 20; // Position at the top
  const panel = scene.add.graphics();
  panel.fillStyle(0x000000, 0.4).fillRoundedRect(panelX, panelY, panelW, panelH, 10);
  panel.setScrollFactor(0).setDepth(999);

  // --- 2. Create the text elements ---
  const labelStyle = { fontFamily: 'monospace', fontSize: '13px', color: '#ffffff' };
  const valueStyle = { fontFamily: 'monospace', fontSize: '13px', color: '#aaffaa' };

  // Labels (static text)
  scene.add.text(panelX + 10, panelY + 10, 'Altitude:', labelStyle).setScrollFactor(0).setDepth(1000);
  scene.add.text(panelX + 10, panelY + 30, 'Pitch:', labelStyle).setScrollFactor(0).setDepth(1000);
  scene.add.text(panelX + 10, panelY + 50, 'Velocity X:', labelStyle).setScrollFactor(0).setDepth(1000);
  scene.add.text(panelX + 10, panelY + 70, 'Velocity Y:', labelStyle).setScrollFactor(0).setDepth(1000);

  // Values (dynamic text that will be updated)
  const altText = scene.add.text(panelX + 110, panelY + 10, '', valueStyle).setScrollFactor(0).setDepth(1000);
  const pitchText = scene.add.text(panelX + 110, panelY + 30, '', valueStyle).setScrollFactor(0).setDepth(1000);
  const velXText = scene.add.text(panelX + 110, panelY + 50, '', valueStyle).setScrollFactor(0).setDepth(1000);
  const velYText = scene.add.text(panelX + 110, panelY + 70, '', valueStyle).setScrollFactor(0).setDepth(1000);

  // Return an object containing the dynamic text elements
  return {
    altText,
    pitchText,
    velXText,
    velYText
  };
}

export function updateTelemetryPanel(scene, panel) {
  // --- Get Raw Data ---
  const altitude = getAltitudeMeters(scene) / 1000; // In km
  const pitch = Phaser.Math.RadToDeg(scene.frame.angle);
  const velocity = scene.frame.velocity;

  // --- Format and Display Data ---
  panel.altText.setText(`${altitude.toFixed(2)} km`);
  panel.pitchText.setText(`${pitch.toFixed(1)}°`);
  panel.velXText.setText(`${(velocity.x * 10).toFixed(1)} m/s`); // Arbitrary scaling for readability
  panel.velYText.setText(`${(-velocity.y * 10).toFixed(1)} m/s`);// Invert Y so up is positive
}