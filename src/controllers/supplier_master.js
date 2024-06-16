import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, supplier_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!supplier_master_data) {
        return reject({
          statusCode: 420,
          message: "Supplier data must not be empty!",
        });
      }

      if (!supplier_master_data?.supplier_name) {
        return reject({
          statusCode: 420,
          message: "Supplier name must not be empty!",
        });
      }

      const result = await models.SupplierMaster.create(supplier_master_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Supplier already exists!",
        });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, supplier_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Supplier id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!supplier_master_data) {
        return reject({
          statusCode: 420,
          message: "Supplier data must not be empty!",
        });
      }

      const result = await models.SupplierMaster.update(supplier_master_data, {
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
          message: "Supplier ID field must not be empty!",
        });
      }

      const supplier = await models.SupplierMaster.findOne({
        where: {
          id,
          is_active: true,
        },
      });

      resolve(supplier);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({
  start,
  length,
  supplier_name,
  location_master_name,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (supplier_name) {
        where.supplier_name = { [Op.iLike]: `%${supplier_name}%` };
      }

      let locationWhere = {
        is_active: true,
      };

      if (location_master_name) {
        locationWhere.location_name = {
          [Op.iLike]: `%${location_master_name}%`,
        };
      }

      if (search) {
        where[Op.or] = [
          { supplier_name: { [Op.iLike]: `%${search}%` } },
          { address: { [Op.iLike]: `%${search}%` } },
          { representative: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { "$LocationMaster.location_name$": { [Op.iLike]: `%${search}%` } },
        ];
      }

      const suppliers = await models.SupplierMaster.findAndCountAll({
        include: [
          {
            model: models.LocationMaster,
            where: locationWhere,
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

export const Count = ({ id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Supplier ID field must not be empty!",
        });
      }

      const supplier = await models.SupplierMaster.count({
        where: {
          id,
          is_active: true,
        },
        raw: true,
      });

      resolve(supplier);
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
          message: "Supplier ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const supplier = await models.SupplierMaster.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(supplier);
    } catch (err) {
      reject(err);
    }
  });
};
