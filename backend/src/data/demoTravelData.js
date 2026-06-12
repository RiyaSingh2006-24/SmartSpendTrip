const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const average = (values) => {
  const filtered = values.filter((value) => Number.isFinite(value));
  return filtered.length
    ? filtered.reduce((sum, value) => sum + value, 0) / filtered.length
    : 0;
};

const round = (value) => Number(value.toFixed(2));

const demoLocations = [
  {
    name: "Assam",
    fullName: "Assam, India",
    latitude: 26.2006,
    longitude: 92.9376,
    featureType: "state",
    country: "India",
    countryCode: "IN",
    region: "Assam",
    district: "",
    bbox: [89.69, 24.1, 96.02, 28.25],
    aliases: ["assam"],
  },
  {
    name: "Guwahati",
    fullName: "Guwahati, Assam, India",
    latitude: 26.1445,
    longitude: 91.7362,
    featureType: "city",
    country: "India",
    countryCode: "IN",
    region: "Assam",
    district: "Kamrup Metropolitan",
    aliases: ["guwahati"],
    demo: {
      attractions: ["Kamakhya Temple", "Umananda Island", "Assam State Museum", "Brahmaputra Riverfront", "Fancy Bazaar"],
      restaurants: ["Brahmaputra Kitchen", "Assam Spice Table", "Guwahati Street Bites"],
      stays: ["Riverfront Residency", "Assam Comfort Stay", "City Budget Inn"],
      hiddenGems: ["Nehru Park Walk", "Local Silk Market"],
    },
  },
  {
    name: "Jorhat",
    fullName: "Jorhat, Assam, India",
    latitude: 26.7509,
    longitude: 94.2037,
    featureType: "city",
    country: "India",
    countryCode: "IN",
    region: "Assam",
    district: "Jorhat",
    aliases: ["jorhat"],
  },
  {
    name: "Kaziranga",
    fullName: "Kaziranga, Assam, India",
    latitude: 26.5775,
    longitude: 93.1711,
    featureType: "locality",
    country: "India",
    countryCode: "IN",
    region: "Assam",
    district: "Golaghat",
    aliases: ["kaziranga", "kaziranga national park"],
  },
  {
    name: "Majuli",
    fullName: "Majuli, Assam, India",
    latitude: 27.0016,
    longitude: 94.2243,
    featureType: "locality",
    country: "India",
    countryCode: "IN",
    region: "Assam",
    district: "Majuli",
    aliases: ["majuli"],
  },
  {
    name: "Rajasthan",
    fullName: "Rajasthan, India",
    latitude: 27.0238,
    longitude: 74.2179,
    featureType: "state",
    country: "India",
    countryCode: "IN",
    region: "Rajasthan",
    district: "",
    bbox: [69.3, 23.05, 78.28, 30.2],
    aliases: ["rajasthan"],
  },
  {
    name: "Jaipur",
    fullName: "Jaipur, Rajasthan, India",
    latitude: 26.9124,
    longitude: 75.7873,
    featureType: "city",
    country: "India",
    countryCode: "IN",
    region: "Rajasthan",
    district: "Jaipur",
    aliases: ["jaipur", "pink city"],
    demo: {
      attractions: ["Amber Fort", "City Palace", "Hawa Mahal", "Jal Mahal", "Johari Bazaar"],
      restaurants: ["Rawat Misthan Bhandar", "Handi Restaurant", "Pink City Cafe"],
      stays: ["Heritage Haveli Stay", "Pink City Residency", "Jaipur Budget Rooms"],
      hiddenGems: ["Panna Meena Stepwell", "Patrika Gate"],
    },
  },
  {
    name: "Udaipur",
    fullName: "Udaipur, Rajasthan, India",
    latitude: 24.5854,
    longitude: 73.7125,
    featureType: "city",
    country: "India",
    countryCode: "IN",
    region: "Rajasthan",
    district: "Udaipur",
    aliases: ["udaipur"],
    demo: {
      attractions: ["City Palace Udaipur", "Lake Pichola Boat Point", "Sajjangarh Fort", "Saheliyon Ki Bari", "Old City Walk"],
      restaurants: ["Lakeview Dining", "Udaipur Thali House", "Heritage Courtyard Cafe"],
      stays: ["Lakefront Stay", "Royal Courtyard Inn", "Budget Palace Rooms"],
      hiddenGems: ["Ahar Cenotaphs", "Ambrai Sunset Point"],
    },
  },
  {
    name: "Jodhpur",
    fullName: "Jodhpur, Rajasthan, India",
    latitude: 26.2389,
    longitude: 73.0243,
    featureType: "city",
    country: "India",
    countryCode: "IN",
    region: "Rajasthan",
    district: "Jodhpur",
    aliases: ["jodhpur", "blue city"],
  },
  {
    name: "Goa",
    fullName: "Goa, India",
    latitude: 15.2993,
    longitude: 74.124,
    featureType: "state",
    country: "India",
    countryCode: "IN",
    region: "Goa",
    district: "",
    bbox: [73.67, 14.89, 74.34, 15.8],
    aliases: ["goa"],
  },
  {
    name: "Panaji",
    fullName: "Panaji, Goa, India",
    latitude: 15.4909,
    longitude: 73.8278,
    featureType: "city",
    country: "India",
    countryCode: "IN",
    region: "Goa",
    district: "North Goa",
    aliases: ["panaji", "panjim"],
    demo: {
      attractions: ["Fontainhas Walk", "Church Square", "Miramar Beach", "Dona Paula Point", "Mandovi Cruise Point"],
      restaurants: ["Goan Spice House", "Beachfront Bites", "Panaji Seafood Table"],
      stays: ["Coastal Comfort Stay", "Mandovi View Inn", "Goa Budget Suites"],
      hiddenGems: ["Latin Quarter Lanes", "Sunset Jetty Spot"],
    },
  },
  {
    name: "Calangute",
    fullName: "Calangute, Goa, India",
    latitude: 15.5439,
    longitude: 73.7553,
    featureType: "locality",
    country: "India",
    countryCode: "IN",
    region: "Goa",
    district: "North Goa",
    aliases: ["calangute"],
  },
  {
    name: "Kerala",
    fullName: "Kerala, India",
    latitude: 10.8505,
    longitude: 76.2711,
    featureType: "state",
    country: "India",
    countryCode: "IN",
    region: "Kerala",
    district: "",
    bbox: [74.85, 8.18, 77.58, 12.8],
    aliases: ["kerala"],
  },
  {
    name: "Kochi",
    fullName: "Kochi, Kerala, India",
    latitude: 9.9312,
    longitude: 76.2673,
    featureType: "city",
    country: "India",
    countryCode: "IN",
    region: "Kerala",
    district: "Ernakulam",
    aliases: ["kochi", "cochin"],
    demo: {
      attractions: ["Fort Kochi Walk", "Mattancherry Palace", "Marine Drive", "Chinese Fishing Nets", "Jew Town"],
      restaurants: ["Kerala Spice Kitchen", "Harbour Seafood House", "Cochin Cafe"],
      stays: ["Backwater Residency", "Fort Kochi Stay", "Budget Marina Inn"],
      hiddenGems: ["Princess Street", "Sunset Ferry Point"],
    },
  },
  {
    name: "Munnar",
    fullName: "Munnar, Kerala, India",
    latitude: 10.0889,
    longitude: 77.0595,
    featureType: "locality",
    country: "India",
    countryCode: "IN",
    region: "Kerala",
    district: "Idukki",
    aliases: ["munnar"],
  },
  {
    name: "Alappuzha",
    fullName: "Alappuzha, Kerala, India",
    latitude: 9.4981,
    longitude: 76.3388,
    featureType: "city",
    country: "India",
    countryCode: "IN",
    region: "Kerala",
    district: "Alappuzha",
    aliases: ["alleppey", "alappuzha"],
  },
  {
    name: "Jammu and Kashmir",
    fullName: "Jammu and Kashmir, India",
    latitude: 33.7782,
    longitude: 76.5762,
    featureType: "state",
    country: "India",
    countryCode: "IN",
    region: "Jammu and Kashmir",
    district: "",
    bbox: [73.25, 32.17, 80.35, 37.08],
    aliases: ["jammu and kashmir", "jammu kashmir", "jk"],
  },
  {
    name: "Vaishno Devi",
    fullName: "Vaishno Devi, Reasi, Jammu and Kashmir, India",
    latitude: 33.0307,
    longitude: 74.9494,
    featureType: "place",
    country: "India",
    countryCode: "IN",
    region: "Jammu and Kashmir",
    district: "Reasi",
    aliases: ["vaishno devi", "vaishnodevi", "vaishno"],
    demo: {
      attractions: ["Vaishno Devi Bhawan", "Ardhkuwari Cave", "Banganga Ghat", "Charan Paduka", "Katra Market"],
      restaurants: ["Pilgrim Thali Point", "Katra Family Kitchen", "Mountain View Snacks"],
      stays: ["Katra Comfort Rooms", "Pilgrim Residency", "Budget Shrine Stay"],
      hiddenGems: ["Evening Aarti Point", "Local Prasad Market"],
    },
  },
  {
    name: "Katra",
    fullName: "Katra, Reasi, Jammu and Kashmir, India",
    latitude: 32.9917,
    longitude: 74.9319,
    featureType: "city",
    country: "India",
    countryCode: "IN",
    region: "Jammu and Kashmir",
    district: "Reasi",
    aliases: ["katra"],
  },
  {
    name: "Srinagar",
    fullName: "Srinagar, Jammu and Kashmir, India",
    latitude: 34.0837,
    longitude: 74.7973,
    featureType: "city",
    country: "India",
    countryCode: "IN",
    region: "Jammu and Kashmir",
    district: "Srinagar",
    aliases: ["srinagar"],
  },
  {
    name: "Himachal Pradesh",
    fullName: "Himachal Pradesh, India",
    latitude: 31.1048,
    longitude: 77.1734,
    featureType: "state",
    country: "India",
    countryCode: "IN",
    region: "Himachal Pradesh",
    district: "",
    bbox: [75.6, 30.38, 79.04, 33.21],
    aliases: ["himachal", "himachal pradesh"],
  },
  {
    name: "Shimla",
    fullName: "Shimla, Himachal Pradesh, India",
    latitude: 31.1048,
    longitude: 77.1734,
    featureType: "city",
    country: "India",
    countryCode: "IN",
    region: "Himachal Pradesh",
    district: "Shimla",
    aliases: ["shimla"],
  },
  {
    name: "Manali",
    fullName: "Manali, Himachal Pradesh, India",
    latitude: 32.2432,
    longitude: 77.1892,
    featureType: "city",
    country: "India",
    countryCode: "IN",
    region: "Himachal Pradesh",
    district: "Kullu",
    aliases: ["manali"],
  },
  {
    name: "Uttarakhand",
    fullName: "Uttarakhand, India",
    latitude: 30.0668,
    longitude: 79.0193,
    featureType: "state",
    country: "India",
    countryCode: "IN",
    region: "Uttarakhand",
    district: "",
    bbox: [77.58, 28.72, 81.02, 31.45],
    aliases: ["uttarakhand"],
  },
  {
    name: "Rishikesh",
    fullName: "Rishikesh, Uttarakhand, India",
    latitude: 30.0869,
    longitude: 78.2676,
    featureType: "city",
    country: "India",
    countryCode: "IN",
    region: "Uttarakhand",
    district: "Dehradun",
    aliases: ["rishikesh"],
  },
  {
    name: "Delhi",
    fullName: "Delhi, India",
    latitude: 28.6139,
    longitude: 77.209,
    featureType: "city",
    country: "India",
    countryCode: "IN",
    region: "Delhi",
    district: "New Delhi",
    aliases: ["delhi", "new delhi"],
  },
  {
    name: "Mumbai",
    fullName: "Mumbai, Maharashtra, India",
    latitude: 19.076,
    longitude: 72.8777,
    featureType: "city",
    country: "India",
    countryCode: "IN",
    region: "Maharashtra",
    district: "Mumbai",
    aliases: ["mumbai", "bombay"],
  },
  {
    name: "Gujarat",
    fullName: "Gujarat, India",
    latitude: 22.2587,
    longitude: 71.1924,
    featureType: "state",
    country: "India",
    countryCode: "IN",
    region: "Gujarat",
    district: "",
    bbox: [68.1, 20.1, 74.6, 24.7],
    aliases: ["gujarat", "gujrat", "gujarat state"],
  },
  {
    name: "Ahmedabad",
    fullName: "Ahmedabad, Gujarat, India",
    latitude: 23.0225,
    longitude: 72.5714,
    featureType: "city",
    country: "India",
    countryCode: "IN",
    region: "Gujarat",
    district: "Ahmedabad",
    aliases: ["ahmedabad", "amdavad", "ahmedabad city"],
    demo: {
      attractions: ["Sabarmati Ashram", "Adalaj Stepwell", "Kankaria Lake", "Sidi Saiyyed Mosque", "Riverfront Walk"],
      restaurants: ["Gujarati Thali House", "Manek Chowk Bites", "Heritage Courtyard Cafe"],
      stays: ["Ashram Road Residency", "Old City Comfort Inn", "Ahmedabad Budget Suites"],
      hiddenGems: ["Pol Heritage Lanes", "Sunset at Riverfront Garden"],
    },
  },
  {
    name: "Surat",
    fullName: "Surat, Gujarat, India",
    latitude: 21.1702,
    longitude: 72.8311,
    featureType: "city",
    country: "India",
    countryCode: "IN",
    region: "Gujarat",
    district: "Surat",
    aliases: ["surat"],
    demo: {
      attractions: ["Dumas Beach", "Dutch Garden", "Science Centre", "Tapi Riverfront", "Sarthana Nature Park"],
      restaurants: ["Surti Snacks Corner", "Diamond City Diner", "Coastal Spice Table"],
      stays: ["Surat Comfort Stay", "Riverfront Budget Inn", "City Business Hotel"],
      hiddenGems: ["Evening Street Food Walk", "Hidden Textile Market Lanes"],
    },
  },
  {
    name: "Vadodara",
    fullName: "Vadodara, Gujarat, India",
    latitude: 22.3072,
    longitude: 73.1812,
    featureType: "city",
    country: "India",
    countryCode: "IN",
    region: "Gujarat",
    district: "Vadodara",
    aliases: ["vadodara", "baroda"],
    demo: {
      attractions: ["Laxmi Vilas Palace", "Sayaji Garden", "Baroda Museum", "Kirti Mandir", "Old City Walk"],
      restaurants: ["Baroda Spice Kitchen", "Garden City Cafe", "Royal Thali House"],
      stays: ["Vadodara Central Inn", "Palace View Residency", "Budget Garden Stay"],
      hiddenGems: ["Mandvi Gate Evening Walk", "Museum Courtyard Stop"],
    },
  },
  {
    name: "Japan",
    fullName: "Japan",
    latitude: 36.2048,
    longitude: 138.2529,
    featureType: "country",
    country: "Japan",
    countryCode: "JP",
    region: "Japan",
    district: "",
    bbox: [122.85, 24.0, 145.85, 45.6],
    aliases: ["japan", "nippon", "nihon"],
  },
  {
    name: "Tokyo",
    fullName: "Tokyo, Japan",
    latitude: 35.6762,
    longitude: 139.6503,
    featureType: "city",
    country: "Japan",
    countryCode: "JP",
    region: "Tokyo",
    district: "Tokyo",
    aliases: ["tokyo"],
    demo: {
      attractions: ["Senso-ji Temple", "Shibuya Crossing", "Tokyo Skytree", "Meiji Shrine", "Asakusa Walk"],
      restaurants: ["Tokyo Ramen House", "Shibuya Izakaya Table", "Tsukiji Seafood Kitchen"],
      stays: ["Tokyo Metro Hotel", "Asakusa Comfort Stay", "Budget Ginza Rooms"],
      hiddenGems: ["Yanaka Old Streets", "Sunset at Odaiba Boardwalk"],
    },
  },
  {
    name: "Kyoto",
    fullName: "Kyoto, Japan",
    latitude: 35.0116,
    longitude: 135.7681,
    featureType: "city",
    country: "Japan",
    countryCode: "JP",
    region: "Kyoto",
    district: "Kyoto",
    aliases: ["kyoto"],
    demo: {
      attractions: ["Fushimi Inari Shrine", "Kiyomizu-dera", "Arashiyama Bamboo Grove", "Gion Walk", "Nijo Castle"],
      restaurants: ["Kyoto Kaiseki Corner", "Gion Noodle House", "Tea Garden Cafe"],
      stays: ["Kyoto Heritage Inn", "Gion Budget Stay", "Temple View Residency"],
      hiddenGems: ["Philosopher's Path Morning Walk", "Pontocho Backstreets"],
    },
  },
  {
    name: "Osaka",
    fullName: "Osaka, Japan",
    latitude: 34.6937,
    longitude: 135.5023,
    featureType: "city",
    country: "Japan",
    countryCode: "JP",
    region: "Osaka",
    district: "Osaka",
    aliases: ["osaka"],
    demo: {
      attractions: ["Osaka Castle", "Dotonbori", "Umeda Sky Building", "Shinsekai Walk", "Sumiyoshi Taisha"],
      restaurants: ["Osaka Street Eats", "Dotonbori Grill", "Takoyaki Kitchen"],
      stays: ["Namba Central Hotel", "Osaka Comfort Inn", "Budget Umeda Stay"],
      hiddenGems: ["Hozenji Yokocho Lane", "Riverside Night Walk"],
    },
  },
  {
    name: "Nara",
    fullName: "Nara, Japan",
    latitude: 34.6851,
    longitude: 135.8048,
    featureType: "city",
    country: "Japan",
    countryCode: "JP",
    region: "Nara",
    district: "Nara",
    aliases: ["nara"],
    demo: {
      attractions: ["Nara Park", "Todai-ji Temple", "Kasuga Taisha", "Isuien Garden", "Old Town Walk"],
      restaurants: ["Nara Garden Cafe", "Temple Town Kitchen", "Local Udon House"],
      stays: ["Nara Park Residency", "Traditional Guest Stay", "Budget Deer Park Inn"],
      hiddenGems: ["Lantern Path Walk", "Quiet Garden Stop"],
    },
  },
];

