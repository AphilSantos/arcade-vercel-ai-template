# Deployment Guide

## Environment Variables Required for Vercel

The following environment variables must be configured in your Vercel project settings:

### Required Environment Variables

1. **PayPal Configuration**
   - `NEXT_PUBLIC_PAYPAL_CLIENT_ID`: Your PayPal client ID (starts with "Ab3io..." for sandbox)
   - `PAYPAL_API_KEY`: Same as client ID for server-side use
   - `PAYPAL_SECRET`: Your PayPal secret key
   - `PAYPAL_PLAN_ID`: Your PayPal subscription plan ID

2. **Database**
   - `POSTGRES_URL`: Your Neon database connection string

3. **Authentication**
   - `AUTH_SECRET`: Random secret for NextAuth.js

4. **AI Services**
   - `XAI_API_KEY`: X.AI API key
   - `OPENAI_API_KEY`: OpenAI API key
   - `ARCADE_API_KEY`: Arcade API key
   - `ARCADE_BASE_URL`: Arcade API base URL (https://api.arcade.dev/)

5. **Storage & Other Services**
   - `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage token
   - `E2B_API_KEY`: E2B API key
   - `CRON_SECRET_TOKEN`: Secret for cron job authentication
   - `NEXT_PUBLIC_BASE_URL`: Your deployed app URL

## Setting Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with the correct values

## PayPal Configuration Issues

### Common PayPal SDK Loading Issues

1. **Invalid Client ID**: Ensure your PayPal client ID is valid and complete
2. **Sandbox vs Production**: Currently configured for sandbox mode
3. **Domain Restrictions**: Ensure your domain is whitelisted in PayPal settings

### Testing PayPal Integration

1. Use sandbox credentials for testing
2. Ensure the client ID starts with "Ab3io..." for sandbox
3. Check browser console for specific PayPal SDK errors

## Build Verification

Before deploying, ensure:
- `pnpm run build` completes successfully locally
- All TypeScript errors are resolved
- All environment variables are properly set