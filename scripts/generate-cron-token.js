#!/usr/bin/env node

/**
 * Generate a secure random token for CRON_SECRET_TOKEN
 * Usage: node scripts/generate-cron-token.js
 */

const crypto = require('node:crypto');

// Generate a 32-byte random token and convert to hex
const token = crypto.randomBytes(32).toString('hex');

console.log('Generated CRON_SECRET_TOKEN:');
console.log(token);
console.log('');
console.log('Add this to your environment variables:');
console.log(`CRON_SECRET_TOKEN=${token}`);
console.log('');
console.log('For Vercel deployment:');
console.log('1. Go to your Vercel dashboard');
console.log('2. Navigate to Settings > Environment Variables');
console.log('3. Add CRON_SECRET_TOKEN with the generated value');
console.log('');
console.log('For GitHub Actions:');
console.log('1. Go to your repository settings');
console.log('2. Navigate to Secrets and variables > Actions');
console.log('3. Add CRON_SECRET_TOKEN to repository secrets');