const cityLikeLocations = demoLocations.filter((location) =>
  ["city", "locality", "place"].includes(location.featureType),
);

const buildGenericLocation = (query, countryCode = "IN") => ({
  name: String(query || "Demo Destination")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase()),
  fullName: `${String(query || "Demo Destination").trim()}, ${countryCode === "IN" ? "India" : "Demo Region"}`,
  latitude: 23.5937,
  longitude: 78.9629,
  featureType: "place",
  country: countryCode === "IN" ? "India" : "Demo Country",
  countryCode,
  region: countryCode === "IN" ? "India" : "Demo Region",
  district: "",
  bbox: null,
  aliases: [],
});

const scoreLocationMatch = (location, query) => {
  const needle = normalizeText(query);
  if (!needle) {
    return 0;
  }

  const candidates = [
    location.name,
    location.fullName,
    location.region,
    location.district,
    ...(location.aliases || []),
  ].map(normalizeText);

  if (candidates.includes(needle)) {
    return 100;
  }
  if (candidates.some((candidate) => candidate.startsWith(needle))) {
    return 80;
  }
  if (candidates.some((candidate) => candidate.includes(needle))) {
    return 60;
  }

  return 0;
};

const buildMetricSummary = (places) => ({
  count: places.length,
  averageRating: round(average(places.map((place) => place.rating || 0))),
  averagePriceLevel: round(average(places.map((place) => place.priceLevel || 0))),
  popularity: round(average(places.map((place) => place.popularity || 0))),
});

