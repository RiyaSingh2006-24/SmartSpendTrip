const run = (executor, text, params) => executor.query(text, params);

export const itineraryModel = {
  async createMany(tripId, itineraryDays, executor) {
    const rows = [];

    for (const day of itineraryDays) {
      const result = await run(
        executor,
        `
          INSERT INTO itineraries (trip_id, day_number, activities, cost)
          VALUES ($1, $2, $3::jsonb, $4)
          RETURNING *
        `,
        [tripId, day.day_number, JSON.stringify(day.activities), day.cost],
      );

      rows.push(result.rows[0]);
    }

    return rows;
  },

  async findByTripId(tripId, executor) {
    const result = await run(
      executor,
      `
        SELECT id, trip_id, day_number, activities, cost, created_at
        FROM itineraries
        WHERE trip_id = $1
        ORDER BY day_number ASC
      `,
      [tripId],
    );

    return result.rows;
  },
};
