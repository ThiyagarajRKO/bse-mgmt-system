/**
 * Accounting Dashboard Route
 * Serves the accounting module UI
 */

export const accountingDashboardRoutes = (fastify, opts, done) => {
  fastify.get("/accounting", async (req, reply) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.user_id) {
        return reply.code(302).redirect("/");
      }

      return reply.view("Accounting", {
        title: "Accounting Dashboard",
        user: req.session?.user || {},
        user_id: req.session?.user_id,
        role: req.session?.role,
      });
    } catch (err) {
      console.error("Accounting dashboard error:", err);
      return reply.code(500).send({
        success: false,
        message: "Failed to load accounting dashboard",
        error: err.message,
      });
    }
  });

  done();
};

export default accountingDashboardRoutes;