const basePriceByBudget = {
  low: 1,
  mid: 2,
  luxury: 3,
};

const createPlace = ({ name, category, address, latitude, longitude, rating, popularity, priceLevel, description, city, region, country }, index) => ({
  id: `${normalizeText(name)}-${index + 1}`,
  name,
  address,
  city,
  region,
  country,
  latitude: round(latitude + index * 0.005),
  longitude: round(longitude + index * 0.005),
  rating,
  popularity,
  priceLevel,
  categories: [category],
  website: "",
  description,
});

const buildGenericPlaceNames = (location, tripType, preferences) => {
  const wantsCulture = preferences.some((item) => item.toLowerCase().includes("culture"));
  const wantsAdventure = preferences.some((item) => item.toLowerCase().includes("adventure")) || tripType === "Adventure";
  const coreAttractions = [
    `${location.name} Heritage Walk`,
    `${location.name} Scenic Point`,
    `${location.name} Central Market`,
    wantsCulture ? `${location.name} Cultural Museum` : `${location.name} City Viewpoint`,
    wantsAdventure ? `${location.name} Adventure Trail` : `${location.name} Temple Circuit`,
  ];

  return {
    attractions: location.demo?.attractions || coreAttractions,
    restaurants: location.demo?.restaurants || [`${location.name} Spice Kitchen`, `${location.name} Family Diner`, `${location.name} Street Eats`],
    stays: location.demo?.stays || [`${location.name} Budget Inn`, `${location.name} Comfort Residency`, `${location.name} Grand Stay`],
    hiddenGems: location.demo?.hiddenGems || [`${location.name} Sunset Point`, `${location.name} Old Quarter Lanes`],
  };
};

