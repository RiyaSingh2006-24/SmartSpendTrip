import { env, assertEnv } from "../config/env.js";
import { buildDemoChatReply, buildDemoItineraryPlan, discoverDemoLocalities } from "../data/demoTravelData.js";
import { ApiError } from "../utils/errors.js";

const RESPONSES_URL = "https://api.openai.com/v1/responses";

const normalizeOpenAiError = async (response) => {
  const bodyText = await response.text();

  try {
    const payload = JSON.parse(bodyText);
    const apiError = payload?.error;
    const code = apiError?.code;
    const message = apiError?.message;

    if (code === "insufficient_quota") {
      return new ApiError(
        503,
        "OpenAI API quota is exhausted for the configured key or project. Add billing or credits in the OpenAI account, or switch to a funded OPENAI_API_KEY in backend/.env, then restart the backend.",
        { provider: "openai", code, upstreamMessage: message },
      );
    }

    return new ApiError(response.status, message || `OpenAI request failed with status ${response.status}`, {
      provider: "openai",
      code,
      upstreamMessage: message,
    });
  } catch {
    return new ApiError(response.status, `OpenAI request failed: ${bodyText}`);
  }
};

const extractText = (payload) => {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  const parts = [];
  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }

  return parts.join("\n").trim();
};

const callResponsesApi = async (body) => {
  assertEnv("openAiApiKey");

  const response = await fetch(RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openAiApiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await normalizeOpenAiError(response);
  }

  return response.json();
};

const parseStructuredResponse = async ({ schemaName, schema, instructions, input }) => {
  const payload = await callResponsesApi({
    model: env.openAiModel,
    instructions,
    input,
    text: {
      format: {
        type: "json_schema",
        name: schemaName,
        schema,
        strict: true,
      },
    },
  });

  const text = extractText(payload);
  if (!text) {
    throw new ApiError(502, "OpenAI returned an empty structured response");
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ApiError(502, `Failed to parse AI JSON response: ${error.message}`);
  }
};

const candidateSeedSchema = {
  type: "object",
  additionalProperties: false,
  required: ["seeds"],
  properties: {
    seeds: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "rationale"],
        properties: {
          name: { type: "string" },
          rationale: { type: "string" },
        },
      },
    },
  },
};

const itinerarySchema = {
  type: "object",
  additionalProperties: false,
  required: ["recommended_places", "itinerary", "budget_breakdown", "hidden_gems", "tips"],
  properties: {
    recommended_places: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "city",
          "state",
          "score",
          "why_it_fits_budget",
          "estimated_day_spend",
          "top_places",
        ],
        properties: {
          city: { type: "string" },
          state: { type: "string" },
          score: { type: "number" },
          why_it_fits_budget: { type: "string" },
          estimated_day_spend: { type: "number" },
          top_places: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "category", "rating", "estimated_cost", "address"],
              properties: {
                name: { type: "string" },
                category: { type: "string" },
                rating: { type: "number" },
                estimated_cost: { type: "number" },
                address: { type: "string" },
              },
            },
          },
        },
      },
    },
    itinerary: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["day_number", "theme", "city", "estimated_cost", "activities"],
        properties: {
          day_number: { type: "integer" },
          theme: { type: "string" },
          city: { type: "string" },
          estimated_cost: { type: "number" },
          activities: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["time", "name", "type", "description", "estimated_cost", "tips"],
              properties: {
                time: { type: "string" },
                name: { type: "string" },
                type: { type: "string" },
                description: { type: "string" },
                estimated_cost: { type: "number" },
                tips: { type: "string" },
              },
            },
          },
        },
      },
    },
    budget_breakdown: {
      type: "object",
      additionalProperties: false,
      required: [
        "transport",
        "stay",
        "food",
        "activities",
        "contingency",
        "daily_average",
        "budget_category",
      ],
      properties: {
        transport: { type: "number" },
        stay: { type: "number" },
        food: { type: "number" },
        activities: { type: "number" },
        contingency: { type: "number" },
        daily_average: { type: "number" },
        budget_category: { type: "string" },
      },
    },
    hidden_gems: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "city", "why", "estimated_cost"],
        properties: {
          name: { type: "string" },
          city: { type: "string" },
          why: { type: "string" },
          estimated_cost: { type: "number" },
        },
      },
    },
    tips: {
      type: "array",
      items: { type: "string" },
    },
  },
};

