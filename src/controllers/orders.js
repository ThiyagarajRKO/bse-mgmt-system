import { Op } from "sequelize";
import models, { sequelize } from "../../models";

// UUID regex pattern for validation
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate UUID format using regex pattern
 */
const isValidUuid = (id) => {
  return typeof id === "string" && UUID_PATTERN.test(id);
};

export const Insert = async (profile_id, order_data, is_products_included) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!order_data) {
        return reject({
          statusCode: 420,
          message: "Orders data must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!order_data.customer_master_id) {
        return reject({
          statusCode: 420,
          message: "Customer master id must not be empty!",
        });
      }

      // Validate customer_master_id is a valid UUID
      if (!isValidUuid(order_data.customer_master_id)) {
        return reject({
          statusCode: 422,
          message: "Invalid Customer Master ID format. Expected valid UUID.",
        });
      }

      // Extract OrderProducts from order_data to pass through options instead
      const orderProducts = order_data.OrderProducts;
      const cleanOrderData = { ...order_data };
      delete cleanOrderData.OrderProducts;

      const result = await models.Orders.create(cleanOrderData, {
        profile_id,
        OrderProducts: orderProducts, // Pass through options for afterCreate hook
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Orders order already exists!",
        });
      }

      reject(err);
    }
  });
};

export const Update = async (profile_id, id, order_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Orders id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!order_data) {
        return reject({
          statusCode: 420,
          message: "Orders data must not be empty!",
        });
      }

      const result = await models.Orders.update(order_data, {
        where: {
          id,
          is_active: true,
        },
        individualHooks: true,
        profile_id,
      });
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

export const Get = ({ id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Orders ID field must not be empty!",
        });
      }

      // Validate id is a valid UUID
      if (!isValidUuid(id)) {
        return reject({
          statusCode: 422,
          message: `Invalid Order ID format. Expected valid UUID, but received: "${id}". Please provide a valid UUID.`,
        });
      }

      const species = await models.Orders.findOne({
        include: [
          {
            model: models.OrderProducts,
            include: [
              {
                model: models.ProductMaster,
                as: "ProductMaster",
              },
            ],
          },
          {
            model: models.CustomerMaster,
          },
        ],
        where: {
          id,
          is_active: true,
        },
      });

      resolve(species);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetWithTracking = ({ id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Orders ID field must not be empty!",
        });
      }

      if (!isValidUuid(id)) {
        return reject({
          statusCode: 422,
          message: `Invalid Order ID format. Expected valid UUID, but received: "${id}". Please provide a valid UUID.`,
        });
      }

      const order = await models.Orders.findOne({
        where: {
          id,
          is_active: true,
        },
        include: [
          {
            model: models.CustomerMaster,
            attributes: ["customer_name", "customer_email", "customer_phone"],
          },
        ],
      });

      if (!order) {
        return reject({
          statusCode: 404,
          message: "Order not found",
        });
      }

      // Get order status changes timeline
      const statusTimeline = await models.OrderStatusLog.findAll({
        where: {
          order_id: id,
          is_active: true,
        },
        attributes: [
          "id",
          "from_status",
          "to_status",
          "transition_date",
          "transition_reason",
          "metadata",
          "created_at",
        ],
        order: [["created_at", "ASC"]],
      });

      resolve({
        order: order.dataValues,
        sales_tracking: [],
        sales_totals: {
          total_items: 0,
          total_quantity: 0,
          total_packings: 0,
        },
        status_timeline: statusTimeline.map((log) => log.dataValues),
        production_tracking: {
          procurement: [],
          dispatches: [],
          peeling: [],
          peeled_dispatches: [],
          production_orders: [],
        },
        summary: {
          total_procurement_lots: 0,
          total_dispatches: 0,
          total_peeling_records: 0,
          total_peeled_dispatches: 0,
          total_production_orders: 0,
          total_dispatched_quantity: 0,
          total_peeled_quantity: 0,
          total_peeled_dispatched_quantity: 0,
        },
      });
    } catch (err) {
      reject(err);
    }
  });
};

