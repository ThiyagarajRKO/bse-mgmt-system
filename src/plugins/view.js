"use strict";

const fp = require("fastify-plugin");

module.exports = fp(async function (fastify, opts) {
  fastify.register(require("@fastify/view"), {
    engine: {
      ejs: require("ejs"),
    },
    root: process.cwd() + "/views/",
    viewExt: "ejs",
  });
});
