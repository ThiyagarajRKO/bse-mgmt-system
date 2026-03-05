/**
 * Simple In-Memory Cache Utility
 * Stores API responses for a specified duration
 * Thread-safe and garbage-collected after TTL
 */

class APICache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Generate a cache key from parameters
   */
  generateKey(endpoint, params = {}) {
    const paramStr = JSON.stringify(params);
    return `${endpoint}:${paramStr}`;
  }

  /**
   * Set a cache entry with TTL (Time To Live)
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key, value, ttl = 5 * 60 * 1000) {
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Store the value
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
      console.log(`[Cache] Expired: ${key}`);
    }, ttl);

    this.timers.set(key, timer);
    console.log(`[Cache] Set: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Get a cache entry
   * @param {string} key - Cache key
   * @returns {*} Cached value or null if not found/expired
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    const ageMs = Date.now() - entry.timestamp;
    if (ageMs > entry.ttl) {
      this.cache.delete(key);
      this.timers.delete(key);
      console.log(`[Cache] Expired: ${key}`);
      return null;
    }

    console.log(`[Cache] Hit: ${key} (age: ${Math.round(ageMs)}ms)`);
    return entry.value;
  }

  /**
   * Check if key exists and is valid
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    this.cache.delete(key);
    console.log(`[Cache] Invalidated: ${key}`);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    const keysToDelete = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.invalidate(key));
    console.log(
      `[Cache] Invalidated ${keysToDelete.length} entries matching: ${pattern}`,
    );
  }

  /**
   * Clear all cache
   */
  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.cache.clear();
    this.timers.clear();
    console.log(`[Cache] Cleared all entries`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export default new APICache();
