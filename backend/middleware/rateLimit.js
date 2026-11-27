function rateLimit({ limit = 8, windowMs = 15 * 60 * 1000, failureStatus } = {}) {
  const buckets = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || "unknown";
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    res.set("RateLimit-Limit", String(limit));
    if (failureStatus === undefined) {
      bucket.count += 1;
      res.set("RateLimit-Remaining", String(Math.max(0, limit - bucket.count)));
      if (bucket.count > limit) {
        return res.status(429).json({ message: "Too many attempts. Please try again later." });
      }
      return next();
    }

    res.set("RateLimit-Remaining", String(Math.max(0, limit - bucket.count)));
    if (bucket.count >= limit) {
      return res.status(429).json({ message: "Too many attempts. Please try again later." });
    }

    res.once("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        buckets.delete(key);
        return;
      }
      if (res.statusCode !== failureStatus) return;

      const currentBucket = buckets.get(key);
      const failedAttempts = currentBucket && currentBucket.resetAt > Date.now()
        ? currentBucket
        : { count: 0, resetAt: Date.now() + windowMs };
      failedAttempts.count += 1;
      buckets.set(key, failedAttempts);
    });
    next();
  };
}

module.exports = rateLimit;
