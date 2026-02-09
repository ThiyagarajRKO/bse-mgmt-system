import models from "../../../../models";
import { Op } from "sequelize";

export const GetPurchaseRequests = (
  { start = 0, length = 10, search = "", order_id = null, ...params },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(
        "GetPurchaseRequests handler called with params:",
        params,
        "order_id:",
        order_id,
      );

      // Build where clause for purchase requests - just get all active ones for now
      let where = {
        is_active: true,
      };

      // Filter by order_id if provided
      if (order_id) {
        where.order_id = order_id;
      }

      if (search) {
        where[Op.and] = {
          [Op.or]: [
            { "$Orders.order_no$": { [Op.iLike]: `%${search}%` } },
            { "$ProductMaster.product_name$": { [Op.iLike]: `%${search}%` } },
            { procurement_purchaser: { [Op.iLike]: `%${search}%` } },
          ],
        };
      }

      const purchaseRequests = await models.ProcurementProducts.findAndCountAll(
        {
          where,
          include: [
            {
              model: models.ProductMaster,
              as: "ProductMaster",
              attributes: ["id", "product_name"],
              required: false,
            },
            {
              model: models.SupplierMaster,
              attributes: ["id", "supplier_name"],
              required: false,
            },
            {
              model: models.Orders,
              attributes: ["id", "order_no"],
              required: false,
            },
            {
              model: models.UserProfiles,
              as: "creator",
              attributes: ["id", "first_name", "last_name"],
              required: false,
            },
          ],
          limit: parseInt(length) || 10,
          offset: parseInt(start) || 0,
          subQuery: false,
          raw: false,
          order: [["created_at", "DESC"]],
        },
      );

      // Map the response to include order_no from related Orders table
      const rows = purchaseRequests.rows.map((pr) => ({
        id: pr.id,
        created_at: pr.created_at,
        order_id: pr.Orders?.id,
        order_no: pr.Orders?.order_no || "-",
        product_name: pr.ProductMaster?.product_name || pr.product_master_id,
        procurement_quantity: pr.procurement_quantity,
        procurement_price: pr.procurement_price,
        procurement_totalamount: pr.procurement_totalamount,
        supplier_name: pr.SupplierMaster?.supplier_name || "-",
        procurement_purchaser: pr.procurement_purchaser,
        status: pr.status || "Pending",
        approver_name: pr.approver_name || "-",
      }));

      resolve({
        data: {
          rows,
          count: purchaseRequests.count,
        },
      });
    } catch (err) {
      console.error("GetPurchaseRequests handler error:", err);
      fastify.log.error(err);
      reject(err);
    }
  });
};
