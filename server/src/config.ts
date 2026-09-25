import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export const config = {
  port: Number(process.env.PORT ?? 3001),
  jwtSecret: process.env.JWT_SECRET ?? 'madasante-dev-secret-change-me',
  dbPath: process.env.DB_PATH ?? path.join(dirname, '..', 'data', 'madasante.db'),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  clientDist: path.join(dirname, '..', '..', 'dist'),
}