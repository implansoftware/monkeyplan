# Activity Logs Retention Policy

## Overview
MonkeyPlan implements a configurable retention policy for activity logs to ensure database efficiency and compliance with data retention requirements.

## Configuration

### Default Retention Period
- **Default**: 90 days
- **Configurable via**: Environment variable `ACTIVITY_LOG_RETENTION_DAYS`

### Setting Custom Retention
Add to your environment variables:
```bash
ACTIVITY_LOG_RETENTION_DAYS=180  # Keep logs for 180 days
```

## Manual Purge

### Admin API Endpoint
**POST** `/api/admin/activity-logs/purge`

**Authentication**: Admin role required

**Request Body** (optional):
```json
{
  "retentionDays": 60
}
```

**Response**:
```json
{
  "deletedCount": 1234,
  "retentionDays": 60
}
```

### Using the Endpoint
```bash
# Purge logs older than default (90 days)
curl -X POST https://your-app.replit.app/api/admin/activity-logs/purge \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

# Purge logs older than 30 days
curl -X POST https://your-app.replit.app/api/admin/activity-logs/purge \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{"retentionDays": 30}'
```

## Scheduled Automatic Purge (Future Enhancement)

To implement automatic scheduled purging, consider:

1. **Using cron jobs** (Linux/Unix):
```bash
# Add to crontab: purge logs weekly at 2am Sunday
0 2 * * 0 curl -X POST http://localhost:5000/api/admin/activity-logs/purge
```

2. **Using Node.js schedulers** (e.g., node-cron):
```typescript
import cron from 'node-cron';

// Run every Sunday at 2am
cron.schedule('0 2 * * 0', async () => {
  await storage.purgeOldActivityLogs(90);
  console.log('Activity logs purged');
});
```

3. **Using external services** (e.g., Replit Cron, GitHub Actions):
- Configure periodic HTTP requests to the purge endpoint
- Ensure proper authentication

## Best Practices

1. **Regular Purging**: Schedule purges weekly or monthly based on log volume
2. **Retention Balance**: Keep logs long enough for audit needs but short enough for performance
3. **Backup Before Purge**: Consider backing up old logs before deletion if required
4. **Monitor Log Volume**: Track activity_logs table size and purge frequency

## Compliance Notes

- Adjust retention period based on regulatory requirements (GDPR, HIPAA, etc.)
- Document retention policy in your compliance documentation
- Ensure purge actions are themselves logged for audit trails
