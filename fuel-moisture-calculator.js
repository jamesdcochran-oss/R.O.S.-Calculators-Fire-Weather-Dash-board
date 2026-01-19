/**
 * Fuel Moisture Calculator
 * Computes fuel moisture content based on temperature and relative humidity
 * Browser-compatible version for Fire Weather Dashboard
 */

(function(global) {
    'use strict';

    /**
     * Computes moisture content based on temperature and relative humidity.
     * @param {Object} input - The input object containing temperature and humidity.
     * @param {number} input.temperature - The temperature in Fahrenheit.
     * @param {number} input.humidity - The relative humidity in percentage.
     * @returns {number} - The calculated moisture content.
     * @throws {Error} - If input is invalid.
     */
    function calculateMoisture(input) {
        if (!input || typeof input.temperature !== 'number' || typeof input.humidity !== 'number') {
            throw new Error('Invalid input for calculateMoisture');
        }
        return parseFloat((input.humidity - input.temperature * 0.1).toFixed(2));
    }

    /**
     * Compute Equilibrium Moisture Content (EMC) using simplified equations
     * Based on temperature and relative humidity
     * @param {number} temperature - Temperature in Fahrenheit
     * @param {number} humidity - Relative humidity in percentage (0-100)
     * @returns {number} - EMC in percentage
     */
    function computeEMC(temperature, humidity) {
        if (typeof temperature !== 'number' || typeof humidity !== 'number') {
            throw new Error('Invalid input: temperature and humidity must be numbers');
        }
        
        if (humidity < 0 || humidity > 100) {
            throw new Error('Humidity must be between 0 and 100');
        }

        // Simplified EMC calculation based on standard moisture equations
        // EMC varies with temperature and relative humidity
        let emc;
        
        if (humidity < 10) {
            // Very low humidity - use simplified formula
            emc = 0.03 + 0.2626 * humidity + 0.00104 * temperature;
        } else if (humidity <= 50) {
            // Low to moderate humidity
            emc = 2.22 + 0.160 * humidity + 0.0140 * temperature;
        } else {
            // High humidity - non-linear relationship
            emc = 21.06 - 0.4944 * humidity + 0.005565 * Math.pow(humidity, 2) + 0.00063 * temperature;
        }
        
        // Ensure EMC is within realistic bounds (1-35%)
        emc = Math.max(1, Math.min(35, emc));
        
        return parseFloat(emc.toFixed(2));
    }

    /**
     * Calculate fuel moisture after time lag using exponential approach
     * Models how fuel moisture approaches EMC over time
     * @param {number} currentMoisture - Current fuel moisture percentage
     * @param {number} emc - Equilibrium moisture content percentage
     * @param {number} hours - Time elapsed in hours
     * @param {number} timelag - Fuel timelag class (1, 10, 100, 1000 hours)
     * @returns {number} - Updated fuel moisture percentage
     */
    function stepMoisture(currentMoisture, emc, hours, timelag) {
        if (typeof currentMoisture !== 'number' || typeof emc !== 'number' || 
            typeof hours !== 'number' || typeof timelag !== 'number') {
            throw new Error('Invalid input: all parameters must be numbers');
        }

        if (timelag <= 0) {
            throw new Error('Timelag must be greater than 0');
        }

        // Time constant for exponential response
        // k is related to the timelag class (time to reach ~63% of EMC)
        const k = 1 / timelag;
        
        // Exponential approach to EMC
        // M(t) = EMC + (M0 - EMC) * e^(-kt)
        const difference = currentMoisture - emc;
        const newMoisture = emc + difference * Math.exp(-k * hours);
        
        return parseFloat(newMoisture.toFixed(2));
    }

    /**
     * Calculate all fuel moisture classes for given conditions
     * @param {Object} params - Input parameters
     * @param {number} params.temperature - Temperature in Fahrenheit
     * @param {number} params.humidity - Relative humidity in percentage
     * @param {number} params.hours - Time period in hours (default: 12)
     * @param {Object} params.initial - Initial moisture values (optional)
     * @returns {Object} - Fuel moisture values for all timelag classes
     */
    function calculateAllFuelMoistures(params) {
        const {
            temperature,
            humidity,
            hours = 12,
            initial = { hr1: 10, hr10: 12, hr100: 14, hr1000: 16 }
        } = params;

        const emc = computeEMC(temperature, humidity);

        return {
            emc: emc,
            oneHour: stepMoisture(initial.hr1, emc, hours, 1),
            tenHour: stepMoisture(initial.hr10, emc, hours, 10),
            hundredHour: stepMoisture(initial.hr100, emc, hours, 100),
            thousandHour: stepMoisture(initial.hr1000, emc, hours, 1000),
            conditions: {
                temperature,
                humidity,
                hours
            }
        };
    }

    // Export for browser with unique namespace
    const FuelMoistureCalc = {
        calculateMoisture,
        computeEMC,
        stepMoisture,
        calculateAllFuelMoistures
    };

    // Make available globally in browser
    if (typeof window !== 'undefined') {
        window.FuelMoistureCalc = FuelMoistureCalc;
    }

    // Also support CommonJS for Node.js testing
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = FuelMoistureCalc;
    }

})(typeof window !== 'undefined' ? window : global);
