/**
 * BehaviorAnalyzer: Compares an enriched event against the
 * monitored user's historical baseline to surface anomalies.
 */

const analyzeEvent = (event, monitoredUser) => {
  const anomalies = [];
  const baseline = monitoredUser?.baselineProfile || {};

  // ── 1. Time-of-day anomaly ─────────────────────────────────
  const hour = new Date(event.timestamp).getHours();
  if (
    baseline.typicalLoginHours?.length >= 5 &&
    !baseline.typicalLoginHours.includes(hour) &&
    (event.type === "login_success" || event.type === "login_failure")
  ) {
    anomalies.push("unusual_login_time");
  }

  // ── 2. Geo anomaly ─────────────────────────────────────────
  const country = event.location?.country;
  if (
    country &&
    baseline.typicalCountries?.length >= 1 &&
    !baseline.typicalCountries.includes(country) &&
    country !== "Unknown"
  ) {
    anomalies.push("unusual_country");
  }

  // ── 3. New device ──────────────────────────────────────────
  if (
    event.deviceId &&
    baseline.typicalDevices?.length >= 1 &&
    !baseline.typicalDevices.includes(event.deviceId)
  ) {
    anomalies.push("new_device");
  }

  // ── 4. Impossible travel (needs last event context) ────────
  // Handled in riskScorer if lastEvent is passed in

  return { anomalies };
};

/**
 * Updates the baseline profile with data from a new event.
 * Called after an event has been safely processed.
 */
const updateBaseline = (baseline, event) => {
  const updated = { ...baseline };
  const hour = new Date(event.timestamp).getHours();

  // Update typical hours (keep unique, max 24)
  if (!updated.typicalLoginHours) updated.typicalLoginHours = [];
  if (!updated.typicalLoginHours.includes(hour)) {
    updated.typicalLoginHours = [...updated.typicalLoginHours, hour].slice(-24);
  }

  // Update countries
  if (!updated.typicalCountries) updated.typicalCountries = [];
  const country = event.location?.country;
  if (country && country !== "Unknown" && !updated.typicalCountries.includes(country)) {
    updated.typicalCountries = [...updated.typicalCountries, country].slice(-10);
  }

  // Update devices
  if (!updated.typicalDevices) updated.typicalDevices = [];
  if (event.deviceId && !updated.typicalDevices.includes(event.deviceId)) {
    updated.typicalDevices = [...updated.typicalDevices, event.deviceId].slice(-10);
  }

  updated.totalEventsProcessed = (updated.totalEventsProcessed || 0) + 1;
  updated.lastUpdated = new Date();

  return updated;
};

module.exports = { analyzeEvent, updateBaseline };
