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

const start = async () => {
  try {
    // Register session plugin with database persistence
    // This plugin uses connect-session-sequelize to store sessions in the database
    // Located in src/plugins/session.js
    await fastify.register(AutoLoad, {
      dir: path.join(process.cwd(), "/src/plugins"),
    });

    //Configuring the routes
    fastify.register(PublicRouters, { prefix: "/api" });
    fastify.register(PrivateRouters, { prefix: "/api" });

    // Add hooks BEFORE start - these handle missing .map files
    // Suppress 404 errors for missing source map files
    fastify.addHook("onSend", async (request, reply, payload) => {
      // Don't log 404 errors for .map (source map) files - they're optional development artifacts
      if (
        reply.statusCode === 404 &&
        request.url &&
        request.url.endsWith(".map")
      ) {
        // Return 204 No Content for missing source maps instead of 404
        reply.code(204);
        return null; // Don't send the 404 response
      }
      return payload;
    });

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
