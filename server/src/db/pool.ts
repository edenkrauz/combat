import pg from 'pg';

const { Pool } = pg;

// Optional PG Pool shared by all repositories: null when DATABASE_URL is not set
export const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;
