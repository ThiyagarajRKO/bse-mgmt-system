"use strict";

// Importing Modules to Start Server
import AutoLoad from "@fastify/autoload";
import path from "path";
import Boom from "boom";
import Fastify from "fastify";
import dotenv from "dotenv";
const models = require("../models");

dotenv.config();

// Importing Routes
import { PrivateRouters, PublicRouters } from "./routes";

// Configure the framework and instantiate it
const fastify = Fastify({
  logger: true,
});

// Decorate fastify with models
fastify.decorate("models", models);

// This loads all plugins defined in plugins those should be support plugins that are reused through your application
fastify.register(AutoLoad, {
  dir: path.join(process.cwd(), "/src/plugins"),
});

//Configuring the routes
fastify.register(PublicRouters, { prefix: "/api/v1" });
fastify.register(PrivateRouters, { prefix: "/api/v1" });

// Run the server after verifying DB connectivity
const start = async () => {
  try {
    // attempt DB connection (models.authenticate is a helper exposed by models/index.js)
    if (models && typeof models.authenticate === "function") {
      await models.authenticate();
      fastify.log.info("Database connection verified");
    }

    await fastify.listen({ port: process.env.PORT, host: "127.0.0.1" });
  } catch (err) {
    fastify.log.error(err);
    // ensure we surface the error and exit so systemd / process managers can restart if needed
    process.exit(1);
  }
};

start();

// Hooks
fastify.addHook("onError", async (request, reply, error) => {
  fastify.log.error(error);
  reply.code(500).send({ success: false, message: error?.message || error });
});

fastify.addHook("onSend", function (request, reply, payload, done) {
  try {
    // Small safeguard and debug logging to diagnose response-wrapping issues.
    // Ensure we always call `done()` (Fastify expects the hook to invoke the callback).
    try {
      const info = {
        url: request.raw?.url,
        method: request.raw?.method,
        statusCode: reply.statusCode,
        payloadType: typeof payload,
        payloadKeys:
          payload && typeof payload === "object"
            ? Object.keys(payload).slice(0, 10)
            : undefined,
      };
      fastify.log.debug({ onSend: info });
    } catch (e) {
      /* ignore logging errors */
    }

    if (!reply.sent && payload) {
      done(null, payload);
      return;
    }

    // Still call done even when there's no payload to avoid leaving the hook unresolved.
    done();
  } catch (err) {
    // console.error(new Date().toISOString() + " : " + err?.message || err);
  }
});

// View Handlers
fastify.get("/", (req, res) => {
  res.view("index.ejs");
});

fastify.get("/AdminMain", function (req, res) {
  if (!req?.session?.pid) {
    return res.redirect("/");
  }
  res.view("AdminMain.ejs", {
    full_name: req?.session?.full_name,
    role_name: req?.session?.role_name,
  });
});

fastify.get("/Procurement", function (req, res) {
  res.view("Procurement.ejs");
});

fastify.get("/MasterData", function (req, res) {
  if (!req?.session?.pid) {
    return res.redirect("/");
  }
  res.view("MasterData.ejs");
});

fastify.get("/Production", function (req, res) {
  res.view("Production.ejs");
});

fastify.get("/Inventory", function (req, res) {
  res.view("Inventory.ejs");
});

fastify.get("/Sales", function (req, res) {
  res.view("Sales.ejs");
});

fastify.get("/AuditLogs", function (req, res) {
  res.view("AuditLogs.ejs");
});
