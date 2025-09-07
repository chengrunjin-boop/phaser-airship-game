import { getAltitudeMeters, layerName } from './AltitudeFX.js';

export function createHUD(scene) {
  scene.altText = scene.add.text(16, 16, '', {
    fontSize: '18px', fontFamily: 'monospace',
    color: '#001a33',
    backgroundColor: '#ffffffcc',
    padding: { left: 8, right: 8, top: 4, bottom: 4 }
  }).setScrollFactor(0).setDepth(1000);
}

export function updateHUD(scene) {
  const altKm = getAltitudeMeters(scene) / 1000;
  scene.altText.setText(`Altitude: ${altKm.toFixed(2)} km  | ${layerName(altKm)}`);
}
