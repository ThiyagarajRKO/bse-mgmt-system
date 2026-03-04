"use strict";

const fp = require("fastify-plugin");

module.exports = fp(async function (fastify, opts) {
  // Allow credentials so session cookies can be sent/received when requests
  // originate from a different origin (useful for some dev setups).
  fastify.register(require("@fastify/cors"), {
    origin: true,
    credentials: true,
  });
});
