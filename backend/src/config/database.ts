import { Pool } from 'pg';

const env = process.env;
const connectionString = env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

if (!new URL(connectionString).password && !env.PGPASSWORD) {
  throw new Error(
    'PostgreSQL requires a password. Set PGPASSWORD or include it in DATABASE_URL.',
  );
}

export const pool = new Pool({
  connectionString,
  ...(env.PGPASSWORD ? { password: env.PGPASSWORD } : {}),
});
