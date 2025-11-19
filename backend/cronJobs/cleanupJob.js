const cron = require("node-cron");
const Location = require("../model/LocationModel");

// Run every hour to clean old activity log entries
cron.schedule("*/5 * * * *", async () => {
  console.log("Running activity log cleanup...");

  // Calculate timestamp for 1 hour ago (CORRECTED)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  console.log(`Cleaning entries older than: ${oneHourAgo.toISOString()}`);

  try {
    const locations = await Location.find();
    let totalCleaned = 0;

    for (const loc of locations) {
      if (!loc.activityLog || loc.activityLog.length === 0) {
        console.log(`Location "${loc.name}": No activity log to clean`);
        continue;
      }

      const originalLength = loc.activityLog.length;

      // Keep only entries from the last hour (no exception for most recent)
      const filteredActivities = loc.activityLog.filter(activity => {
        const activityTime = new Date(activity.timestamp);
        return activityTime > oneHourAgo;
      });

      // Only update if there's a change
      if (filteredActivities.length !== originalLength) {
        // Use updateOne to ONLY modify the activityLog, not replace the entire document
        await Location.updateOne(
          { _id: loc._id },
          { $set: { activityLog: filteredActivities } }
        );
        
        const cleaned = originalLength - filteredActivities.length;
        totalCleaned += cleaned;
        
        console.log(`Location "${loc.name}": Cleaned ${cleaned} old entries, kept ${filteredActivities.length}`);
      } else {
        console.log(`Location "${loc.name}": No cleanup needed (${originalLength} entries all recent)`);
      }
    }

    console.log(`✅ Activity log cleanup complete. Total entries cleaned: ${totalCleaned}`);
  } catch (err) {
    console.error("❌ Activity log cleanup error:", err);
  }
});