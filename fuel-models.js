// Standard 13 Fuel Models (Anderson, 1982)
// Used with Rothermel fire spread model

const FUEL_MODELS = {
  1: {
    name: "Short Grass (1 foot)",
    description: "Fine, dry climate grass. Fire spread is governed by fine herbaceous fuels that have cured or are nearly cured. Fires are surface fires that move rapidly through the cured grass and associated material.",
    fuelLoad: { dead1h: 0.74, dead10h: 0, dead100h: 0, liveHerb: 0, liveStem: 0 },
    savRatio: 3500,
    fuelDepth: 1.0,
    moistureExtinction: 12,
    typical: "Annual grasslands, wheat stubble, cheatgrass"
  },
  2: {
    name: "Timber (grass and understory)",
    description: "Open timber with grass understory. Fire spread is primarily through the fine herbaceous fuels, either curing or dead. These are surface fires where the herbaceous material, in addition to litter and dead-down stemwood from the open timber overstory, contribute to the fire intensity.",
    fuelLoad: { dead1h: 2.0, dead10h: 1.0, dead100h: 0.5, liveHerb: 0.5, liveStem: 0 },
    savRatio: 3000,
    fuelDepth: 1.0,
    moistureExtinction: 15,
    typical: "Open pine with grass, oak-hickory with grass"
  },
  3: {
    name: "Tall Grass (2.5 feet)",
    description: "Tallgrass prairie. Fire spread is governed by fine herbaceous fuels. Stands are tall, averaging about 3 feet, but considerable variation occurs. Fires are the most intense of the grass group and display high rates of spread under the influence of wind.",
    fuelLoad: { dead1h: 3.01, dead10h: 0, dead100h: 0, liveHerb: 0, liveStem: 0 },
    savRatio: 1500,
    fuelDepth: 2.5,
    moistureExtinction: 25,
    typical: "Tall prairie grass, sawgrass"
  },
  4: {
    name: "Chaparral (6 feet)",
    description: "Mature, dense chaparral. Fire spread is governed by fine fuels in the foliage and dead woody material. Stands of mature shrubs, 6 or more feet tall, form a continuous canopy. Fires are intense and spread rapidly both before and after leaf fall.",
    fuelLoad: { dead1h: 5.01, dead10h: 4.01, dead100h: 2.0, liveHerb: 0, liveStem: 5.01 },
    savRatio: 2000,
    fuelDepth: 6.0,
    moistureExtinction: 20,
    typical: "California chaparral, scrub oak, mountain mahogany"
  },
  5: {
    name: "Brush (2 feet)",
    description: "Young, green shrub stage. Fire spread is governed by flammable foliage of young green shrubs. Stands are young, about 2 feet high, with no dead wood. Fires are generally not very intense because of the low fuel loading and high moisture content.",
    fuelLoad: { dead1h: 1.0, dead10h: 0.5, dead100h: 0, liveHerb: 0, liveStem: 2.0 },
    savRatio: 2000,
    fuelDepth: 2.0,
    moistureExtinction: 20,
    typical: "Young chaparral, laurel, vine maple"
  },
  6: {
    name: "Dormant Brush",
    description: "Intermediate shrub stage, winter (hardwoods). Fire spread is governed by fine dead fuels in the foliage and litter. Stands of mature shrubs, about 2 to 6 feet high, are typical. Fires burn through the shrub layer with moderate intensity, making them difficult to control.",
    fuelLoad: { dead1h: 1.5, dead10h: 2.5, dead100h: 2.0, liveHerb: 0, liveStem: 0 },
    savRatio: 1750,
    fuelDepth: 2.5,
    moistureExtinction: 25,
    typical: "Chamise (winter), oakbrush (winter)"
  },
  7: {
    name: "Southern Rough",
    description: "Palmetto-gallberry understory. Fire spread is governed by fine fuels in the palmetto and live and dead material in the shrubs. Fires burn through the shrub layer with high intensity and spread is very rapid. Stands are thick and about 2 to 6 feet high.",
    fuelLoad: { dead1h: 1.13, dead10h: 1.87, dead100h: 1.5, liveHerb: 0, liveStem: 0.37 },
    savRatio: 1550,
    fuelDepth: 2.5,
    moistureExtinction: 40,
    typical: "Palmetto-gallberry, sawpalmetto"
  },
  8: {
    name: "Closed Timber Litter",
    description: "Closed canopy timber with short-needle conifers. Fire spread is governed by litter and dead-down woody material. Litter layer is compact and mainly short conifer needles with little undergrowth. Fires burn through the surface fuels with low intensity and slow spread.",
    fuelLoad: { dead1h: 1.5, dead10h: 1.0, dead100h: 2.5, liveHerb: 0, liveStem: 0 },
    savRatio: 2000,
    fuelDepth: 0.2,
    moistureExtinction: 30,
    typical: "Short-needle pine litter, Douglas-fir litter"
  },
  9: {
    name: "Hardwood Litter",
    description: "Long-needle pine or hardwood litter. Fire spread is governed by litter layer. Litter is mainly long-needle pine (or hardwood in the fall) and concentrates a greater fuel load than Model 8. Spread rate is greater than Model 8 but is still a slow-spreading surface fire.",
    fuelLoad: { dead1h: 2.92, dead10h: 0.41, dead100h: 0.15, liveHerb: 0, liveStem: 0 },
    savRatio: 2500,
    fuelDepth: 0.2,
    moistureExtinction: 25,
    typical: "Long-needle pine litter, hardwood litter"
  },
  10: {
    name: "Timber (litter and understory)",
    description: "Closed canopy timber with dead-down fuels. Fire spread is governed by surface litter, herbaceous material, and dead-down woody material. This is a heavier fuel loading than Model 8 or 9. Spread rate and fire intensity are greater.",
    fuelLoad: { dead1h: 3.01, dead10h: 2.0, dead100h: 5.01, liveHerb: 0, liveStem: 2.0 },
    savRatio: 2000,
    fuelDepth: 1.0,
    moistureExtinction: 25,
    typical: "Ponderosa pine with understory, lodgepole pine"
  },
  11: {
    name: "Light Logging Slash",
    description: "Light slash. Fire spread is governed by fine fuels in the slash. Slash is freshly cut and not compacted. Large amounts of needles still attached to the branches. Fires spread rapidly through the slash and generate high intensities.",
    fuelLoad: { dead1h: 1.5, dead10h: 4.51, dead100h: 5.51, liveHerb: 0, liveStem: 0 },
    savRatio: 1500,
    fuelDepth: 1.0,
    moistureExtinction: 15,
    typical: "Light partial cuts, thinning slash"
  },
  12: {
    name: "Medium Logging Slash",
    description: "Medium slash. Fire spread is governed by fine fuels and dead woody material in the slash. Slash is freshly cut and not compacted, loading is moderate. Fires are more intense than Model 11 and spread rapidly.",
    fuelLoad: { dead1h: 4.01, dead10h: 14.03, dead100h: 16.53, liveHerb: 0, liveStem: 0 },
    savRatio: 1500,
    fuelDepth: 2.3,
    moistureExtinction: 20,
    typical: "Moderate clearcuts, partial cuts"
  },
  13: {
    name: "Heavy Logging Slash",
    description: "Heavy slash. Fire spread is governed by large amounts of slash. Slash is freshly cut, contains many dead-down branches, and is not compacted. Fires spread rapidly and are very intense, making them extremely difficult to control.",
    fuelLoad: { dead1h: 7.01, dead10h: 23.04, dead100h: 28.05, liveHerb: 0, liveStem: 0 },
    savRatio: 1500,
    fuelDepth: 3.0,
    moistureExtinction: 25,
    typical: "Heavy clearcuts, whole-tree harvest slash"
  }
};

