import { Op } from "sequelize";
import models, { sequelize } from "../../models";
import procurementLotsRoute from "../routes/procurement_lots";

export const Insert = async (profile_id, procurement_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!procurement_data?.vendor_master_id) {
        return reject({
          statusCode: 420,
          message: "Vendor master id must not be empty!",
        });
      }

      if (!procurement_data?.product_master_id) {
        return reject({
          statusCode: 420,
          message: "Product master id must not be empty!",
        });
      }

      if (!procurement_data?.procurement_product_type) {
        return reject({
          statusCode: 420,
          message: "Purchase Type must not be empty!",
        });
      }

      if (!procurement_data?.procurement_quantity) {
        return reject({
          statusCode: 420,
          message: "Purchase Quantity must not be empty!",
        });
      }

      if (!procurement_data?.procurement_price) {
        return reject({
          statusCode: 420,
          message: "Purchase Price must not be empty!",
        });
      }

      if (!procurement_data?.procurement_purchaser) {
        return reject({
          statusCode: 420,
          message: "Purchaser must not be empty!",
        });
      }

      const result = await models.ProcurementProducts.create(procurement_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({ statusCode: 420, message: "Purchase already exists!" });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, procurement_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Purchase id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!procurement_data) {
        return reject({
          statusCode: 420,
          message: "Purchase data must not be empty!",
        });
      }

      const result = await models.ProcurementProducts.update(procurement_data, {
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
          message: "Procurement product ID field must not be empty!",
        });
      }

      const unit = await models.ProcurementProducts.findOne({
        include: [
          {
            model: models.ProcurementLots,
            where: {
              is_active: true,
            },
          },
          {
            model: models.VendorMaster,
            where: {
              is_active: true,
            },
          },
          {
            model: models.ProductMaster,
            where: {
              is_active: true,
            },
          },
          {
            required: false,
            model: models.Dispatches,
            include: [
              {
                model: models.UnitMaster,
                where: {
                  is_active: true,
                },
              },
              {
                model: models.VehicleMaster,
                where: {
                  is_active: true,
                },
              },
              {
                model: models.DriverMaster,
                where: {
                  is_active: true,
                },
              },
            ],
            where: {
              is_active: true,
            },
          },
        ],
        where: {
          id,
          is_active: true,
        },
      });

      resolve(unit);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetQuantity = ({ id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Procurement product ID field must not be empty!",
        });
      }

      const product = await models.ProcurementProducts.findOne({
        attributes: ["procurement_quantity"],
        where: {
          id,
          is_active: true,
        },
      });

      resolve(product);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({
  procurement_lot,
  product_master_name,
  procurement_product_type,
  procurement_quantity,
  procurement_price,
  procurement_totalamount,
  procurement_purchaser,
  start,
  length,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (procurement_product_type) {
        where.procurement_product_type = {
          [Op.iLike]: procurement_product_type,
        };
      }

      if (procurement_quantity) {
        where.procurement_quantity = { [Op.iLike]: procurement_quantity };
      }

      if (procurement_price) {
        where.procurement_price = { [Op.iLike]: procurement_price };
      }

      if (procurement_totalamount) {
        where.procurement_totalamount = { [Op.iLike]: procurement_totalamount };
      }

      if (procurement_purchaser) {
        where.procurement_purchaser = { [Op.iLike]: procurement_purchaser };
      }

      let productWhere = {
        is_active: true,
      };

      if (product_master_name) {
        productWhere.product_name = { [Op.iLike]: product_master_name };
      }

      let procurementWhere = {
        is_active: true,
      };

      if (procurement_lot) {
        procurementWhere.procurement_lot = procurement_lot;
      }

      const procurements = await models.ProcurementProducts.findAndCountAll({
        include: [
          {
            model: models.ProcurementLots,
            include: [
              {
                model: models.UnitMaster,
                where: {
                  is_active: true,
                },
              },
            ],
            where: procurementWhere,
          },
          {
            model: models.VendorMaster,
            where: {
              is_active: true,
            },
          },
          {
            model: models.ProductMaster,
            where: productWhere,
          },
          {
            required: false,
            model: models.Dispatches,
            include: [
              {
                model: models.UnitMaster,
                where: {
                  is_active: true,
                },
              },
              {
                model: models.VehicleMaster,
                where: {
                  is_active: true,
                },
              },
              {
                model: models.DriverMaster,
                where: {
                  is_active: true,
                },
              },
            ],
            where: {
              is_active: true,
            },
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(procurements);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetNames = ({ procurement_lot_id, start, length, search }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      let procurementLotsWhere = {
        is_active: true,
      };

      if (procurement_lot_id) {
        procurementLotsWhere.id = procurement_lot_id;
      }
      // where[Op.and] = [sequelize.literal(`(SELECT "sumA" > "sumB")`)];

      const procurements = await models.ProcurementProducts.findAll({
        attributes: ["id", "procurement_product_type", "procurement_quantity"],
        include: [
          {
            attributes: [],
            model: models.ProcurementLots,
            where: procurementLotsWhere,
          },
          {
            attributes: ["id", "product_name"],
            model: models.ProductMaster,
            where: {
              is_active: true,
            },
          },
          {
            attributes: ["id", "vendor_name"],
            model: models.VendorMaster,
            where: {
              is_active: true,
            },
          },
          {
            required: false,
            model: models.Dispatches,
            where: {
              is_active: true,
            },
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
        group: [
          "ProcurementProducts.id",
          "ProductMaster.id",
          "VendorMaster.id",
          "Dispatches.id",
        ],
      });

      resolve(procurements);
    } catch (err) {
      reject(err);
    }
  });
};

export const Count = ({
  id,
  procurement_lot_id,
  product_master_id,
  vendor_master_id,
  procurement_product_type,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (id) {
        where.id = id;
      }

      if (procurement_lot_id) {
        where.procurement_lot_id = procurement_lot_id;
      }

      if (vendor_master_id) {
        where.vendor_master_id = vendor_master_id;
      }

      if (product_master_id) {
        where.product_master_id = product_master_id;
      }

      if (procurement_product_type) {
        where.procurement_product_type = procurement_product_type;
      }

      const unit = await models.ProcurementProducts.count({
        where,
        raw: true,
      });

      resolve(unit);
    } catch (err) {
      reject(err);
    }
  });
};

export const CheckLot = ({
  id,
  procurement_lot_id,
  product_master_id,
  procurement_product_type,
  vendor_master_id,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const lot = await models.ProcurementProducts.count({
        where: {
          product_master_id,
          procurement_product_type,
          vendor_master_id,
          procurement_lot_id,
          id: {
            [Op.ne]: id,
          },
        },
        raw: true,
      });

      resolve(lot);
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
          message: "Purchase ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const procurement = await models.ProcurementProducts.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(procurement);
    } catch (err) {
      reject(err);
    }
  });
};
