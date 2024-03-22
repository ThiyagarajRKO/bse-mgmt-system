"use strict";

const fp = require("fastify-plugin");
require("dotenv").config();

const session = require("@fastify/session");
const SessionStore = require("connect-session-sequelize")(session.Store);
const db = require("../../models");

module.exports = fp(async function (fastify, opts) {
  fastify.register(session, {
    cookieName: "sessionId",
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    cookie: {
      secure: false,
      maxAge: 259200000,
    },
    store: new SessionStore({
      db: db.sequelize,
      tableName: "sessions",
      disableTouch: true,
      expiration: 259200000,
      checkExpirationInterval: 900000,
    }),
  });
});
