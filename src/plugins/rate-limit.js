"use strict";

const fp = require("fastify-plugin");

module.exports = fp(async function (fastify, opts) {
  fastify.register(require("@fastify/rate-limit"), {
    max:
      process.env.RATE_LIMIT && typeof process.env.RATE_LIMIT == "string"
        ? parseInt(process.env.RATE_LIMIT)
        : 80,
    timeWindow: process.env.RATE_LIMIT_TIME,
    allowList: ["/public"],
  });
});