export const searchDemoLocations = (query, options = {}) => {
  const matches = demoLocations
    .filter((location) => !options.countryCode || location.countryCode === options.countryCode)
    .map((location) => ({ location, score: scoreLocationMatch(location, query) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, options.limit || 1)
    .map((entry) => ({
      ...entry.location,
      displayName: entry.location.fullName,
    }));

  return matches.length ? matches : [{ ...buildGenericLocation(query, options.countryCode || "IN"), displayName: buildGenericLocation(query, options.countryCode || "IN").fullName }];
};

export const getDemoLocationByName = (query, options = {}) => {
  const matches = demoLocations
    .filter((location) => !options.countryCode || location.countryCode === options.countryCode)
    .map((location) => ({ location, score: scoreLocationMatch(location, query) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 1)
    .map((entry) => ({
      ...entry.location,
      displayName: entry.location.fullName,
    }));

  return matches[0] || null;
};

export const discoverDemoLocalities = (destinationContext) => {
  const regionKey = normalizeText(destinationContext.region || destinationContext.name);
  const districtKey = normalizeText(destinationContext.district || destinationContext.name);
  const destinationLooksLikeCountry =
    normalizeText(destinationContext.name) &&
    normalizeText(destinationContext.name) === normalizeText(destinationContext.country);

  const matches = cityLikeLocations.filter((location) => {
    const regionMatch = normalizeText(location.region) === regionKey;
    const districtMatch = normalizeText(location.district) === districtKey;
    const countryMatch =
      (destinationContext.featureType === "country" || destinationLooksLikeCountry) &&
      normalizeText(location.country) === normalizeText(destinationContext.country);

    return regionMatch || districtMatch || countryMatch;
  });

  if (matches.length) {
    return matches.slice(0, 6).map((location) => ({ name: location.name, source: "demo" }));
  }

  return [{ name: destinationContext.city || destinationContext.name, source: "demo" }];
};

export const findNearestDemoLocation = (latitude, longitude) => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return cityLikeLocations[0];
  }

  return cityLikeLocations.reduce((closest, location) => {
    const currentDistance = Math.hypot(latitude - location.latitude, longitude - location.longitude);
    const closestDistance = Math.hypot(latitude - closest.latitude, longitude - closest.longitude);
    return currentDistance < closestDistance ? location : closest;
  }, cityLikeLocations[0]);
};

export const buildDemoCityInsights = ({
  city,
  latitude,
  longitude,
  budgetCategory,
  preferences = [],
  tripType = "Leisure",
  countryCode,
}) => {
  const location =
    getDemoLocationByName(city, countryCode ? { countryCode } : {}) ||
    getDemoLocationByName(city) ||
    findNearestDemoLocation(latitude, longitude);
  const placeNames = buildGenericPlaceNames(location, tripType, preferences);
  const basePrice = basePriceByBudget[budgetCategory] || 2;
  const baseAddress = `${location.name}, ${location.region}, ${location.country}`;

  const attractions = placeNames.attractions.slice(0, 5).map((name, index) =>
    createPlace(
      {
        name,
        category: "Attraction",
        address: baseAddress,
        latitude: location.latitude,
        longitude: location.longitude,
        rating: round(8.1 + index * 0.15),
        popularity: 55 + index * 10,
        priceLevel: Math.max(1, basePrice - 1 + (index % 2)),
        description: `Popular sightseeing stop in ${location.name}.`,
        city: location.name,
        region: location.region,
        country: location.country,
      },
      index,
    ),
  );

  const foodSpots = placeNames.restaurants.slice(0, 3).map((name, index) =>
    createPlace(
      {
        name,
        category: "Restaurant",
        address: baseAddress,
        latitude: location.latitude + 0.01,
        longitude: location.longitude + 0.01,
        rating: round(7.9 + index * 0.2),
        popularity: 60 + index * 12,
        priceLevel: Math.min(4, basePrice + index),
        description: `Food stop matched to a ${budgetCategory} budget.`,
        city: location.name,
        region: location.region,
        country: location.country,
      },
      index,
    ),
  );

  const stays = placeNames.stays.slice(0, 3).map((name, index) =>
    createPlace(
      {
        name,
        category: "Hotel",
        address: baseAddress,
        latitude: location.latitude - 0.01,
        longitude: location.longitude - 0.01,
        rating: round(7.8 + index * 0.25),
        popularity: 52 + index * 8,
        priceLevel: Math.min(4, basePrice + index),
        description: `Stay option suited for demo planning in ${location.name}.`,
        city: location.name,
        region: location.region,
        country: location.country,
      },
      index,
    ),
  );

  const hiddenGems = placeNames.hiddenGems.slice(0, 2).map((name, index) =>
    createPlace(
      {
        name,
        category: "Hidden Gem",
        address: baseAddress,
        latitude: location.latitude + 0.02,
        longitude: location.longitude - 0.01,
        rating: round(8.4 + index * 0.1),
        popularity: 32 + index * 6,
        priceLevel: Math.max(1, basePrice),
        description: `Less crowded local favorite in ${location.name}.`,
        city: location.name,
        region: location.region,
        country: location.country,
      },
      index,
    ),
  );

  return {
    city: location.name,
    attractions,
    foodSpots,
    stays,
    hiddenGems,
    attractionMetrics: buildMetricSummary(attractions),
    foodMetrics: buildMetricSummary(foodSpots),
    stayMetrics: buildMetricSummary(stays),
  };
};

export const buildDemoNearbySpots = ({ latitude, longitude, budgetCategory }) => {
  const location = findNearestDemoLocation(latitude, longitude);
  const insights = buildDemoCityInsights({
    city: location.name,
    latitude,
    longitude,
    budgetCategory,
    preferences: [],
    tripType: "Leisure",
  });

  return {
    attractions: insights.attractions.slice(0, 4),
    restaurants: insights.foodSpots.slice(0, 4),
  };
};

export const buildDemoWeatherSummary = ({ latitude, longitude, region, country }) => {
  const nearest = findNearestDemoLocation(latitude, longitude);
  const referenceRegion = region || nearest.region || country || "India";
  const reference = normalizeText(referenceRegion);
  const temperatureC =
    reference.includes("himachal") || reference.includes("uttarakhand") || reference.includes("kashmir")
      ? 18
      : reference.includes("kerala") || reference.includes("goa")
        ? 29
        : 26;
  const condition =
    reference.includes("assam") || reference.includes("kerala")
      ? "Clouds"
      : reference.includes("goa")
        ? "Clear"
        : "Clear";
  const description = condition === "Clouds" ? "partly cloudy skies" : "clear weather";

  return {
    headline: `${description} around ${Math.round(temperatureC)}C`,
    condition,
    description,
    temperatureC,
    forecastPreview: [
      `${condition} ${Math.round(temperatureC)}C`,
      `${condition} ${Math.round(temperatureC + 1)}C`,
      `${condition} ${Math.round(temperatureC - 1)}C`,
    ],
    score: condition === "Clear" ? 88 : 80,
  };
};

const getTripDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 3;
  }

  return Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);
};

