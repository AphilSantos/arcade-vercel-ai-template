# Daily Usage Reset Automation Setup

This document explains how to set up automated daily reset of conversation counters for free users.

## Environment Variables

Add the following environment variable to your deployment:

```bash
CRON_SECRET_TOKEN=your-secure-random-token-here
```

Generate a secure token using:
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

## Deployment Platform Setup

### Vercel Cron Jobs

1. Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-reset",
      "schedule": "0 0 * * *"
    }
  ]
}
```

2. Add the `CRON_SECRET_TOKEN` environment variable in Vercel dashboard
3. Deploy your application

### GitHub Actions

1. Create `.github/workflows/daily-reset.yml`:

```yaml
name: Daily Usage Reset
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  reset-usage:
    runs-on: ubuntu-latest
    steps:
      - name: Call Daily Reset API
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET_TOKEN }}" \
            -H "Content-Type: application/json" \
            https://your-domain.com/api/cron/daily-reset
```

2. Add `CRON_SECRET_TOKEN` to GitHub repository secrets

### External Cron Services

For services like cron-job.org, EasyCron, or similar:

1. **URL**: `https://your-domain.com/api/cron/daily-reset`
2. **Method**: POST
3. **Headers**: 
   - `Authorization: Bearer YOUR_CRON_SECRET_TOKEN`
   - `Content-Type: application/json`
4. **Schedule**: `0 0 * * *` (daily at midnight UTC)

### Manual Testing

Test the endpoint manually:

```bash
# Health check
curl https://your-domain.com/api/cron/daily-reset

# Trigger reset (replace with your actual token)
curl -X POST \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  https://your-domain.com/api/cron/daily-reset
```

## Monitoring and Logging

The endpoint provides comprehensive logging:

- **Success logs**: Include timestamp, duration, and UTC time
- **Error logs**: Include error details, stack traces, and timestamps
- **Security logs**: Log unauthorized access attempts with IP and user agent
- **Health checks**: GET endpoint for monitoring service availability

## Backup Options

If the primary cron service fails, you can:

1. **Manual trigger**: Call the API endpoint manually
2. **Alternative cron service**: Set up a secondary cron service
3. **Application-level scheduling**: Implement in-app scheduling (not recommended for serverless)

## Security Considerations

- The endpoint requires a secret token to prevent unauthorized access
- All requests are logged for security monitoring
- Failed attempts are logged with IP addresses
- The token should be kept secure and rotated periodically

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check that `CRON_SECRET_TOKEN` is set correctly
2. **500 Server Error**: Check application logs for database connection issues
3. **Timeout**: The operation should complete quickly, but check database performance

### Monitoring

Monitor the following:
- Daily reset completion logs
- Any error logs around midnight UTC
- Database performance during reset operations
- Unauthorized access attempts

### Manual Recovery

If the daily reset fails, you can:
1. Check the logs for the specific error
2. Manually trigger the reset endpoint
3. Verify database connectivity
4. Check that the subscription service is working correctly