/**
 * Five Forks Fire Behavior Calculator
 * Implements Rothermel fire spread model and Byram flame length
 * For use with Five Forks Fire Weather Dashboard
 * Integrated with fuel-moisture-calculator library
 */

// Import fuel moisture calculator if in Node.js environment
let FuelMoistureIntegration = null;
if (typeof require !== 'undefined') {
  try {
    FuelMoistureIntegration = require('./fuel-moisture-integration.js');
  } catch (e) {
    // Module not available, will use window object in browser
  }
}

// ==================== FUEL MODEL DEFINITIONS ====================

const FUEL_MODELS = {
  '1': {
    name: 'Short Grass (1 ft)',
    load: 0.74,        // tons/acre
    savRatio: 3500,    // ft^-1
    depth: 1.0,        // feet
    moistureExt: 12,   // percent
    heatContent: 8000  // BTU/lb
  },
  '2': {
    name: 'Timber Grass/Understory (1 ft)',
    load: 2.0,
    savRatio: 3000,
    depth: 1.0,
    moistureExt: 15,
    heatContent: 8000
  },
  '3': {
    name: 'Tall Grass (2.5 ft)',
    load: 3.01,
    savRatio: 1500,
    depth: 2.5,
    moistureExt: 25,
    heatContent: 8000
  },
  '4': {
    name: 'Chaparral (6 ft)',
    load: 5.01,
    savRatio: 2000,
    depth: 6.0,
    moistureExt: 20,
    heatContent: 8000
  },
  '5': {
    name: 'Brush (2 ft)',
    load: 1.0,
    savRatio: 2000,
    depth: 2.0,
    moistureExt: 20,
    heatContent: 8000
  },
  '6': {
    name: 'Dormant Brush/Hardwood Slash',
    load: 1.5,
    savRatio: 1750,
    depth: 2.5,
    moistureExt: 25,
    heatContent: 8000
  },
  '7': {
    name: 'Southern Rough',
    load: 1.13,
    savRatio: 1550,
    depth: 2.5,
    moistureExt: 40,
    heatContent: 8000
  },
  '8': {
    name: 'Closed Timber Litter',
    load: 1.5,
    savRatio: 2000,
    depth: 0.2,
    moistureExt: 30,
    heatContent: 8000
  },
  '9': {
    name: 'Hardwood Litter',
    load: 2.92,
    savRatio: 2500,
    depth: 0.2,
    moistureExt: 25,
    heatContent: 8000
  },
  '10': {
    name: 'Timber Litter/Understory',
    load: 3.01,
    savRatio: 2000,
    depth: 1.0,
    moistureExt: 25,
    heatContent: 8000
  }
};

// ==================== ROTHERMEL FIRE SPREAD MODEL ====================

/**
 * Calculate Rate of Spread using Rothermel model
 * @param {number} windSpeed - Wind speed at midflame height (mph)
 * @param {number} fuelMoisture - Fuel moisture content (%)
 * @param {number} slope - Slope steepness (degrees)
 * @param {string} fuelModel - Fuel model key (1-10)
 * @returns {object} { ros: chains/hour, rosMetric: m/min }
 */
function calculateRateOfSpread(windSpeed, fuelMoisture, slope, fuelModel = '2') {
  const fuel = FUEL_MODELS[fuelModel];
  if (!fuel) {
    throw new Error('Invalid fuel model');
  }

  // Check if fire will spread
  if (fuelMoisture >= fuel.moistureExt) {
    return { ros: 0, rosMetric: 0, canSpread: false };
  }

  // Reaction intensity (BTU/ft^2/min)
  const moistureDamping = 1 - (2.59 * (fuelMoisture / fuel.moistureExt)) + 
                          (5.11 * Math.pow(fuelMoisture / fuel.moistureExt, 2)) - 
                          (3.52 * Math.pow(fuelMoisture / fuel.moistureExt, 3));
  
  const reactionIntensity = (fuel.load * fuel.heatContent * moistureDamping) / 60;

  // Propagating flux ratio
  const sigma = fuel.savRatio;
  const propagatingFlux = Math.exp((0.792 + 0.681 * Math.sqrt(sigma)) * 
                                   (0.1 + fuel.depth));

  // Wind coefficient
  const windCoeff = windSpeed > 0 ? 
    (Math.pow(windSpeed, 0.5) * Math.pow(sigma, -0.5) * 0.4) : 0;

  // Slope coefficient (convert degrees to percent then to coefficient)
  const slopePercent = Math.tan(slope * Math.PI / 180) * 100;
  const slopeCoeff = slopePercent > 0 ?
    (5.275 * Math.pow(sigma, -0.3) * Math.pow(slopePercent / 100, 2)) : 0;

  // Rate of spread (ft/min)
  const rosBase = (reactionIntensity * propagatingFlux) / 
                  (fuel.load * 0.01);
  const rosFtPerMin = rosBase * (1 + windCoeff + slopeCoeff);

  // Convert to chains/hour (1 chain = 66 ft)
  const rosChainsPerHour = (rosFtPerMin * 60) / 66;
  
  // Convert to meters/minute
  const rosMetersPerMin = rosFtPerMin * 0.3048;

  return {
    ros: rosChainsPerHour,
    rosMetric: rosMetersPerMin,
    rosFtPerMin: rosFtPerMin,
    canSpread: true,
    reactionIntensity: reactionIntensity
  };
}

