/**
 * Fuel Moisture Integration Module
 * Integrates fuel-moisture-calculator library with the Fire Weather Dashboard
 */

const FuelMoistureLib = require('fuel-moisture-calculator');

/**
 * Compute Equilibrium Moisture Content (EMC) using simplified Nelson's equation
 * @param {number} tempF - Temperature in Fahrenheit
 * @param {number} rh - Relative humidity (0-100)
 * @returns {number} EMC in percent
 */
function computeEMC(tempF, rh) {
  if (typeof tempF !== 'number' || typeof rh !== 'number') {
    throw new Error('Invalid input: temperature and humidity must be numbers');
  }
  if (rh < 0 || rh > 100) {
    throw new Error('Relative humidity must be between 0 and 100');
  }

  // Simplified EMC calculation for fire weather
  // Based on empirical relationships between RH, temp, and fuel moisture
  let emc;
  
  if (rh <= 10) {
    // Very dry air - minimal moisture content
    emc = 0.03 + (0.2626 * rh) - (0.00104 * rh * tempF);
    emc = Math.max(0.1, emc);
  } else if (rh <= 50) {
    // Dry to moderate conditions - primary range for fire weather
    // Simplified from Nelson: EMC increases with RH, decreases slightly with temp
    emc = 1.5 + (0.15 * rh) - (0.01 * tempF / 10);
  } else {
    // Moist conditions - higher moisture content
    // EMC increases more rapidly with RH at high humidity
    emc = 6 + (0.25 * (rh - 50)) + (0.02 * (100 - tempF) / 10);
  }

  // Ensure EMC is within reasonable bounds
  return Math.max(0.1, Math.min(40, emc));
}

/**
 * Step moisture content toward equilibrium using time-lag model
 * @param {number} currentMoisture - Current fuel moisture (%)
 * @param {number} emc - Equilibrium moisture content (%)
 * @param {number} hours - Time step in hours
 * @param {number} timeLag - Time lag constant in hours (1, 10, or 100)
 * @returns {number} New moisture content in percent
 */
function stepMoisture(currentMoisture, emc, hours, timeLag) {
  if (typeof currentMoisture !== 'number' || typeof emc !== 'number' || 
      typeof hours !== 'number' || typeof timeLag !== 'number') {
    throw new Error('Invalid input: all parameters must be numbers');
  }

  // Exponential decay model: M(t) = EMC + (M0 - EMC) * exp(-t/τ)
  // Where τ is the time lag constant
  const k = hours / timeLag;
  const newMoisture = emc + (currentMoisture - emc) * Math.exp(-k);
  
  return Math.max(0, newMoisture);
}

/**
 * Run moisture model over multiple time steps
 * @param {number} initialMoisture - Starting moisture content (%)
 * @param {Array} weatherSteps - Array of weather conditions {tempF, rh, hours}
 * @param {number} timeLag - Time lag constant (default: 1 for 1-hour fuels)
 * @returns {Array} Array of moisture values over time
 */
function runModel(initialMoisture, weatherSteps, timeLag = 1) {
  if (!Array.isArray(weatherSteps)) {
    throw new Error('weatherSteps must be an array');
  }

  const results = [{
    hours: 0,
    moisture: initialMoisture,
    emc: null
  }];

  let currentMoisture = initialMoisture;
  let cumulativeHours = 0;

  for (const step of weatherSteps) {
    const { tempF, rh, hours } = step;
    
    if (typeof tempF !== 'number' || typeof rh !== 'number' || typeof hours !== 'number') {
      throw new Error('Invalid weather step: must contain tempF, rh, and hours');
    }

    const emc = computeEMC(tempF, rh);
    currentMoisture = stepMoisture(currentMoisture, emc, hours, timeLag);
    cumulativeHours += hours;

    results.push({
      hours: cumulativeHours,
      moisture: Math.round(currentMoisture * 10) / 10,
      emc: Math.round(emc * 10) / 10,
      tempF,
      rh
    });
  }

  return results;
}

/**
 * Calculate drying pattern for a fuel type
 * @param {number} initialMoisture - Starting moisture (%)
 * @param {number} tempF - Temperature in Fahrenheit
 * @param {number} rh - Relative humidity (%)
 * @param {number} duration - Duration in hours
 * @param {number} timeLag - Time lag constant (1, 10, or 100)
 * @returns {Object} Drying pattern data
 */
function calculateDryingPattern(initialMoisture, tempF, rh, duration, timeLag = 1) {
  const emc = computeEMC(tempF, rh);
  const steps = [];
  const intervalHours = Math.max(1, duration / 24); // Up to 24 data points
  
  let currentMoisture = initialMoisture;
  steps.push({ hours: 0, moisture: currentMoisture });

  for (let hour = intervalHours; hour <= duration; hour += intervalHours) {
    currentMoisture = stepMoisture(currentMoisture, emc, intervalHours, timeLag);
    steps.push({ 
      hours: Math.round(hour * 10) / 10, 
      moisture: Math.round(currentMoisture * 10) / 10 
    });
  }

  return {
    emc: Math.round(emc * 10) / 10,
    timeLag,
    steps,
    finalMoisture: steps[steps.length - 1].moisture,
    description: `${timeLag}-hour fuel drying from ${initialMoisture}% to ${steps[steps.length - 1].moisture}% over ${duration} hours`
  };
}

// Export functions for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    computeEMC,
    stepMoisture,
    runModel,
    calculateDryingPattern,
    // Re-export base library functions
    calculateMoisture: FuelMoistureLib.calculateMoisture
  };
}

// Make available in browser
if (typeof window !== 'undefined') {
  window.FuelMoistureIntegration = {
    computeEMC,
    stepMoisture,
    runModel,
    calculateDryingPattern
  };
}
