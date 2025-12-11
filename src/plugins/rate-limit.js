"use strict";

const fp = require("fastify-plugin");

module.exports = fp(async function (fastify, opts) {
  fastify.register(require("@fastify/rate-limit"), {
    max:
      process.env.RATE_LIMIT && typeof process.env.RATE_LIMIT == "string"
        ? parseInt(process.env.RATE_LIMIT)
        : 120,
    timeWindow: process.env.RATE_LIMIT_TIME || "15 minutes",
    // allowList: regex patterns that bypass rate limiting
    allowList: [
      /^\/public\//,  // Static assets
      /^\/node_modules\//,  // Node modules
      /\.map$/,  // Source maps
      /^\/health$/,  // Health check
    ],
    // Skip rate limiting for specific routes
    skip: (req) => {
      // Don't rate limit static files
      if (req.url && (req.url.startsWith("/public/") || req.url.match(/\.(map|js|css|jpg|png|gif|svg)$/i))) {
        return true;
      }
      return false;
    },
  });
});
