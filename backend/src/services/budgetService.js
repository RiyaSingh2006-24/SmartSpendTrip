const CATEGORY_WEIGHTS = {
  low: { transport: 0.2, stay: 0.35, food: 0.2, activities: 0.18, contingency: 0.07 },
  mid: { transport: 0.18, stay: 0.38, food: 0.19, activities: 0.19, contingency: 0.06 },
  luxury: { transport: 0.15, stay: 0.44, food: 0.16, activities: 0.2, contingency: 0.05 },
};

const CATEGORY_TARGET_PRICE = { low: 1.6, mid: 2.5, luxury: 3.5 };
const PRICE_MULTIPLIER = { 1: 0.72, 2: 0.95, 3: 1.2, 4: 1.65 };

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const roundMoney = (value) => Number(value.toFixed(2));

const average = (values) => {
  const filtered = values.filter((value) => Number.isFinite(value));
  return filtered.length
    ? filtered.reduce((sum, value) => sum + value, 0) / filtered.length
    : 0;
};

const getCurrencyThresholds = (currency) => {
  switch ((currency || "USD").toUpperCase()) {
    case "INR":
      return { low: 3500, mid: 9000 };
    case "EUR":
      return { low: 65, mid: 160 };
    case "GBP":
      return { low: 60, mid: 145 };
    default:
      return { low: 70, mid: 180 };
  }
};

export const budgetService = {
  getTripDays(startDate, endDate) {
    if (!startDate || !endDate) {
      return 3;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 3;
    }

    return Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);
  },

  buildBudgetProfile({ budget, currency, travelers, startDate, endDate }) {
    const tripDays = this.getTripDays(startDate, endDate);
    const safeTravelers = Math.max(1, Number(travelers) || 1);
    const totalBudget = Number(budget) || 0;
    const dailyPerPerson = totalBudget / tripDays / safeTravelers;
    const thresholds = getCurrencyThresholds(currency);

    let budgetCategory = "mid";
    if (dailyPerPerson <= thresholds.low) {
      budgetCategory = "low";
    } else if (dailyPerPerson >= thresholds.mid) {
      budgetCategory = "luxury";
    }

    return {
      totalBudget,
      currency: (currency || "USD").toUpperCase(),
      travelers: safeTravelers,
      tripDays,
      dailyPerPerson: roundMoney(dailyPerPerson),
      budgetCategory,
    };
  },

  buildBudgetBreakdown(profile) {
    const weights = CATEGORY_WEIGHTS[profile.budgetCategory];
    const breakdown = Object.fromEntries(
      Object.entries(weights).map(([category, weight]) => [
        category,
        roundMoney(profile.totalBudget * weight),
      ]),
    );

    return {
      ...breakdown,
      total: roundMoney(profile.totalBudget),
      daily_average: roundMoney(profile.totalBudget / profile.tripDays),
      budget_category: profile.budgetCategory,
      currency: profile.currency,
    };
  },

  scoreCity({ budgetProfile, cityInsights, weatherSummary, destinationName }) {
    const priceLevel =
      average([
        cityInsights.attractionMetrics.averagePriceLevel,
        cityInsights.foodMetrics.averagePriceLevel,
        cityInsights.stayMetrics.averagePriceLevel,
      ]) || 2.2;

    const ratingScore =
      average([
        cityInsights.attractionMetrics.averageRating,
        cityInsights.foodMetrics.averageRating,
        cityInsights.stayMetrics.averageRating,
      ]) * 10;

    const popularityBase = average([
      cityInsights.attractionMetrics.popularity,
      cityInsights.foodMetrics.popularity,
      cityInsights.stayMetrics.popularity,
    ]);
    const popularityScore = clamp(Math.log10((popularityBase || 10) + 1) * 34, 10, 100);
    const targetPrice = CATEGORY_TARGET_PRICE[budgetProfile.budgetCategory];
    const budgetFitScore = clamp(100 - Math.abs(priceLevel - targetPrice) * 32, 5, 100);
    const weatherScore = weatherSummary?.score || 60;
    const hiddenGemBonus = clamp(cityInsights.hiddenGems.length * 6, 0, 18);

    const overallScore = roundMoney(
      budgetFitScore * 0.38 +
        ratingScore * 0.24 +
        popularityScore * 0.18 +
        weatherScore * 0.2 +
        hiddenGemBonus,
    );

    const dailySpendEstimate = roundMoney(
      budgetProfile.dailyPerPerson * (PRICE_MULTIPLIER[Math.round(priceLevel)] || 1),
    );

    const reasons = [];
    if (budgetFitScore >= 78) {
      reasons.push(`Strong budget match for a ${budgetProfile.budgetCategory} trip.`);
    } else if (budgetProfile.budgetCategory === "low" && priceLevel > 2.8) {
      reasons.push("This area is pricier than the target budget, so it ranks lower.");
    } else if (budgetProfile.budgetCategory === "luxury" && priceLevel < 2.2) {
      reasons.push("Excellent value, though premium inventory is more limited.");
    } else {
      reasons.push("Balanced fit across affordability and experience quality.");
    }

    if (weatherSummary?.headline) {
      reasons.push(weatherSummary.headline);
    }

    if (cityInsights.hiddenGems.length >= 2) {
      reasons.push("Includes several highly rated lower-crowd hidden gems.");
    }

    return {
      overallScore,
      budgetFitScore: roundMoney(budgetFitScore),
      ratingScore: roundMoney(ratingScore),
      popularityScore: roundMoney(popularityScore),
      weatherScore: roundMoney(weatherScore),
      priceLevel: roundMoney(priceLevel),
      dailySpendEstimate,
      destinationName,
      reasons,
    };
  },
};
