import { z } from "zod";
import { locationService } from "../services/locationService.js";

const querySchema = z.object({
  city: z.string().min(2),
  countryCode: z.string().max(3).optional(),
});

export const searchLocation = async (req, res) => {
  const query = querySchema.parse(req.query);
  const [location] = await locationService.searchLocation(query.city, {
    limit: 1,
    countryCode: query.countryCode,
  });

  res.json({
    success: true,
    location: {
      name: location.name,
      lat: location.latitude,
      lon: location.longitude,
      display_name: location.displayName,
      country: location.country,
      region: location.region,
    },
  });
};
