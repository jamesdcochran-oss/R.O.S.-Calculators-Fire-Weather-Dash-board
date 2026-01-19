# Fire Weather Dashboard - Fuel Moisture Calculator Integration

This repository integrates the [fuel-moisture-calculator](https://github.com/jamesdcochran-oss/fuel-moisture-calculator) library to provide EMC calculation and fuel moisture drying pattern analysis.

## What Was Added

### 1. New Files Created
- **`fuel-moisture-integration.js`** - Core integration module with EMC and time-lag calculations
- **`.gitignore`** - Excludes node_modules and build artifacts
- **`tests/fuel-moisture-integration.test.js`** - 23 tests for fuel moisture calculations

### 2. Modified Files
- **`fire-behavior.js`** - Added EMC integration with `useEMC` parameter
- **`index.html`** - Complete UI with 3 interactive panels (EMC calculator, drying pattern, fire behavior)
- **`package.json`** - Added fuel-moisture-calculator dependency and Jest testing
- **`tests/fire-behavior.test.js`** - Enhanced with 16 EMC integration tests

## How to Use

### Install Dependencies
```bash
npm install
```

### Run Tests
```bash
npm test
```
Expected output: 39 tests passing ✅

### Open the Dashboard
Simply open `index.html` in your web browser. No build step required.

The dashboard has three panels:
1. **EMC Calculator** - Calculate equilibrium moisture from temperature and humidity
2. **Fuel Moisture Drying Pattern** - Visualize moisture decay over time
3. **Fire Behavior Prediction** - Predict fire spread with optional EMC calculation

## Integration Details

### Using the fuel-moisture-calculator Library

The library is installed from GitHub:
```json
"dependencies": {
  "fuel-moisture-calculator": "github:jamesdcochran-oss/fuel-moisture-calculator"
}
```

### Key Functions in fuel-moisture-integration.js

```javascript
// Calculate EMC from temperature and humidity
const emc = FuelMoistureIntegration.computeEMC(85, 25); // Returns ~5.2%

// Model moisture change over time
const newMoisture = FuelMoistureIntegration.stepMoisture(20, 5, 6, 1);

// Calculate drying pattern
const pattern = FuelMoistureIntegration.calculateDryingPattern(20, 85, 25, 24, 1);
```

### Using EMC in Fire Behavior

```javascript
// Fire behavior with EMC calculation
const result = FireBehavior.predictFireBehavior({
  windSpeed: 10,
  temp: 85,
  rh: 25,
  useEMC: true  // Calculate fuel moisture from temp/RH
});

console.log(result.emc); // 5.2%
console.log(result.rateOfSpread.chainsPerHour); // 3450.24
```

## Branch Information

This integration is on the `copilot/integrate-fuel-moisture-calculator` branch.

To see the changes:
```bash
git log --oneline -3
```

To view the integration code:
```bash
git show HEAD:fuel-moisture-integration.js
git show HEAD:index.html
```

## Testing

Run the full test suite:
```bash
npm test
```

All 39 tests cover:
- EMC calculation for various humidity ranges
- Moisture stepping with different time lags
- Drying pattern generation
- Fire behavior integration with EMC
- Input validation and error handling
