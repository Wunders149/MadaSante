import path from 'node:path'
import process from 'node:process'
import dotenv from 'dotenv'

// Load .env from the repo root (works for both `npm run dev` and compiled start).
// The compiled server is run from server/dist/ (via `node server/dist/index.js`),
// so we walk up one level to reach the repo root for the .env file.
dotenv.config({ path: path.resolve('..', '.env') })
dotenv.config()

/** Placeholder secret. Only ever acceptable outside production. */
const DEV_JWT_SECRET = 'madasante-dev-secret-change-me'

const nodeEnv = process.env.NODE_ENV ?? 'development'
const isProduction = nodeEnv === 'production'

const jwtSecret = process.env.JWT_SECRET ?? (isProduction ? '' : DEV_JWT_SECRET)

export const config = {
  port: Number(process.env.PORT ?? 3001),
  jwtSecret,
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/postgres',
  // Supabase requires TLS; disable with PG_SSL=false for local Postgres.
  pgSsl: (process.env.PG_SSL ?? 'true') !== 'false',
  nodeEnv,
  isProduction,
  /**
   * Origins allowed to call the API cross-origin. Empty in production by
   * default, which is correct: the API also serves the built SPA, so real
   * traffic is same-origin and needs no CORS grant at all. Set CORS_ORIGINS
   * (comma separated) only if a separate frontend host is used.
   */
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  // Built SPA (vite outDir) served by the API in production.
  // The vite build output lands in the repo-root dist/ (see root package.json build script),
  // so clientDist defaults to that folder.
  clientDist: process.env.CLIENT_DIST ?? path.resolve('dist'),
}

/**
 * Refuse to boot a production server with a guessable signing key. Previously
 * a missing JWT_SECRET silently fell back to a value committed to the repo,
 * which would let anyone mint an admin token.
 */
export function assertProductionConfig() {
  const problems: string[] = []
  if (!jwtSecret) {
    problems.push('JWT_SECRET is not set.')
  } else if (isProduction && jwtSecret === DEV_JWT_SECRET) {
    problems.push('JWT_SECRET is still the development placeholder.')
  }
  if (isProduction && config.databaseUrl.includes('localhost')) {
    problems.push('DATABASE_URL still points at localhost.')
  }
  if (problems.length === 0) return
  throw new Error(
    `Refusing to start in production with an unsafe configuration:\n  - ${problems.join('\n  - ')}`,
  )
}