// Enhanced GetWithTracking with full production pipeline
export const GetWithProductionTracking = ({ id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Orders ID field must not be empty!",
        });
      }

      if (!isValidUuid(id)) {
        return reject({
          statusCode: 422,
          message: `Invalid Order ID format. Expected valid UUID, but received: "${id}". Please provide a valid UUID.`,
        });
      }

      const order = await models.Orders.findOne({
        where: {
          id,
          is_active: true,
        },
        include: [
          {
            model: models.CustomerMaster,
            attributes: ["customer_name", "customer_email", "customer_phone"],
          },
          {
            model: models.OrderProducts,
            attributes: ["id", "quantity", "product_master_id"],
            where: { is_active: true },
            required: false,
          },
        ],
      });

      if (!order) {
        return reject({
          statusCode: 404,
          message: "Order not found",
        });
      }

      // Get sales inventory tracking for this order
      const salesTracking = await sequelize.query(
        `
        SELECT 
          si.id as sales_inventory_id,
          si.packing_id,
          si.quantity as sold_quantity,
          pm.product_name,
          sm.size as size_name,
          gm.grade_name,
          pacm.packaging_code,
          p.expiry_date,
          COUNT(DISTINCT si.id) as total_sales_items
        FROM sales_inventory si
        LEFT JOIN packing p ON si.packing_id = p.id
        LEFT JOIN product_master pm ON si.product_master_id = pm.id
        LEFT JOIN size_master sm ON p.size_master_id = sm.id
        LEFT JOIN grade_master gm ON p.grade_master_id = gm.id
        LEFT JOIN packaging_master pacm ON p.packaging_master_id = pacm.id
        WHERE si.order_id = :orderId AND si.is_active = true
        GROUP BY si.id, si.packing_id, si.quantity, pm.product_name, sm.size, gm.grade_name, pacm.packaging_code, p.expiry_date
      `,
        { replacements: { orderId: id }, type: sequelize.QueryTypes.SELECT },
      );

      // Calculate sales totals
      const salesTotals = await sequelize.query(
        `
        SELECT 
          COUNT(DISTINCT si.id) as total_items,
          SUM(si.quantity) as total_quantity,
          COUNT(DISTINCT p.id) as total_packings
        FROM sales_inventory si
        LEFT JOIN packing p ON si.packing_id = p.id
        WHERE si.order_id = :orderId AND si.is_active = true
      `,
        { replacements: { orderId: id }, type: sequelize.QueryTypes.SELECT },
      );

      // Get order status changes timeline
      const statusTimeline = await models.OrderStatusLog.findAll({
        where: {
          order_id: id,
          is_active: true,
        },
        attributes: [
          "id",
          "from_status",
          "to_status",
          "transition_date",
          "transition_reason",
          "metadata",
          "created_at",
        ],
        order: [["created_at", "ASC"]],
      });

      // Get production tracking data (production orders, dispatches, peeling, etc)
      // Note: These tables may be empty if production hasn't started yet
      // Using minimal attributes that should exist in all tables
      let productionOrders = [];
      let dispatches = [];
      let peelingRecords = [];
      let peeledDispatches = [];
      let procurementLots = [];

      try {
        if (models.production_orders) {
          productionOrders = await models.production_orders
            .findAll({
              where: { order_id: id },
              attributes: ["id", "created_at"],
              raw: true,
            })
            .catch((err) => {
              console.warn(
                `[GetTracking] Error fetching production_orders: ${err.message}`,
              );
              return [];
            });
        }
      } catch (err) {
        console.warn(
          `[GetTracking] Could not fetch production_orders: ${err.message}`,
        );
      }

      try {
        if (models.Dispatches) {
          dispatches = await models.Dispatches.findAll({
            where: { order_id: id },
            attributes: ["id", "created_at"],
            raw: true,
          }).catch((err) => {
            console.warn(
              `[GetTracking] Error fetching dispatches: ${err.message}`,
            );
            return [];
          });
        }
      } catch (err) {
        console.warn(
          `[GetTracking] Could not fetch dispatches: ${err.message}`,
        );
      }

      try {
        if (models.Peeling) {
          peelingRecords = await models.Peeling.findAll({
            where: { order_id: id },
            attributes: ["id", "created_at"],
            raw: true,
          }).catch((err) => {
            console.warn(
              `[GetTracking] Error fetching peeling: ${err.message}`,
            );
            return [];
          });
        }
      } catch (err) {
        console.warn(`[GetTracking] Could not fetch peeling: ${err.message}`);
      }

      try {
        if (models.PeeledDispatches) {
          peeledDispatches = await models.PeeledDispatches.findAll({
            where: { order_id: id },
            attributes: ["id", "created_at"],
            raw: true,
          }).catch((err) => {
            console.warn(
              `[GetTracking] Error fetching peeled_dispatches: ${err.message}`,
            );
            return [];
          });
        }
      } catch (err) {
        console.warn(
          `[GetTracking] Could not fetch peeled_dispatches: ${err.message}`,
        );
      }

      try {
        if (models.ProcurementLots) {
          procurementLots = await models.ProcurementLots.findAll({
            where: { order_id: id },
            attributes: ["id", "created_at"],
            raw: true,
          }).catch((err) => {
            console.warn(
              `[GetTracking] Error fetching procurement_lots: ${err.message}`,
            );
            return [];
          });
        }
      } catch (err) {
        console.warn(
          `[GetTracking] Could not fetch procurement_lots: ${err.message}`,
        );
      }

      resolve({
        order: order.dataValues,
        sales_tracking: salesTracking,
        sales_totals: salesTotals[0] || {
          total_items: 0,
          total_quantity: 0,
          total_packings: 0,
        },
        status_timeline: statusTimeline.map((log) => log.dataValues),
        production_tracking: {
          procurement: procurementLots,
          dispatches: dispatches,
          peeling: peelingRecords,
          peeled_dispatches: peeledDispatches,
          production_orders: productionOrders,
        },
        summary: {
          total_procurement_lots: procurementLots.length,
          total_dispatches: dispatches.length,
          total_peeling_records: peelingRecords.length,
          total_peeled_dispatches: peeledDispatches.length,
          total_production_orders: productionOrders.length,
          total_dispatched_quantity: dispatches.reduce(
            (sum, d) => sum + (d.dispatch_quantity_kg || 0),
            0,
          ),
          total_peeled_quantity: peelingRecords.reduce(
            (sum, p) => sum + (p.peeled_output_quantity_kg || 0),
            0,
          ),
          total_peeled_dispatched_quantity: peeledDispatches.reduce(
            (sum, pd) => sum + (pd.dispatch_quantity_kg || 0),
            0,
          ),
        },
      });
    } catch (err) {
      reject(err);
    }
  });
};

