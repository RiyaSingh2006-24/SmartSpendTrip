const run = (executor, text, params) => executor.query(text, params);

export const recommendationModel = {
  async create(payload, executor) {
    const result = await run(
      executor,
      `
        INSERT INTO recommendations (trip_id, state, suggested_places, budget_category)
        VALUES ($1, $2, $3::jsonb, $4)
        RETURNING *
      `,
      [
        payload.tripId,
        payload.state,
        JSON.stringify(payload.suggestedPlaces),
        payload.budgetCategory,
      ],
    );

    return result.rows[0];
  },

  async findByTripId(tripId, executor) {
    const result = await run(
      executor,
      `
        SELECT id, trip_id, state, suggested_places, budget_category, created_at
        FROM recommendations
        WHERE trip_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [tripId],
    );

    return result.rows[0] || null;
  },
};
