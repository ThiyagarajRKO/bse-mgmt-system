import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, vendor_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!vendor_master_data) {
        return reject({
          statusCode: 420,
          message: "Vendor data must not be empty!",
        });
      }

      if (!vendor_master_data?.vendor_name) {
        return reject({
          statusCode: 420,
          message: "Vendor name must not be empty!",
        });
      }

      const result = await models.VendorMaster.create(vendor_master_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Vendor already exists!",
        });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, vendor_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Vendor id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!vendor_master_data) {
        return reject({
          statusCode: 420,
          message: "Vendor data must not be empty!",
        });
      }

      const result = await models.VendorMaster.update(vendor_master_data, {
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
          message: "Vendor ID field must not be empty!",
        });
      }

      const vendor = await models.VendorMaster.findOne({
        where: {
          id,
          is_active: true,
        },
      });

      resolve(vendor);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({
  start,
  length,
  vendor_name,
  location_master_name,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (vendor_name) {
        where.vendor_name = { [Op.iLike]: `%${vendor_name}%` };
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
          { vendor_name: { [Op.iLike]: `%${search}%` } },
          { address: { [Op.iLike]: `%${search}%` } },
          { representative: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { "$LocationMaster.location_name$": { [Op.iLike]: `%${search}%` } },
        ];
      }

      const vendors = await models.VendorMaster.findAndCountAll({
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

      resolve(vendors);
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
          message: "Vendor ID field must not be empty!",
        });
      }

      const vendor = await models.VendorMaster.count({
        where: {
          id,
          is_active: true,
        },
        raw: true,
      });

      resolve(vendor);
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
          message: "Vendor ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const vendor = await models.VendorMaster.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(vendor);
    } catch (err) {
      reject(err);
    }
  });
};