// Fuel Moisture Calculator
class FuelMoistureCalculator {
  
  // Calculate 1-hour fuel moisture from temperature and relative humidity
  static calculateOneHourMoisture(tempF, relHumidity) {
    // Based on NFDRS moisture equations
    // 1-hour fuels respond quickly to atmospheric conditions
    
    if (relHumidity <= 10) {
      return 0.03 + 0.2626 * relHumidity - 0.00104 * tempF;
    } else if (relHumidity <= 50) {
      return 2.22 - 0.160 * relHumidity + 0.0140 * tempF;
    } else {
      return 21.06 - 0.4944 * relHumidity + 0.005565 * Math.pow(relHumidity, 2) - 0.00063 * relHumidity * tempF;
    }
  }
  
  // Calculate 10-hour fuel moisture
  static calculateTenHourMoisture(tempF, relHumidity, prevMoisture = null) {
    // 10-hour fuels respond more slowly than 1-hour
    const oneHourMoisture = this.calculateOneHourMoisture(tempF, relHumidity);
    
    // If we have previous moisture, use lag calculation
    if (prevMoisture !== null) {
      // 10-hour lag coefficient (approximately 0.9 for one hour time step)
      const lagCoeff = 0.9;
      return lagCoeff * prevMoisture + (1 - lagCoeff) * oneHourMoisture;
    }
    
    // Otherwise estimate based on 1-hour with adjustment factor
    return oneHourMoisture * 1.2;
  }
  
