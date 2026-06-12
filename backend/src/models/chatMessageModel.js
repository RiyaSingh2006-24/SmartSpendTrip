const run = (executor, text, params) => executor.query(text, params);

export const chatMessageModel = {
  async create(payload, executor) {
    const result = await run(
      executor,
      `
        INSERT INTO chat_messages (user_id, message, response, timestamp, trip_id, search_history_id)
        VALUES ($1, $2, $3, NOW(), $4, $5)
        RETURNING *
      `,
      [
        payload.userId,
        payload.message,
        payload.response,
        payload.tripId || null,
        payload.searchHistoryId || null,
      ],
    );

    return result.rows[0];
  },

  async findRecentByUser(userId, limit, executor) {
    const result = await run(
      executor,
      `
        SELECT id, message, response, timestamp, trip_id, search_history_id
        FROM chat_messages
        WHERE user_id = $1
        ORDER BY timestamp DESC
        LIMIT $2
      `,
      [userId, limit],
    );

    return result.rows;
  },
};
