const run = (executor, text, params) => executor.query(text, params);

export const searchHistoryModel = {
  async create(payload, executor) {
    const result = await run(
      executor,
      `
        INSERT INTO search_history (user_id, search_query, timestamp, location_data)
        VALUES ($1, $2, NOW(), $3::jsonb)
        RETURNING *
      `,
      [payload.userId, payload.searchQuery, JSON.stringify(payload.locationData)],
    );

    return result.rows[0];
  },

  async findById(searchId, executor) {
    const result = await run(
      executor,
      `
        SELECT id, user_id, search_query, timestamp, location_data
        FROM search_history
        WHERE id = $1
        LIMIT 1
      `,
      [searchId],
    );

    return result.rows[0] || null;
  },

  async findRecentByUser(userId, limit, executor) {
    const result = await run(
      executor,
      `
        SELECT id, user_id, search_query, timestamp, location_data
        FROM search_history
        WHERE user_id = $1
        ORDER BY timestamp DESC
        LIMIT $2
      `,
      [userId, limit],
    );

    return result.rows;
  },

  async clearByUser(userId, executor) {
    const result = await run(
      executor,
      `
        DELETE FROM search_history
        WHERE user_id = $1
      `,
      [userId],
    );

    return result.rowCount || 0;
  },
};
