"use strict";

const fp = require("fastify-plugin");

/**
 * Authenticate Plugin
 * Provides fastify.authenticate preHandler hook for routes
 * Validates that user is authenticated via session
 */
module.exports = fp(async function (fastify, opts) {
  // Define the authenticate function as a preHandler hook
  const authenticate = async function (request, reply) {
    try {
      // Check if session exists and has a profile ID
      if (!request?.session?.pid) {
        return reply.code(401).send({
          success: false,
          message: "Unauthorized - Session not found or invalid",
        });
      }

      // Attach session data to request for use in routes
      request.token_profile_id = request.session.pid;
    } catch (err) {
      return reply.code(401).send({
        success: false,
        message: "Authentication failed",
      });
    }
  };

  // Decorate fastify with the authenticate function
  fastify.decorate("authenticate", authenticate);
});
