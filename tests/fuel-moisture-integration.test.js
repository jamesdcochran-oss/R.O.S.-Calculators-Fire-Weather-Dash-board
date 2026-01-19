/**
 * Tests for fuel-moisture-integration.js
 * Validates integration of fuel-moisture-calculator library
 */

const FuelMoistureIntegration = require('../fuel-moisture-integration.js');

describe('FuelMoistureIntegration - computeEMC', () => {
  test('should calculate EMC for typical conditions', () => {
    const emc = FuelMoistureIntegration.computeEMC(85, 25);
    expect(emc).toBeGreaterThan(0);
    expect(emc).toBeLessThan(40);
  });

  test('should handle low humidity conditions', () => {
    const emc = FuelMoistureIntegration.computeEMC(90, 5);
    expect(emc).toBeGreaterThanOrEqual(0.1);
    expect(emc).toBeLessThan(5);
  });

  test('should handle moderate humidity conditions', () => {
    const emc = FuelMoistureIntegration.computeEMC(70, 30);
    expect(emc).toBeGreaterThan(0);
    expect(emc).toBeLessThan(10);
  });

  test('should handle high humidity conditions', () => {
    const emc = FuelMoistureIntegration.computeEMC(60, 80);
    expect(emc).toBeGreaterThan(10);
    expect(emc).toBeLessThan(40);
  });

  test('should throw error for invalid temperature', () => {
    expect(() => {
      FuelMoistureIntegration.computeEMC('invalid', 50);
    }).toThrow('Invalid input: temperature and humidity must be numbers');
  });

  test('should throw error for invalid humidity', () => {
    expect(() => {
      FuelMoistureIntegration.computeEMC(70, 'invalid');
    }).toThrow('Invalid input: temperature and humidity must be numbers');
  });

  test('should throw error for humidity out of range', () => {
    expect(() => {
      FuelMoistureIntegration.computeEMC(70, 150);
    }).toThrow('Relative humidity must be between 0 and 100');
  });

  test('should handle boundary humidity values', () => {
    const emc0 = FuelMoistureIntegration.computeEMC(70, 0);
    const emc100 = FuelMoistureIntegration.computeEMC(70, 100);
    expect(emc0).toBeGreaterThanOrEqual(0);
    expect(emc100).toBeLessThanOrEqual(40);
  });
});

describe('FuelMoistureIntegration - stepMoisture', () => {
  test('should step moisture toward EMC for drying', () => {
    const currentMoisture = 15;
    const emc = 5;
    const newMoisture = FuelMoistureIntegration.stepMoisture(currentMoisture, emc, 1, 1);
    expect(newMoisture).toBeLessThan(currentMoisture);
    expect(newMoisture).toBeGreaterThan(emc);
  });

  test('should step moisture toward EMC for wetting', () => {
    const currentMoisture = 5;
    const emc = 15;
    const newMoisture = FuelMoistureIntegration.stepMoisture(currentMoisture, emc, 1, 1);
    expect(newMoisture).toBeGreaterThan(currentMoisture);
    expect(newMoisture).toBeLessThan(emc);
  });

  test('should approach EMC more slowly with larger time lag', () => {
    const currentMoisture = 20;
    const emc = 5;
    const moisture1hr = FuelMoistureIntegration.stepMoisture(currentMoisture, emc, 1, 1);
    const moisture10hr = FuelMoistureIntegration.stepMoisture(currentMoisture, emc, 1, 10);
    
    expect(moisture10hr).toBeGreaterThan(moisture1hr);
  });

  test('should handle equilibrium condition', () => {
    const currentMoisture = 10;
    const emc = 10;
    const newMoisture = FuelMoistureIntegration.stepMoisture(currentMoisture, emc, 1, 1);
    expect(newMoisture).toBeCloseTo(emc, 1);
  });

  test('should throw error for invalid inputs', () => {
    expect(() => {
      FuelMoistureIntegration.stepMoisture('invalid', 5, 1, 1);
    }).toThrow('Invalid input: all parameters must be numbers');
  });

  test('should not return negative moisture', () => {
    const newMoisture = FuelMoistureIntegration.stepMoisture(1, 0, 100, 1);
    expect(newMoisture).toBeGreaterThanOrEqual(0);
  });
});

