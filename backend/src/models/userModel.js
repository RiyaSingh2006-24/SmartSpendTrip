const run = (executor, text, params) => executor.query(text, params);

export const userModel = {
  async upsert({ name, email, passwordHash = null }, executor) {
    const result = await run(
      executor,
      `
        INSERT INTO users (name, email, password)
        VALUES ($1, $2, $3)
        ON CONFLICT (email)
        DO UPDATE SET
          name = EXCLUDED.name,
          password = COALESCE(EXCLUDED.password, users.password)
        RETURNING id, name, email, created_at
      `,
      [name, email.toLowerCase(), passwordHash],
    );

    return result.rows[0];
  },

  async findByEmail(email, executor) {
    const result = await run(
      executor,
      `SELECT id, name, email, password, created_at FROM users WHERE email = $1 LIMIT 1`,
      [email.toLowerCase()],
    );

    return result.rows[0] || null;
  },
};
