/**
 * Tests for fire-behavior.js integration with fuel moisture calculator
 */

const FireBehavior = require('../fire-behavior.js');
const FuelMoistureIntegration = require('../fuel-moisture-integration.js');

describe('Fire Behavior Tests - Basic Functionality', () => {
  test('should calculate fire rate correctly', () => {
    const result = FireBehavior.predictFireBehavior({
      windSpeed: 10,
      fuelMoisture: 8,
      slope: 0,
      fuelModel: '2',
      temp: 85,
      rh: 30
    });
    
    expect(result).toHaveProperty('canSpread');
    expect(result.canSpread).toBe(true);
    expect(result).toHaveProperty('rateOfSpread');
  });

  test('should prevent fire spread when moisture exceeds extinction', () => {
    const result = FireBehavior.predictFireBehavior({
      windSpeed: 10,
      fuelMoisture: 30,
      slope: 0,
      fuelModel: '2', // Extinction moisture is 15%
      temp: 70,
      rh: 80
    });
    
    expect(result.canSpread).toBe(false);
    expect(result).toHaveProperty('message');
  });
});

describe('Fire Behavior Tests - EMC Integration', () => {
  test('should use manual fuel moisture when useEMC is false', () => {
    const result = FireBehavior.predictFireBehavior({
      windSpeed: 10,
      fuelMoisture: 8,
      slope: 0,
      fuelModel: '2',
      temp: 85,
      rh: 25,
      useEMC: false
    });
    
    expect(result.canSpread).toBe(true);
    expect(result.conditions.fuelMoisture).toBe(8);
    expect(result).not.toHaveProperty('emc');
  });

  test('should calculate and use EMC when useEMC is true', () => {
    const result = FireBehavior.predictFireBehavior({
      windSpeed: 10,
      fuelMoisture: 8,
      slope: 0,
      fuelModel: '2',
      temp: 85,
      rh: 25,
      useEMC: true
    });
    
    expect(result).toHaveProperty('emc');
    expect(result.emc).toBeGreaterThan(0);
    expect(result.emc).toBeLessThan(40);
    expect(result.conditions.fuelMoisture).toBeCloseTo(result.emc, 1);
  });

  test('should calculate EMC correctly for different conditions', () => {
    // Very dry conditions
    const result1 = FireBehavior.predictFireBehavior({
      windSpeed: 10,
      fuelMoisture: 8,
      slope: 0,
      fuelModel: '2',
      temp: 95,
      rh: 15,
      useEMC: true
    });
    
    // Moderate conditions
    const result2 = FireBehavior.predictFireBehavior({
      windSpeed: 10,
      fuelMoisture: 8,
      slope: 0,
      fuelModel: '2',
      temp: 70,
      rh: 50,
      useEMC: true
    });
    
    expect(result1.emc).toBeLessThan(result2.emc);
  });

  test('should affect fire behavior based on EMC calculation', () => {
    // Same base conditions, but different temp/RH affecting EMC
    const dryConditions = FireBehavior.predictFireBehavior({
      windSpeed: 10,
      slope: 0,
      fuelModel: '2',
      temp: 95,
      rh: 15,
      useEMC: true
    });
    
    const moderateConditions = FireBehavior.predictFireBehavior({
      windSpeed: 10,
      slope: 0,
      fuelModel: '2',
      temp: 70,
      rh: 40,
      useEMC: true
    });
    
    expect(dryConditions.canSpread).toBe(true);
    expect(moderateConditions.canSpread).toBe(true);
    expect(dryConditions.rateOfSpread.chainsPerHour).toBeGreaterThan(
      moderateConditions.rateOfSpread.chainsPerHour
    );
  });

  test('should include EMC in result when calculated', () => {
    const result = FireBehavior.predictFireBehavior({
      windSpeed: 5,
      slope: 0,
      fuelModel: '1',
      temp: 85,
      rh: 30,
      useEMC: true
    });
    
    expect(result).toHaveProperty('emc');
    expect(typeof result.emc).toBe('number');
  });
});