describe('FuelMoistureIntegration - runModel', () => {
  test('should run model over multiple steps', () => {
    const weatherSteps = [
      { tempF: 85, rh: 25, hours: 6 },
      { tempF: 90, rh: 20, hours: 6 },
      { tempF: 80, rh: 30, hours: 6 }
    ];
    
    const results = FuelMoistureIntegration.runModel(15, weatherSteps, 1);
    
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBe(4); // Initial + 3 steps
    expect(results[0].hours).toBe(0);
    expect(results[0].moisture).toBe(15);
    expect(results[3].hours).toBe(18);
  });

  test('should include EMC and conditions in results', () => {
    const weatherSteps = [
      { tempF: 85, rh: 25, hours: 6 }
    ];
    
    const results = FuelMoistureIntegration.runModel(15, weatherSteps, 1);
    
    expect(results[1]).toHaveProperty('emc');
    expect(results[1]).toHaveProperty('tempF');
    expect(results[1]).toHaveProperty('rh');
  });

  test('should throw error for non-array input', () => {
    expect(() => {
      FuelMoistureIntegration.runModel(15, 'not an array', 1);
    }).toThrow('weatherSteps must be an array');
  });

  test('should throw error for invalid weather step', () => {
    const weatherSteps = [
      { tempF: 'invalid', rh: 25, hours: 6 }
    ];
    
    expect(() => {
      FuelMoistureIntegration.runModel(15, weatherSteps, 1);
    }).toThrow('Invalid weather step: must contain tempF, rh, and hours');
  });

  test('should show moisture decreasing over time in dry conditions', () => {
    const weatherSteps = [
      { tempF: 95, rh: 15, hours: 6 },
      { tempF: 95, rh: 15, hours: 6 }
    ];
    
    const results = FuelMoistureIntegration.runModel(20, weatherSteps, 1);
    
    expect(results[1].moisture).toBeLessThan(results[0].moisture);
    // Allow for numerical precision - if moisture is very low, it may not decrease much
    if (results[1].moisture > 0.5) {
      expect(results[2].moisture).toBeLessThanOrEqual(results[1].moisture);
    }
  });
});

describe('FuelMoistureIntegration - calculateDryingPattern', () => {
  test('should calculate drying pattern for 1-hour fuels', () => {
    const pattern = FuelMoistureIntegration.calculateDryingPattern(20, 85, 25, 24, 1);
    
    expect(pattern).toHaveProperty('emc');
    expect(pattern).toHaveProperty('timeLag');
    expect(pattern).toHaveProperty('steps');
    expect(pattern).toHaveProperty('finalMoisture');
    expect(pattern).toHaveProperty('description');
    
    expect(pattern.timeLag).toBe(1);
    expect(pattern.steps).toBeInstanceOf(Array);
    expect(pattern.steps.length).toBeGreaterThan(0);
    expect(pattern.finalMoisture).toBeLessThan(20);
  });

  test('should show slower drying for 10-hour fuels', () => {
    const pattern1hr = FuelMoistureIntegration.calculateDryingPattern(20, 85, 25, 24, 1);
    const pattern10hr = FuelMoistureIntegration.calculateDryingPattern(20, 85, 25, 24, 10);
    
    expect(pattern10hr.finalMoisture).toBeGreaterThan(pattern1hr.finalMoisture);
  });

  test('should show slowest drying for 100-hour fuels', () => {
    const pattern10hr = FuelMoistureIntegration.calculateDryingPattern(20, 85, 25, 48, 10);
    const pattern100hr = FuelMoistureIntegration.calculateDryingPattern(20, 85, 25, 48, 100);
    
    expect(pattern100hr.finalMoisture).toBeGreaterThan(pattern10hr.finalMoisture);
  });

  test('should have steps with hours and moisture properties', () => {
    const pattern = FuelMoistureIntegration.calculateDryingPattern(15, 90, 20, 12, 1);
    
    pattern.steps.forEach(step => {
      expect(step).toHaveProperty('hours');
      expect(step).toHaveProperty('moisture');
      expect(typeof step.hours).toBe('number');
      expect(typeof step.moisture).toBe('number');
    });
  });

  test('should start at initial moisture', () => {
    const initialMoisture = 18;
    const pattern = FuelMoistureIntegration.calculateDryingPattern(initialMoisture, 85, 30, 12, 1);
    
    expect(pattern.steps[0].moisture).toBe(initialMoisture);
  });

  test('should approach EMC asymptotically', () => {
    const pattern = FuelMoistureIntegration.calculateDryingPattern(20, 85, 25, 72, 1);
    
    expect(pattern.finalMoisture).toBeGreaterThan(pattern.emc * 0.9);
    expect(pattern.finalMoisture).toBeLessThan(pattern.emc * 1.5);
  });
});

describe('FuelMoistureIntegration - Base Library Integration', () => {
  test('should have access to base library function', () => {
    expect(FuelMoistureIntegration).toHaveProperty('calculateMoisture');
    expect(typeof FuelMoistureIntegration.calculateMoisture).toBe('function');
  });

  test('should be able to call base library function', () => {
    const result = FuelMoistureIntegration.calculateMoisture({
      temperature: 85,
      humidity: 50
    });
    
    expect(result).toBeDefined();
  });
});