export const openaiService = {
  async generateCandidateSeeds({ destinationContext, budgetProfile, preferences, tripType }) {
    if (env.demoMode) {
      return {
        seeds: discoverDemoLocalities(destinationContext).map((seed) => ({
          name: seed.name,
          rationale: "Demo mode generated this locality as a reliable fallback seed.",
        })),
      };
    }

    try {
      return await parseStructuredResponse({
        schemaName: "travel_candidate_seeds",
        schema: candidateSeedSchema,
        instructions: [
          "You are a travel intelligence engine.",
          "Suggest candidate cities or towns inside the requested destination.",
          "Bias toward places that fit the user's budget category and travel style.",
          "Do not suggest destinations outside the requested region or country.",
          "Return 4 to 8 candidate localities for downstream API validation.",
        ].join(" "),
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify({
                  destination: destinationContext.fullName,
                  featureType: destinationContext.featureType,
                  country: destinationContext.country,
                  region: destinationContext.region,
                  budgetCategory: budgetProfile.budgetCategory,
                  dailyPerPerson: budgetProfile.dailyPerPerson,
                  tripType,
                  preferences,
                }),
              },
            ],
          },
        ],
      });
    } catch (error) {
      if (!env.demoMode) {
        throw error;
      }

      return {
        seeds: discoverDemoLocalities(destinationContext).map((seed) => ({
          name: seed.name,
          rationale: "Demo mode generated this locality as a reliable fallback seed.",
        })),
      };
    }
  },

  async generateItinerary({ tripRequest, destinationContext, rankedCities, budgetBreakdown }) {
    if (env.demoMode) {
      return buildDemoItineraryPlan({
        tripRequest,
        destinationContext,
        rankedCities,
        budgetBreakdown,
      });
    }

    try {
      return await parseStructuredResponse({
        schemaName: "travel_itinerary_plan",
        schema: itinerarySchema,
        instructions: [
          "You are SmartSpend Trip AI, a budget-aware travel planner.",
          "Use only the validated city and place data provided in the request payload.",
          "Choose the best cities and places that fit the budget category.",
          "Avoid expensive picks when the budget is low.",
          "Suggest premium experiences only when the budget category is luxury.",
          "For each itinerary day, structure the activities across clear time slots.",
          "Use the activity time field as a visit slot such as Morning, Afternoon, Evening, or Night.",
          "Prefer 4 activities per day covering Morning, Afternoon, Evening, and Night when the provided places support it.",
          "Return a practical day-wise plan and concise travel tips.",
        ].join(" "),
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify({
                  trip_request: tripRequest,
                  destination_context: destinationContext,
                  ranked_cities: rankedCities.map((city) => ({
                    city: city.name,
                    region: city.region,
                    country: city.country,
                    coordinates: { latitude: city.latitude, longitude: city.longitude },
                    score: city.score.overallScore,
                    reasons: city.score.reasons,
                    budget_fit: city.score.budgetFitScore,
                    daily_spend_estimate: city.score.dailySpendEstimate,
                    weather: city.weatherSummary,
                    attractions: city.insights.attractions.slice(0, 5),
                    food_spots: city.insights.foodSpots.slice(0, 4),
                    stays: city.insights.stays.slice(0, 4),
                    hidden_gems: city.insights.hiddenGems.slice(0, 3),
                  })),
                  budget_breakdown: budgetBreakdown,
                }),
              },
            ],
          },
        ],
      });
    } catch (error) {
      if (!env.demoMode) {
        throw error;
      }

      return buildDemoItineraryPlan({
        tripRequest,
        destinationContext,
        rankedCities,
        budgetBreakdown,
      });
    }
  },

  async generateChatResponse({ message, tripContext, recentMessages, activeSearch, recentSearches }) {
    if (env.demoMode) {
      return buildDemoChatReply({ message, tripContext, recentMessages });
    }

    try {
      const payload = await callResponsesApi({
        model: env.openAiModel,
        instructions: [
          "You are the SmartSpend Trip AI assistant.",
          "Answer with awareness of the user's trip budget, destination, and itinerary context.",
          "Use the active search preview and recent search history when it helps the user make a travel decision.",
          "Prefer concrete, cost-aware answers.",
          "Do not invent places or prices outside the provided trip context.",
        ].join(" "),
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify({
                  trip_context: tripContext,
                  active_search: activeSearch,
                  recent_searches: recentSearches,
                  recent_messages: recentMessages,
                  user_question: message,
                }),
              },
            ],
          },
        ],
      });

      const text = extractText(payload);
      if (!text) {
        throw new ApiError(502, "OpenAI returned an empty chat response");
      }

      return text;
    } catch (error) {
      if (!env.demoMode) {
        throw error;
      }

      return buildDemoChatReply({ message, tripContext, recentMessages });
    }
  },
};