const pickTheme = (tripType, preferences, city) => {
  if (tripType === "Adventure") {
    return `${city} Outdoor Day`;
  }
  if (preferences.some((item) => item.toLowerCase().includes("culture"))) {
    return `${city} Culture Trail`;
  }
  if (preferences.some((item) => item.toLowerCase().includes("hidden"))) {
    return `${city} Hidden Gems`;
  }
  return `${city} Highlights`;
};

export const buildDemoItineraryPlan = ({ tripRequest, destinationContext, rankedCities, budgetBreakdown }) => {
  const recommended_places = rankedCities.map((city) => ({
    city: city.name,
    state: city.region || city.country || "",
    score: city.score.overallScore,
    why_it_fits_budget: city.score.reasons.join(" "),
    estimated_day_spend: city.score.dailySpendEstimate,
    top_places: [...city.insights.attractions.slice(0, 3), ...city.insights.foodSpots.slice(0, 2)].map((place) => ({
      name: place.name,
      category: place.categories?.[0] || "Attraction",
      rating: place.rating || 8,
      estimated_cost: 600,
      address: place.address,
    })),
  }));

  const tripDays = getTripDays(tripRequest.startDate, tripRequest.endDate);
  const itinerary = Array.from({ length: tripDays }, (_, index) => {
    const city = rankedCities[index % rankedCities.length];
    const attraction = city.insights.attractions[index % city.insights.attractions.length];
    const afternoonAttraction =
      city.insights.attractions[(index + 1) % city.insights.attractions.length];
    const food = city.insights.foodSpots[index % city.insights.foodSpots.length];
    const hidden =
      city.insights.hiddenGems[index % city.insights.hiddenGems.length] ||
      city.insights.attractions[(index + 2) % city.insights.attractions.length];

    return {
      day_number: index + 1,
      theme: pickTheme(tripRequest.tripType, tripRequest.preferences || [], city.name),
      city: city.name,
      estimated_cost: round(budgetBreakdown.daily_average),
      activities: [
        {
          time: "Morning",
          name: attraction.name,
          type: "sightseeing",
          description: `Start the day with one of ${city.name}'s most recommended attractions.`,
          estimated_cost: 700,
          tips: "Reach early for lighter crowds and better photos.",
        },
        {
          time: "Afternoon",
          name: afternoonAttraction.name,
          type: "sightseeing",
          description: `Afternoon light and open hours make this a strong follow-up stop in ${city.name}.`,
          estimated_cost: 650,
          tips: "Great slot for sightseeing, interiors, and relaxed photo stops.",
        },
        {
          time: "Evening",
          name: food.name,
          type: "food",
          description: `Evening food and street atmosphere make this a practical stop within the ${tripRequest.currency} ${tripRequest.budget} budget.`,
          estimated_cost: 500,
          tips: "Best for local food, markets, and a livelier crowd.",
        },
        {
          time: "Night",
          name: hidden.name,
          type: "exploration",
          description: `Wrap up the day with a lower-crowd experience that works well after sunset.`,
          estimated_cost: 400,
          tips: "Good for a relaxed night walk, views, or low-key local exploration.",
        },
      ],
    };
  });

  const hidden_gems = rankedCities.flatMap((city) =>
    city.insights.hiddenGems.slice(0, 2).map((place) => ({
      name: place.name,
      city: city.name,
      why: `Less crowded and budget-friendly compared with the main tourist circuit in ${city.name}.`,
      estimated_cost: 350,
    })),
  ).slice(0, 6);

  const tips = [
    `Plan around an average of ${tripRequest.currency} ${Math.round(budgetBreakdown.daily_average)} per day.`,
    "Book transport early for the best prices during your travel window.",
    "Keep one flexible evening slot for local markets or weather-dependent activities.",
    `Use ${destinationContext.fullName} as the planning anchor for maps and bookings.`,
  ];

  return {
    recommended_places,
    itinerary,
    budget_breakdown: budgetBreakdown,
    hidden_gems,
    tips,
  };
};

export const buildDemoChatReply = ({ message, tripContext }) => {
  const destination =
    tripContext?.trip?.destination ||
    tripContext?.destination ||
    "your destination";
  const budget =
    tripContext?.trip?.budget ||
    tripContext?.budget ||
    "your budget";
  const firstItineraryStop =
    tripContext?.itinerary?.[0]?.activities?.[0]?.name ||
    "the top-rated attraction";

  return [
    `For ${destination}, start with ${firstItineraryStop}.`,
    `Keep your plan centered around a total budget of ${budget}.`,
    `For the demo, I recommend one morning attraction, one local food stop, and one evening walk each day to stay practical and presentation-friendly.`,
    `If you want, ask me for a cheaper version, a luxury version, or a 3-day summary.`,
  ].join(" ");
};
