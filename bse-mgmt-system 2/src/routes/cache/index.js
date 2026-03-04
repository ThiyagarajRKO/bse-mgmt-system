/**
 * Cache Management Routes
 * Provides endpoints to manage application cache
 */

import cache from "../../utils/cache.js";

export const cacheRoutes = (fastify, opts, done) => {
  /**
   * GET /api/cache/stats
   * Get cache statistics
   */
  fastify.get("/stats", async (request, reply) => {
    try {
      const stats = cache.getStats();
      return reply.code(200).send({
        success: true,
        data: stats,
        message: "Cache statistics retrieved successfully",
      });
    } catch (error) {
      fastify.log.error("Cache stats error:", error);
      return reply.code(500).send({
        success: false,
        message: "Failed to retrieve cache statistics",
        error: error.message,
      });
    }
  });

  /**
   * POST /api/cache/invalidate
   * Invalidate specific cache entry
   * Body: { key: "cache-key" }
   */
  fastify.post("/invalidate", async (request, reply) => {
    try {
      const { key } = request.body;

      if (!key) {
        return reply.code(400).send({
          success: false,
          message: "Cache key is required",
        });
      }

      cache.invalidate(key);

      return reply.code(200).send({
        success: true,
        message: `Cache entry invalidated: ${key}`,
      });
    } catch (error) {
      fastify.log.error("Cache invalidate error:", error);
      return reply.code(500).send({
        success: false,
        message: "Failed to invalidate cache",
        error: error.message,
      });
    }
  });

  /**
   * POST /api/cache/invalidate-pattern
   * Invalidate cache entries matching a pattern
   * Body: { pattern: "allocation.*" }
   */
  fastify.post("/invalidate-pattern", async (request, reply) => {
    try {
      const { pattern } = request.body;

      if (!pattern) {
        return reply.code(400).send({
          success: false,
          message: "Pattern is required",
        });
      }

      cache.invalidatePattern(pattern);

      return reply.code(200).send({
        success: true,
        message: `Cache entries invalidated for pattern: ${pattern}`,
      });
    } catch (error) {
      fastify.log.error("Cache invalidate pattern error:", error);
      return reply.code(500).send({
        success: false,
        message: "Failed to invalidate cache by pattern",
        error: error.message,
      });
    }
  });

  /**
   * POST /api/cache/clear
   * Clear all cache
   */
  fastify.post("/clear", async (request, reply) => {
    try {
      cache.clear();

      return reply.code(200).send({
        success: true,
        message: "All cache entries cleared successfully",
      });
    } catch (error) {
      fastify.log.error("Cache clear error:", error);
      return reply.code(500).send({
        success: false,
        message: "Failed to clear cache",
        error: error.message,
      });
    }
  });

  /**
   * GET /api/cache/entries
   * Get list of all cached entries
   */
  fastify.get("/entries", async (request, reply) => {
    try {
      const stats = cache.getStats();
      return reply.code(200).send({
        success: true,
        data: {
          count: stats.size,
          entries: stats.entries,
        },
        message: "Cached entries retrieved successfully",
      });
    } catch (error) {
      fastify.log.error("Cache entries error:", error);
      return reply.code(500).send({
        success: false,
        message: "Failed to retrieve cached entries",
        error: error.message,
      });
    }
  });

  done();
};

export default cacheRoutes;
