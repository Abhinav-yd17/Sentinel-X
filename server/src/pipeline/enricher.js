const geoip = require("geoip-lite");

/**
 * Enricher: Augments a raw event payload with derived context
 * before it enters the analysis stage.
 */
const enrichEvent = (rawEvent) => {
  const enriched = { ...rawEvent };

  // ── Geo enrichment from IP ─────────────────────────────────
  if (rawEvent.ip) {
    const geo = geoip.lookup(rawEvent.ip);
    if (geo) {
      enriched.location = {
        ip: rawEvent.ip,
        country: geo.country,
        countryCode: geo.country,
        region: geo.region,
        city: geo.city,
        lat: geo.ll?.[0],
        lon: geo.ll?.[1],
        timezone: geo.timezone,
      };
    } else {
      enriched.location = { ip: rawEvent.ip, country: "Unknown" };
    }
  }

  // ── Device type from User-Agent ────────────────────────────
  if (rawEvent.userAgent) {
    enriched.deviceType = parseDeviceType(rawEvent.userAgent);
  }

  // ── Category from event type ───────────────────────────────
  enriched.category = resolveCategory(rawEvent.type);

  // ── Timestamp normalization ────────────────────────────────
  enriched.timestamp = rawEvent.timestamp
    ? new Date(rawEvent.timestamp)
    : new Date();

  return enriched;
};

const parseDeviceType = (userAgent = "") => {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone/.test(ua)) return "mobile";
  if (/tablet|ipad/.test(ua)) return "tablet";
  if (/windows|macintosh|linux/.test(ua)) return "desktop";
  return "unknown";
};

const resolveCategory = (type) => {
  const map = {
    login_success: "authentication",
    login_failure: "authentication",
    logout: "authentication",
    password_change: "authentication",
    mfa_failure: "authentication",
    mfa_success: "authentication",
    account_lockout: "authentication",
    device_change: "system",
    location_change: "network",
    permission_change: "authorization",
    data_access: "data",
    data_export: "data",
    api_request: "network",
    suspicious_request: "network",
    custom: "system",
  };
  return map[type] || "system";
};

module.exports = { enrichEvent };
