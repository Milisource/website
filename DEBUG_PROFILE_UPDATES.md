# Profile Update Debugging Guide

This guide will help you troubleshoot why profile updates made through the admin dashboard are not reflected on the main page.

## What I've Implemented

1. **Comprehensive Logging**: Added detailed logging throughout the profile loading and updating process
2. **Force Dynamic Rendering**: Added `export const dynamic = 'force-dynamic'` and `export const revalidate = 0` to prevent static generation
3. **Cache Headers**: Added no-cache headers for the main page and API routes
4. **Debug Endpoints**: Created endpoints to help diagnose the issue
5. **Test Script**: Created a script to manually test profile updates

## Debugging Steps

### 1. Check the Debug Endpoint

Visit `/api/admin/debug` in your browser to see the current state of the profile files:

```bash
curl http://localhost:3000/api/admin/debug
```

This will show you:
- Which profile files exist
- Their content and parsing status
- File modification times
- Any errors in reading/parsing

### 2. Test Profile Loading

Visit `/api/test-profile` to test if the profile can be loaded correctly:

```bash
curl http://localhost:3000/api/test-profile
```

This endpoint uses the same logic as the main page but without authentication.

### 3. Run the Test Script

Run the test script to manually update the profile and verify it works:

```bash
node scripts/test-profile-update.js
```

This script will:
- Read the current profile
- Write a test profile
- Verify the write was successful
- Parse the written content

### 4. Check Server Logs

Look for these log messages in your server output:

- `=== PROFILE LOADING START ===`
- `=== PAGE RENDER START ===`
- `=== ADMIN API REQUEST ===`
- `=== UPDATING PROFILE ===`

The logs will show you exactly what's happening at each step.

### 5. Common Issues and Solutions

#### Issue: File Not Found
**Symptoms**: Logs show "Profile file not found"
**Solution**: Check if the `/data` directory exists in your container and contains `profile.js`

#### Issue: Parsing Errors
**Symptoms**: Logs show "Could not parse profile data"
**Solution**: The profile file format might be corrupted. Check the file content.

#### Issue: Caching
**Symptoms**: Updates work but page doesn't refresh
**Solution**: The page might be cached. Try hard refresh (Ctrl+F5) or clear browser cache.

#### Issue: Static Generation
**Symptoms**: Page shows old data even after restart
**Solution**: The `dynamic = 'force-dynamic'` export should prevent this.

## Testing Process

1. **Start your container** and note the logs
2. **Visit the debug endpoint** to see current state
3. **Make a change through admin dashboard** and watch the logs
4. **Check the debug endpoint again** to see if the file was updated
5. **Refresh the main page** and check if changes appear
6. **If not working**, run the test script to isolate the issue

## Expected Behavior

When you update the profile through the admin dashboard, you should see:

1. Logs showing the profile data being received
2. Logs showing the file being written successfully
3. Logs showing the file being verified
4. When you refresh the main page, you should see the new data

## If Still Not Working

If the issue persists after following these steps:

1. **Check container logs** for any error messages
2. **Verify file permissions** in the container
3. **Check if the data directory is being persisted** correctly
4. **Try rebuilding the container** to ensure all changes are applied

## Manual Verification

You can also manually verify the profile file inside the container:

```bash
# Get into the container
docker exec -it <container_name> sh

# Check if the file exists
ls -la /app/data/profile.js

# View the file content
cat /app/data/profile.js

# Check file permissions
stat /app/data/profile.js
```

This comprehensive debugging setup should help identify exactly where the issue is occurring in the profile update process. 