  // Calculate 100-hour fuel moisture
  static calculateHundredHourMoisture(tempF, relHumidity, prevMoisture = null) {
    const tenHourMoisture = this.calculateTenHourMoisture(tempF, relHumidity, prevMoisture);
    
    // 100-hour fuels have even slower response
    if (prevMoisture !== null) {
      const lagCoeff = 0.95;
      return lagCoeff * prevMoisture + (1 - lagCoeff) * tenHourMoisture;
    }
    
    return tenHourMoisture * 1.4;
  }
  
  // Calculate live fuel moisture based on seasonal/greenness factors
  static calculateLiveMoisture(month, tempF, rainfall30day = 0) {
    // Simplified live fuel moisture model
    // Live fuels vary seasonally and with precipitation
    
    // Base moisture by month (Northern Hemisphere)
    const monthlyBase = {
      1: 80,  2: 85,  3: 100, 4: 120,  // Winter -> Spring
      5: 130, 6: 120, 7: 100, 8: 90,   // Spring -> Summer
      9: 80,  10: 75, 11: 70, 12: 75   // Fall -> Winter
    };
    
    let baseMoisture = monthlyBase[month] || 100;
    
    // Adjust for recent rainfall
    const rainfallFactor = Math.min(30, rainfall30day) * 0.5;
    baseMoisture += rainfallFactor;
    
    // Temperature stress factor (higher temps reduce moisture)
    if (tempF > 85) {
      baseMoisture -= (tempF - 85) * 0.3;
    }
    
    return Math.max(60, Math.min(200, baseMoisture));
  }
  
  // Estimate fuel moisture from weather observations
  static estimateFromWeather(options) {
    const {
      tempF,
      relHumidity,
      month = new Date().getMonth() + 1,
      rainfall30day = 0,
      prev10hr = null,
      prev100hr = null
    } = options;
    
    return {
      oneHour: Math.max(1, Math.round(this.calculateOneHourMoisture(tempF, relHumidity))),
      tenHour: Math.max(1, Math.round(this.calculateTenHourMoisture(tempF, relHumidity, prev10hr))),
      hundredHour: Math.max(1, Math.round(this.calculateHundredHourMoisture(tempF, relHumidity, prev100hr))),
      liveHerbaceous: Math.max(30, Math.round(this.calculateLiveMoisture(month, tempF, rainfall30day))),
      liveStem: Math.max(60, Math.round(this.calculateLiveMoisture(month, tempF, rainfall30day) * 1.2))
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FUEL_MODELS, FuelMoistureCalculator };
}
