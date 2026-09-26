import path from 'node:path'
import process from 'node:process'
import dotenv from 'dotenv'

// Load .env from the repo root (works for both `npm run dev` and compiled start).
// The compiled server is run from server/dist/ (via `node server/dist/index.js`),
// so we walk up one level to reach the repo root for the .env file.
dotenv.config({ path: path.resolve('..', '.env') })
dotenv.config()
export const config = {
  port: Number(process.env.PORT ?? 3001),
  jwtSecret: process.env.JWT_SECRET ?? 'madasante-dev-secret-change-me',
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/postgres',
  // Supabase requires TLS; disable with PG_SSL=false for local Postgres.
  pgSsl: (process.env.PG_SSL ?? 'true') !== 'false',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  // Built SPA (vite outDir) served by the API in production.
  // The vite build output lands in the repo-root dist/ (see root package.json build script),
  // so clientDist defaults to that folder.
  clientDist: process.env.CLIENT_DIST ?? path.resolve('dist'),
}