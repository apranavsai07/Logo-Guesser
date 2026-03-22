import { Redis } from '@upstash/redis'

const url = process.env.UPSTASH_REDIS_REST_URL!
const token = process.env.UPSTASH_REDIS_REST_TOKEN!

if (!url || !token) {
  console.warn("Upstash Redis credentials are not fully set in .env.local")
}

export const redis = new Redis({
  url: url || "",
  token: token || "",
})
