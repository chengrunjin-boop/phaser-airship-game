import { SKY, ALTITUDE } from '../config/constants.js';

export function updateAltitudeFX(scene) {
  const altM  = getAltitudeMeters(scene);
  const altKm = altM / 1000;

  // sky color (0 → 30 km)
  const tColor = Phaser.Math.Clamp(altKm / 30, 0, 1);
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(
    Phaser.Display.Color.IntegerToColor(SKY.near),
    Phaser.Display.Color.IntegerToColor(SKY.high),
    1000, Math.floor(tColor * 1000)
  );
  scene.cam.setBackgroundColor(Phaser.Display.Color.GetColor(c.r, c.g, c.b));

  // clouds fade
  let cloudFactor;
  if (altKm <= 2) cloudFactor = Phaser.Math.Easing.Cubic.Out(altKm / 2);
  else if (altKm <= 3.5) cloudFactor = 1;
  else if (altKm <= 20) cloudFactor = Phaser.Math.Easing.Quadratic.In(1 - ((altKm - 3.5) / (20 - 3.5)));
  else cloudFactor = 0;

  // cirrus band ~2–6 km
  let cirrusFactor = 0;
  if (altKm <= 2) cirrusFactor = Phaser.Math.Easing.Sine.InOut(altKm / 2);
  else if (altKm <= 6) cirrusFactor = 1 - ((altKm - 2) / 4);

  if (scene.cloudLayers) {
    for (const layer of scene.cloudLayers) {
      const isCirrus = (layer.key === 'CIRRUS');
      const f = isCirrus ? cirrusFactor : cloudFactor;
      for (const spr of layer.sprites) spr.setAlpha(layer.baseAlpha * f);
    }
  }

  // stars start ~25 km
  let starAlpha = 0;
  if (altKm >= 25 && altKm < 45) starAlpha = (altKm - 25) / 20;
  else if (altKm >= 45) starAlpha = 1;

  if (scene.stars) {
    const tNow = scene.time.now * 0.004;
    for (const s of scene.stars) {
      const tw = (Math.sin(tNow + s._twinkle) * 0.25) + 0.85;
      s.setAlpha(starAlpha * tw);
    }
  }
}

export function getAltitudeMeters(scene) {
  const altPx = Math.max(0, (scene.altZeroY - scene.airshipSprite.y));
  return altPx * ALTITUDE.mPerPx;
}

export function layerName(km) {
  const { troposphereKm, stratosphereKm, mesosphereKm } = ALTITUDE;
  if (km < troposphereKm) return 'Troposphere';
  if (km < stratosphereKm) return 'Stratosphere';
  if (km < mesosphereKm)   return 'Mesosphere';
  return 'Thermosphere';
}