// ==================== BYRAM FLAME LENGTH ====================

/**
 * Calculate Flame Length using Byram's equation
 * @param {number} intensity - Fireline intensity (BTU/ft/s)
 * @returns {object} { flameLengthFt: feet, flameLengthM: meters }
 */
function calculateFlameLength(intensity) {
  // Byram's flame length equation: L = 0.45 * I^0.46
  const flameLengthFt = 0.45 * Math.pow(intensity, 0.46);
  const flameLengthM = flameLengthFt * 0.3048;

  return {
    flameLengthFt: flameLengthFt,
    flameLengthM: flameLengthM
  };
}

// ==================== FIRELINE INTENSITY ====================

/**
 * Calculate Fireline Intensity
 * @param {number} ros - Rate of spread (ft/min)
 * @param {number} fuelLoad - Available fuel load (tons/acre)
 * @param {number} heatContent - Heat content (BTU/lb)
 * @returns {number} Fireline intensity (BTU/ft/s)
 */
function calculateFirelineIntensity(ros, fuelLoad, heatContent = 8000) {
  // I = H * w * r / 60
  // where: H = heat content (BTU/lb)
  //        w = fuel load (lb/ft^2)
  //        r = rate of spread (ft/min)
  
  // Convert tons/acre to lb/ft^2
  const fuelLoadLbPerFt2 = (fuelLoad * 2000) / 43560;
  
  // Intensity in BTU/ft/s
  const intensity = (heatContent * fuelLoadLbPerFt2 * ros) / 60;
  
  return intensity;
}

// ==================== COMPLETE FIRE BEHAVIOR PREDICTION ====================

/**
 * Complete fire behavior prediction with optional EMC calculation
 * @param {object} params - { windSpeed, fuelMoisture, slope, fuelModel, temp, rh, useEMC }
 * @returns {object} Complete fire behavior outputs
 */
function predictFireBehavior(params) {
  const {
    windSpeed = 0,
    fuelMoisture = 10,
    slope = 0,
    fuelModel = '2',
    temp = 70,
    rh = 30,
    useEMC = false
  } = params;

  const fuel = FUEL_MODELS[fuelModel];
  if (!fuel) {
    return { error: 'Invalid fuel model' };
  }

  // Calculate EMC if requested and functions are available
  let calculatedEMC = null;
  let effectiveMoisture = fuelMoisture;
  
  if (useEMC && temp && rh) {
    const fuelMoistureCalc = FuelMoistureIntegration || (typeof window !== 'undefined' ? window.FuelMoistureIntegration : null);
    if (fuelMoistureCalc && fuelMoistureCalc.computeEMC) {
      calculatedEMC = fuelMoistureCalc.computeEMC(temp, rh);
      effectiveMoisture = calculatedEMC;
    }
  }

  // Calculate rate of spread
  const spreadResult = calculateRateOfSpread(windSpeed, effectiveMoisture, slope, fuelModel);
  
  if (!spreadResult.canSpread) {
    return {
      canSpread: false,
      message: 'Fuel moisture exceeds extinction moisture. Fire will not spread.',
      fuelModel: fuel.name,
      emc: calculatedEMC
    };
  }

  // Calculate fireline intensity
  const intensity = calculateFirelineIntensity(
    spreadResult.rosFtPerMin,
    fuel.load,
    fuel.heatContent
  );

  // Calculate flame length
  const flameResult = calculateFlameLength(intensity);

  const result = {
    canSpread: true,
    fuelModel: fuel.name,
    rateOfSpread: {
      chainsPerHour: Math.round(spreadResult.ros * 100) / 100,
      metersPerMin: Math.round(spreadResult.rosMetric * 100) / 100,
      feetPerMin: Math.round(spreadResult.rosFtPerMin * 100) / 100
    },
    flameLength: {
      feet: Math.round(flameResult.flameLengthFt * 10) / 10,
      meters: Math.round(flameResult.flameLengthM * 10) / 10
    },
    firelineIntensity: Math.round(intensity),
    conditions: {
      windSpeed: windSpeed,
      fuelMoisture: effectiveMoisture,
      slope: slope,
      temp: temp,
      rh: rh
    }
  };

  if (calculatedEMC !== null) {
    result.emc = Math.round(calculatedEMC * 10) / 10;
  }

  return result;
}

// ==================== EXPORT ====================

// Make functions globally available
if (typeof window !== 'undefined') {
  window.FireBehavior = {
    FUEL_MODELS,
    calculateRateOfSpread,
    calculateFlameLength,
    calculateFirelineIntensity,
    predictFireBehavior
  };
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FUEL_MODELS,
    calculateRateOfSpread,
    calculateFlameLength,
    calculateFirelineIntensity,
    predictFireBehavior
  };
}

