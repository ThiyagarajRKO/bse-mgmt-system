"use strict";

const fp = require("fastify-plugin");
require("dotenv").config();

const session = require("@fastify/session");
const db = require("../../models");

module.exports = fp(async function (fastify, opts) {
  // Allow optionally keeping sessions until explicit signout (useful for
  // "remember me"-like behavior). Controlled via KEEP_SESSION_UNTIL_SIGNOUT.
  const keepUntilSignout = process.env.KEEP_SESSION_UNTIL_SIGNOUT === "true";
  // Default session age: 3 days in ms
  const defaultMaxAge = parseInt(process.env.SESSION_MAX_AGE || "259200000");
  // If keepUntilSignout is enabled, allow overriding SESSION_MAX_AGE to a
  // large value (e.g. 10 years) so sessions effectively do not expire until
  // the user signs out.
  const maxAge = keepUntilSignout
    ? parseInt(
        process.env.SESSION_MAX_AGE || String(10 * 365 * 24 * 60 * 60 * 1000),
      )
    : defaultMaxAge;

  try {
    const sessionConfig = {
      cookieName: "sessionId",
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
      // Configure cookie settings explicitly. For cross-site cookie usage
      // (frontend and API on different origins) you generally need
      // `sameSite: 'none'` and `secure: true` (secure requires HTTPS).
      // Make these configurable via environment variables so dev vs prod
      // can be handled safely.
      cookie: {
        secure: process.env.COOKIE_SECURE === "true" || false,
        sameSite: false,
        maxAge: maxAge,
      },
    };

    // Only try to use database store if models are available and authenticated
    if (db && db.sequelize) {
      try {
        const SessionStore = require("connect-session-sequelize")(
          session.Store,
        );
        sessionConfig.store = new SessionStore({
          db: db.sequelize,
          tableName: "sessions",
          // When keeping sessions until signout we want the store to keep the
          // record for at least `maxAge`. `expiration` is the TTL in ms used by
          // the session store cleanup.
          disableTouch: false,
          expiration: maxAge,
          checkExpirationInterval: 900000,
        });
      } catch (storeErr) {
        console.log(
          "⚠️  Using memory session store (database unavailable):",
          storeErr.message,
        );
      }
    }

    fastify.register(session, sessionConfig);
  } catch (err) {
    console.log("⚠️  Session plugin registration failed:", err.message);
    throw err;
  }
});
