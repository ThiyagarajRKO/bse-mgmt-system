"use strict";

const fp = require("fastify-plugin");

module.exports = fp(async function (fastify, opts) {
  fastify.register(require("@fastify/static"), {
    root: process.cwd() + "/public/",
    prefix: "/public/",
    maxAge: 2592000,
  });
});
