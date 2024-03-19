"use strict";

const fp = require("fastify-plugin");
const swagger = require("@fastify/swagger");
const packageJson = require("../../package.json");

module.exports = fp(async function (fastify, opts) {
  fastify.register(swagger, {
    routePrefix: "/",
    openapi: {
      info: {
        title: "Piechips Service Swagger",
        description: "Testing the Piechips REST API Service",
        version: packageJson.version,
      },
      externalDocs: {
        url: "https://swagger.io",
        description: "Find more info here",
      },
      consumes: ["application/json"],
      produces: ["application/json"],

      // Define Different Tags (Modules)
      tags: [
        { name: "User", description: "User related end-points" },
        { name: "Temp", description: "Temp related end-points" },
      ],
      // Define any Object how it looks here
      definitions: {
        // User: {
        //     type: 'object',
        //     required: ['id', 'email'],
        //     properties: {
        //         id: { type: 'string', format: 'uuid' },
        //         firstName: { type: 'string' },
        //         lastName: { type: 'string' },
        //         email: { type: 'string', format: 'email' }
        //     }
        // }
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    exposeRoute: true,
  });
});
