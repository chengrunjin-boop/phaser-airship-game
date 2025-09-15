// src/ui/AltitudeFX.js
import { SKY, ALTITUDE } from '../config/constants.js';

export function updateAltitudeFX(scene) {
  const altM = getAltitudeMeters(scene);
  const altKm = altM / 1000;
  const tColor = Phaser.Math.Clamp(altKm / 30, 0, 1);
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(
    Phaser.Display.Color.IntegerToColor(SKY.near),
    Phaser.Display.Color.IntegerToColor(SKY.high),
    1000, Math.floor(tColor * 1000)
  );
  scene.cam.setBackgroundColor(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
  let cloudFactor;
  if (altKm <= 8) {
    cloudFactor = 1.0;
  } else if (altKm <= 20) {
    const t = (altKm - 8) / (20 - 8);
    cloudFactor = 1 - Phaser.Math.Easing.Quadratic.In(t);
  } else {
    cloudFactor = 0;
  }
  let cirrusFactor = 0;
  if (altKm <= 2) cirrusFactor = Phaser.Math.Easing.Sine.InOut(altKm / 2);
  else if (altKm <= 6) cirrusFactor = 1 - ((altKm - 2) / 4);
  if (scene.cloudLayers) {
    scene.cloudLayers.forEach(layer => {
      const isCirrus = (layer.key === 'CIRRUS');
      const f = isCirrus ? cirrusFactor : cloudFactor;
      layer.sprites.forEach(spr => spr.setAlpha(layer.baseAlpha * f));
    });
  }
  let starAlpha = 0;
  if (altKm >= 25 && altKm < 45) starAlpha = (altKm - 25) / (45 - 25);
  else if (altKm >= 45) starAlpha = 1;
  if (scene.stars) {
    const tNow = scene.time.now * 0.004;
    scene.stars.forEach(s => {
      const tw = (Math.sin(tNow + s._twinkle) * 0.25) + 0.85;
      s.setAlpha(starAlpha * tw);
    });
  }
}

// The layerName function has been removed.

export function getAltitudeMeters(scene) {
  const y = scene.airshipContainer.y;
  const altPx = Math.max(0, (scene.altZeroY - y));
  return altPx * scene.mPerPx;
}