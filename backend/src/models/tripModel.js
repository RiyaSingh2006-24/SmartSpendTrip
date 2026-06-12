const run = (executor, text, params) => executor.query(text, params);

export const tripModel = {
  async create(payload, executor) {
    const result = await run(
      executor,
      `
        INSERT INTO trips (
          user_id,
          destination,
          budget,
          preferences,
          dates
        )
        VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
        RETURNING *
      `,
      [
        payload.userId,
        payload.destination,
        payload.budget,
        JSON.stringify(payload.preferences),
        JSON.stringify(payload.dates),
      ],
    );

    return result.rows[0];
  },

  async findById(tripId, executor) {
    const result = await run(
      executor,
      `SELECT * FROM trips WHERE id = $1 LIMIT 1`,
      [tripId],
    );

    return result.rows[0] || null;
  },

  async findRecentByUser(userId, limit, executor) {
    const result = await run(
      executor,
      `
        SELECT *
        FROM trips
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `,
      [userId, limit],
    );

    return result.rows;
  },
};
