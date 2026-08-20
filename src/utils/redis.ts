import { Redis } from '@upstash/redis'

const url = process.env.UPSTASH_REDIS_REST_URL || 'https://placeholder.upstash.io'
const token = process.env.UPSTASH_REDIS_REST_TOKEN || 'placeholder-token'

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn("Upstash Redis credentials are not fully set in .env.local")
}

export const redis = new Redis({
  url,
  token,
})

