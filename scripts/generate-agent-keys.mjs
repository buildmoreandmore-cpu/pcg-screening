#!/usr/bin/env node
// One-time generator for PCG Agent API credentials.
// Prints two 32-byte hex secrets. Copy them into .env.local and Vercel.
// Run: node scripts/generate-agent-keys.mjs

import { randomBytes } from 'node:crypto'

const apiKey = randomBytes(32).toString('hex')
const webhookSecret = randomBytes(32).toString('hex')

console.log('')
console.log('=== PCG Agent API credentials ===')
console.log('')
console.log('Add these to .env.local and your Vercel project env:')
console.log('')
console.log(`PCG_AGENT_API_KEY=${apiKey}`)
console.log(`PCG_AGENT_WEBHOOK_SECRET=${webhookSecret}`)
console.log('')
console.log('Also set (point at your consumer endpoint):')
console.log('PCG_AGENT_WEBHOOK_URL=https://your-agent.example.com/webhooks/pcg')
console.log('')
console.log('These are shown ONCE. Store them now — they will not be regenerated.')
console.log('')