export const GetOrderProducts = ({ order_id, start, length, search }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!order_id) {
        return reject({
          statusCode: 420,
          message: "Order ID field must not be empty!",
        });
      }

      // Validate order_id is a valid UUID
      if (!isValidUuid(order_id)) {
        return reject({
          statusCode: 422,
          message: `Invalid Order ID format. Expected valid UUID, but received: "${order_id}". Please provide a valid UUID.`,
        });
      }

      let where = {
        order_id,
        is_active: true,
      };

      // Use separate queries but execute them in parallel for better performance
      const [countResult, orderProducts] = await Promise.all([
        // Count query - use include to match findAll behavior
        models.OrderProducts.count({
          where: {
            order_id,
            is_active: true,
          },
          include: [
            {
              model: models.ProductMaster,
              as: "ProductMaster",
              where: { is_active: true },
              required: true,
            },
          ],
        }),
        // Data query
        models.OrderProducts.findAll({
          attributes: [
            "id",
            "order_id",
            "quantity",
            "price",
            "discount",
            "description",
            "delivery_status",
            "product_master_id",
            "packing_id",
            [sequelize.literal("quantity * price"), "total_price"],
          ],
          include: [
            {
              attributes: ["id", "product_name", "is_active"],
              as: "ProductMaster",
              model: models.ProductMaster,
              where: { is_active: true },
              required: true,
            },
            {
              attributes: ["id"],
              model: models.Packing,
              required: false,
            },
          ],
          where,
          offset: start,
          limit: length,
          order: [["created_at", "desc"]],
        }),
      ]);

      resolve({
        count: countResult,
        rows: orderProducts.map((product) => product.toJSON()),
      });
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({ start, length, search }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (search) {
        where[Op.or] = [
          sequelize.where(
            sequelize.cast(sequelize.col("order_no"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),
          { "$CustomerMaster.customer_name$": { [Op.iLike]: `%${search}%` } },
          { "$ShippingMaster.shipping_source$": { [Op.iLike]: `%${search}%` } },
          {
            "$ShippingMaster.shipping_destination$": {
              [Op.iLike]: `%${search}%`,
            },
          },
        ];
      }

      const suppliers = await models.Orders.findAndCountAll({
        subQuery: false,
        attributes: [
          "id",
          "order_no",
          "created_at",
          "payment_terms",
          "payment_type",
          "shipping_date",
          "shipping_address",
          "shipping_method",
          "expected_delivery_date",
          "delivery_status",
          [
            sequelize.literal(
              `(SELECT SUM(total_price) FROM order_products op WHERE op.order_id = "Orders".id and op.is_active = true)`,
            ),
            "total_products_price",
          ],
        ],
        include: [
          {
            attributes: [
              "id",
              "customer_name",
              "customer_country",
              "customer_email",
              "customer_phone",
            ],
            model: models.CustomerMaster,
            where: {
              is_active: true,
            },
          },
          {
            attributes: ["id", "shipping_source", "shipping_destination"],
            model: models.ShippingMaster,
            where: {
              is_active: true,
            },
            include: [
              {
                attributes: ["id", "carrier_name"],
                model: models.CarrierMaster,
                where: {
                  is_active: true,
                },
              },
            ],
          },
          {
            attributes: [
              "id",
              "quantity",
              "price",
              "discount",
              "description",
              "delivery_status",
              "product_master_id",
              "packing_id",
            ],
            model: models.OrderProducts,
            where: {
              is_active: true,
            },
            required: false,
            include: [
              {
                attributes: ["id", "product_name"],
                as: "ProductMaster",
                model: models.ProductMaster,
                required: false,
              },
              {
                attributes: ["id"],
                model: models.Packing,
                required: false,
                include: [
                  {
                    attributes: ["id"],
                    as: "pd",
                    model: models.PeeledDispatches,
                    required: false,
                    include: [
                      {
                        attributes: ["id"],
                        as: "pp",
                        model: models.PeelingProducts,
                        required: false,
                        include: [
                          {
                            attributes: ["id", "product_name"],
                            model: models.ProductMaster,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(suppliers);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetOrderNumbers = ({
  customer_master_id,
  sales_payment_id,
  start,
  length,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!customer_master_id) {
        return reject({ message: "Customer master data must not be empty" });
      }

      // Validate customer_master_id is a valid UUID
      if (!isValidUuid(customer_master_id)) {
        return reject({
          statusCode: 422,
          message: "Invalid Customer Master ID format. Expected valid UUID.",
        });
      }

      let where = {
        is_active: true,
      };

      if (search) {
        where[Op.or] = [
          sequelize.where(
            sequelize.cast(sequelize.col("order_no"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),
        ];
      }

      const suppliers = await models.Orders.findAndCountAll({
        subQuery: false,
        attributes: [
          "id",
          "order_no",
          [
            sequelize.literal(
              `(SELECT SUM(op.total_price) FROM order_products op WHERE op.order_id = "Orders".id and op.is_active = true)`,
            ),
            "total_amount",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(sp.total_paid) FROM sales_payments sp WHERE sp.order_id = "Orders".id AND sp.customer_master_id = '${customer_master_id}' 
              ${
                sales_payment_id != "null" &&
                sales_payment_id != undefined &&
                sales_payment_id != ""
                  ? "AND sp.id != '" + sales_payment_id + "'"
                  : ""
              } AND sp.is_active = true)`,
            ),
            "total_paid",
          ],
        ],
        include: [
          {
            attributes: [],
            model: models.CustomerMaster,
            where: {
              is_active: true,
              id: customer_master_id,
            },
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(suppliers);
    } catch (err) {
      reject(err);
    }
  });
};

export const Delete = ({ profile_id, id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Orders ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      // First, update is_active to false and set deleted_by
      const updated = await models.Orders.update(
        {
          is_active: false,
          deleted_by: profile_id,
          deleted_at: new Date(),
        },
        {
          where: {
            id,
            is_active: true,
            created_by: profile_id,
          },
          individualHooks: true,
          profile_id,
        },
      );

      // If update was successful (updated > 0), then destroy for paranoid soft delete
      if (updated && updated[0] > 0) {
        try {
          await models.Orders.destroy({
            where: {
              id,
              created_by: profile_id,
            },
            individualHooks: true,
            profile_id,
          });
        } catch (destroyErr) {
          // Log but don't fail on destroy - the update is what matters
          console.log(
            "Warning: destroy failed but update succeeded",
            destroyErr?.message,
          );
        }
        resolve(updated[0]);
      } else {
        resolve({
          statusCode: 420,
          message: "Order not found or already deleted",
        });
      }
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAllocationData = ({ start, length, search }) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Get all active orders that have products (for allocation workflow)
      let where = {
        is_active: true,
        // Don't filter by delivery_status - show all active orders
      };

      if (search) {
        where[Op.or] = [
          sequelize.where(
            sequelize.cast(sequelize.col("order_no"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),
          { "$CustomerMaster.customer_name$": { [Op.iLike]: `%${search}%` } },
          {
            "$OrderProducts.ProductMaster.product_name$": {
              [Op.iLike]: `%${search}%`,
            },
          },
        ];
      }

      let orders;
      try {
        orders = await models.Orders.findAndCountAll({
          subQuery: false,
          attributes: [
            "id",
            "order_no",
            "order_status",
            "created_at",
            "payment_terms",
            "payment_type",
            "shipping_date",
            "shipping_address",
            "shipping_method",
            "expected_delivery_date",
            "delivery_status",
            [
              sequelize.literal(
                `CASE 
                  WHEN EXISTS (
                    SELECT 1 FROM sales_inventory si 
                    WHERE si.order_id = "Orders".id 
                    AND si.is_active = true 
                    AND si.quantity > 0
                  ) THEN 'Allocated'
                  WHEN order_status IN ('ALLOCATED', 'IN_PRODUCTION', 'READY_FOR_QA', 'QA_APPROVED', 'PACKED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'INVOICED', 'CLOSED') 
                  THEN 'Allocated' 
                  ELSE 'Pending' 
                END`,
              ),
              "allocation_status",
            ],
            [
              sequelize.literal(
                `(SELECT MAX(status) FROM production_orders po 
                  WHERE po.order_id = "Orders".id)`,
              ),
              "production_status",
            ],
            [
              sequelize.literal(
                `(SELECT SUM(total_price) FROM order_products op WHERE op.order_id = "Orders".id and op.is_active = true)`,
              ),
              "total_products_price",
            ],
          ],
          include: [
            {
              attributes: [
                "id",
                "customer_name",
                "customer_country",
                "customer_email",
                "customer_phone",
              ],
              model: models.CustomerMaster,
              where: {
                is_active: true,
              },
            },
            {
              attributes: [
                "id",
                "quantity",
                "price",
                "discount",
                "description",
                "delivery_status",
                "product_master_id",
                "packing_id",
              ],
              model: models.OrderProducts,
              where: {
                is_active: true,
              },
              required: false,
              include: [
                {
                  attributes: [
                    "id",
                    "product_name",
                    "product_category_master_id",
                  ],
                  as: "ProductMaster",
                  model: models.ProductMaster,
                  required: false,
                  include: [
                    {
                      attributes: [
                        "id",
                        "product_category",
                        "species_master_id",
                      ],
                      model: models.ProductCategoryMaster,
                      required: false,
                    },
                  ],
                },
                {
                  attributes: ["id"],
                  model: models.Packing,
                  required: false,
                  include: [
                    {
                      attributes: ["id"],
                      as: "pd",
                      model: models.PeeledDispatches,
                      required: false,
                      include: [
                        {
                          attributes: ["id"],
                          as: "pp",
                          model: models.PeelingProducts,
                          required: false,
                          include: [
                            {
                              attributes: ["id", "product_name"],
                              model: models.ProductMaster,
                              required: false,
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
          where,
          offset: start,
          limit: length,
          order: [["created_at", "desc"]],
        });
      } catch (includeError) {
        // If include fails, try without ProductCategoryMaster association
        console.warn(
          "Error with ProductCategoryMaster include, falling back to simpler query:",
          includeError.message,
        );
        orders = await models.Orders.findAndCountAll({
          subQuery: false,
          attributes: [
            "id",
            "order_no",
            "created_at",
            "payment_terms",
            "payment_type",
            "shipping_date",
            "shipping_address",
            "shipping_method",
            "expected_delivery_date",
            "delivery_status",
            [
              sequelize.literal(
                `(SELECT SUM(total_price) FROM order_products op WHERE op.order_id = "Orders".id and op.is_active = true)`,
              ),
              "total_products_price",
            ],
            [
              sequelize.literal(
                `(SELECT MAX(status) FROM production_orders po 
                  WHERE po.order_id = "Orders".id)`,
              ),
              "production_status",
            ],
          ],
          include: [
            {
              attributes: [
                "id",
                "customer_name",
                "customer_country",
                "customer_email",
                "customer_phone",
              ],
              model: models.CustomerMaster,
              where: {
                is_active: true,
              },
            },
            {
              attributes: [
                "id",
                "quantity",
                "price",
                "discount",
                "description",
                "delivery_status",
                "product_master_id",
                "packing_id",
              ],
              model: models.OrderProducts,
              where: {
                is_active: true,
              },
              required: false,
              include: [
                {
                  attributes: [
                    "id",
                    "product_name",
                    "product_category_master_id",
                  ],
                  as: "ProductMaster",
                  model: models.ProductMaster,
                  required: false,
                },
              ],
            },
          ],
          where,
          offset: start,
          limit: length,
          order: [["created_at", "desc"]],
        });
      }

      // Add allocation_status to each order based on OrderProducts delivery_status
      const processedOrders = await Promise.all(
        orders.rows.map(async (order) => {
          const orderJson = order.toJSON();

          // Get all products for this order
          const orderProducts = await models.OrderProducts.findAll({
            where: {
              order_id: order.id,
              is_active: true,
            },
            attributes: ["id", "product_master_id", "quantity"],
          });

          // Check for SalesAllocation records to determine allocation status
          const salesAllocations = await models.SalesAllocation.findAll({
            where: {
              order_id: order.id,
              is_active: true,
            },
            attributes: [
              "id",
              "allocation_status",
              "allocated_quantity",
              "order_product_id",
              "action_required",
            ],
          });

          // Check for AllocationMaster records to see if any allocations are pending purchase
          const allocationMasters = await models.AllocationMaster.findAll({
            where: {
              order_id: order.id,
              is_active: true,
            },
            attributes: ["status"],
          });

          // Check if any SalesAllocation is pending due to insufficient inventory
          const hasSalesAllocationPendingPurchase = salesAllocations.some(
            (alloc) =>
              alloc.allocation_status === "PENDING" &&
              alloc.action_required === "RAISE_PURCHASE_REQUEST",
          );

          // Check if any allocation is pending purchase due to insufficient inventory
          const hasPendingPurchase =
            allocationMasters.some(
              (alloc) => alloc.status === "PENDING_PURCHASE",
            ) || hasSalesAllocationPendingPurchase;

          // Calculate allocation status based on SalesAllocation records
          let allocation_status = "Pending";
          if (orderProducts.length > 0 && salesAllocations.length > 0) {
            // Check if all order products have allocations
            const productsWithAllocations = new Set(
              salesAllocations.map((alloc) => alloc.order_product_id),
            );

            const allocatedProductCount = orderProducts.filter((product) =>
              productsWithAllocations.has(product.id),
            ).length;

            if (allocatedProductCount === orderProducts.length) {
              // Check if all allocations are confirmed (ALLOCATED or COMPLETED)
              const confirmedAllocations = salesAllocations.filter(
                (alloc) =>
                  alloc.allocation_status === "ALLOCATED" ||
                  alloc.allocation_status === "COMPLETED",
              ).length;

              if (confirmedAllocations === salesAllocations.length) {
                // Only show as "Allocated" if no allocations are pending purchase
                allocation_status = hasPendingPurchase
                  ? "Pending Purchase"
                  : "Allocated";
              } else {
                allocation_status = "Partial";
              }
            } else if (allocatedProductCount > 0) {
              allocation_status = "Partial";
            }
          }

          // If there are pending purchase allocations, override the status
          if (hasPendingPurchase && allocation_status === "Allocated") {
            allocation_status = "Pending Purchase";
          }

          return {
            ...orderJson,
            allocation_status,
            sales_allocations: salesAllocations,
          };
        }),
      );

      resolve({
        rows: processedOrders,
        count: orders.count,
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Delete orders that have no associated products
 */
export const DeleteEmpty = ({ profile_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "User ID must not be empty!",
        });
      }

      // Find all orders created by this user
      const emptyOrders = await models.Orders.findAll({
        where: {
          is_active: true,
          created_by: profile_id,
        },
        attributes: ["id"],
        include: [
          {
            model: models.OrderProducts,
            attributes: ["id"],
            where: { is_active: true },
            required: false,
          },
        ],
        raw: false,
      });

      // Filter orders that have no products
      const ordersToDelete = emptyOrders.filter(
        (order) => !order.OrderProducts || order.OrderProducts.length === 0,
      );

      if (ordersToDelete.length === 0) {
        return resolve({
          message: "No empty orders found to delete",
          deletedCount: 0,
        });
      }

      const orderIdsToDelete = ordersToDelete.map((order) => order.id);

      // Delete the empty orders
      const deletedCount = await models.Orders.destroy({
        where: {
          id: {
            [Op.in]: orderIdsToDelete,
          },
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve({
        message: `Successfully deleted ${deletedCount} empty orders`,
        deletedCount,
      });
    } catch (err) {
      reject(err);
    }
  });
};
