import { SupplierMaster } from "../../../controllers";
import models from "../../../../models";
import { Op } from "sequelize";

/**
 * Get suppliers as dropdown data
 * Filters to only show active suppliers
 * No authentication required - public endpoint for dropdowns
 */
export const GetDropdown = async (params, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        search = "",
        start = 0,
        length = 5000,
      } = params;

      // Build the where clause for SupplierMaster
      let where = {
        is_active: true,
      };

      if (search) {
        where[Op.or] = [
          { supplier_name: { [Op.iLike]: `%${search}%` } },
          { supplier_code: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Get suppliers
      const suppliers = await models.SupplierMaster.findAll({
        where,
        attributes: ["id", "supplier_name", "supplier_code", "is_active"],
        limit: parseInt(length),
        offset: parseInt(start),
        order: [["supplier_name", "ASC"]],
      });

      const total = await models.SupplierMaster.count({ where });

      return resolve({
        statusCode: 200,
        message: "Suppliers retrieved successfully",
        data: suppliers,
        total,
      });
    } catch (err) {
      fastify.log.error("GetDropdown error:", err);
      return reject({
        statusCode: 400,
        message: err?.message || "Unable to fetch suppliers",
      });
    }
  });
};
