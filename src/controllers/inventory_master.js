import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, inventory_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!inventory_master_data?.inventory_name) {
        return reject({
          statusCode: 420,
          message: "inventory name must not be empty!",
        });
      }

      if (!inventory_master_data?.inventory_uom) {
        return reject({
          statusCode: 420,
          message: "inventory unit of measure must not be empty!",
        });
      }

      if (!inventory_master_data?.inventory_category) {
        return reject({
          statusCode: 420,
          message: "inventory category must not be empty!",
        });
      }

      if (!inventory_master_data?.vendor_master_id) {
        return reject({
          statusCode: 420,
          message: "Vendor master id must not be empty!",
        });
      }

      const result = await models.InventoryMaster.create(
        inventory_master_data,
        {
          profile_id,
        }
      );
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "inventory already exists!",
        });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, inventory_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "inventory id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!inventory_master_data) {
        return reject({
          statusCode: 420,
          message: "inventory data must not be empty!",
        });
      }

      const result = await models.InventoryMaster.update(
        inventory_master_data,
        {
          where: {
            id,
            is_active: true,
          },
          individualHooks: true,
        }
      );
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

export const Get = ({ id, inventory_name }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id && !inventory_name) {
        return reject({
          statusCode: 420,
          message: "inventory ID field must not be empty!",
        });
      }

      const inventory = await models.inventoryMaster.findOne({
        where: {
          id,
          is_active: true,
        },
      });

      resolve(inventory);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({
  inventory_name,
  inventory_uom,
  inventory_category,
  vendor_master_name,
  start,
  length,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (inventory_name) {
        where.inventory_name = { [Op.iLike]: `%${inventory_name}%` };
      }

      if (inventory_uom) {
        where.inventory_uom = { [Op.iLike]: `%${inventory_uom}%` };
      }

      if (inventory_category) {
        where.inventory_category = { [Op.iLike]: `%${inventory_category}%` };
      }

      let vendorWhere = {
        is_active: true,
      };

      if (vendor_master_name) {
        vendorWhere.vendor_name = { [Op.iLike]: `%${vendor_master_name}%` };
      }

      if (search) {
        where[Op.or] = [
          { inventory_name: { [Op.iLike]: `%${search}%` } },
          { inventory_uom: { [Op.iLike]: `%${search}%` } },
          // { inventory_category: { [Op.iLike]: `%${search}%` } },
        ];

        // vendorWhere.vendor_name = {
        //   [Op.iLike]: `%${search}%`,
        // };
      }

      const inventories = await models.InventoryMaster.findAndCountAll({
        include: [
          {
            model: models.VendorMaster,
            where: vendorWhere,
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(inventories);
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
          message: "Inventory ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const inventory = await models.InventoryMaster.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(inventory);
    } catch (err) {
      reject(err);
    }
  });
};