describe('Fire Behavior Tests - Fuel Models', () => {
  test('should work with different fuel models', () => {
    const fuelModels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    
    fuelModels.forEach(model => {
      const result = FireBehavior.predictFireBehavior({
        windSpeed: 10,
        fuelMoisture: 8,
        slope: 0,
        fuelModel: model,
        temp: 85,
        rh: 30
      });
      
      expect(result).toHaveProperty('fuelModel');
      expect(result.canSpread).toBe(true);
    });
  });

  test('should return error for invalid fuel model', () => {
    const result = FireBehavior.predictFireBehavior({
      windSpeed: 10,
      fuelMoisture: 8,
      slope: 0,
      fuelModel: '99',
      temp: 85,
      rh: 30
    });
    
    expect(result).toHaveProperty('error');
  });
});

describe('Fire Behavior Tests - Complete Integration', () => {
  test('should produce realistic fire behavior with EMC', () => {
    const result = FireBehavior.predictFireBehavior({
      windSpeed: 15,
      slope: 20,
      fuelModel: '3', // Tall grass
      temp: 90,
      rh: 20,
      useEMC: true
    });
    
    expect(result.canSpread).toBe(true);
    expect(result).toHaveProperty('rateOfSpread');
    expect(result).toHaveProperty('flameLength');
    expect(result).toHaveProperty('firelineIntensity');
    expect(result).toHaveProperty('emc');
    
    // Check that all values are reasonable
    expect(result.rateOfSpread.chainsPerHour).toBeGreaterThan(0);
    expect(result.flameLength.feet).toBeGreaterThan(0);
    expect(result.firelineIntensity).toBeGreaterThan(0);
  });

  test('should maintain consistency between manual and EMC modes', () => {
    const temp = 85;
    const rh = 25;
    const emc = FuelMoistureIntegration.computeEMC(temp, rh);
    
    const manualResult = FireBehavior.predictFireBehavior({
      windSpeed: 10,
      fuelMoisture: emc,
      slope: 0,
      fuelModel: '2',
      temp,
      rh,
      useEMC: false
    });
    
    const emcResult = FireBehavior.predictFireBehavior({
      windSpeed: 10,
      slope: 0,
      fuelModel: '2',
      temp,
      rh,
      useEMC: true
    });
    
    expect(Math.abs(
      manualResult.rateOfSpread.chainsPerHour - emcResult.rateOfSpread.chainsPerHour
    )).toBeLessThan(0.1);
  });

  test('should include all expected output fields', () => {
    const result = FireBehavior.predictFireBehavior({
      windSpeed: 10,
      fuelMoisture: 8,
      slope: 5,
      fuelModel: '2',
      temp: 85,
      rh: 30,
      useEMC: true
    });
    
    expect(result).toHaveProperty('canSpread');
    expect(result).toHaveProperty('fuelModel');
    expect(result).toHaveProperty('rateOfSpread');
    expect(result).toHaveProperty('flameLength');
    expect(result).toHaveProperty('firelineIntensity');
    expect(result).toHaveProperty('conditions');
    expect(result).toHaveProperty('emc');
    
    expect(result.rateOfSpread).toHaveProperty('chainsPerHour');
    expect(result.rateOfSpread).toHaveProperty('metersPerMin');
    expect(result.rateOfSpread).toHaveProperty('feetPerMin');
    
    expect(result.flameLength).toHaveProperty('feet');
    expect(result.flameLength).toHaveProperty('meters');
    
    expect(result.conditions).toHaveProperty('windSpeed');
    expect(result.conditions).toHaveProperty('fuelMoisture');
    expect(result.conditions).toHaveProperty('slope');
    expect(result.conditions).toHaveProperty('temp');
    expect(result.conditions).toHaveProperty('rh');
  });
});
