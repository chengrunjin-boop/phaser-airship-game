// src/physics/Atmosphere.js
import { ATMOSPHERE } from '../config/constants.js';

/**
 * Calculates the air temperature at a given altitude.
 * @param {number} altMeters - The altitude in meters.
 * @returns {number} The temperature in Kelvin.
 */
function getTemperatureAtAltitude(altMeters) {
  // Simple linear decrease based on the lapse rate.
  return ATMOSPHERE.SEA_LEVEL_TEMP_K - (altMeters * ATMOSPHERE.LAPSE_RATE_K_PER_M);
}

/**
 * Calculates the ratio of air density at altitude compared to sea level.
 * This is a simplified model for game purposes. Real air density is more complex.
 * Lift is directly proportional to air density.
 * @param {number} altMeters - The altitude in meters.
 * @returns {number} A ratio from ~1.0 (at sea level) towards 0.0 (in space).
 */
export function getDensityRatio(altMeters) {
  const tempAtAltitude = getTemperatureAtAltitude(altMeters);
  
  // Simplified model: density ratio is proportional to temperature ratio.
  // This captures the effect of "colder air is denser".
  // We clamp it at 0 to prevent negative density.
  const densityRatio = tempAtAltitude / ATMOSPHERE.SEA_LEVEL_TEMP_K;
  
  return Math.max(0, densityRatio);
}