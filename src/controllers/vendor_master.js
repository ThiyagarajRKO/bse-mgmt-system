import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, vendor_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
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

      const result = await models.VendorMaster.create(vendor_master_data);
      resolve(result);
    } catch (err) {
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

      if (!vendor_master_data) {
        return reject({
          statusCode: 420,
          message: "Vendor data must not be empty!",
        });
      }

      vendor_master_data.updated_at = new Date();
      vendor_master_data.updated_by = profile_id;

      const result = await models.VendorMaster.update(vendor_master_data, {
        where: {
          id,
          is_active: true,
        },
      });
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

export const Get = ({ id, vendor_name }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id && !vendor_name) {
        return reject({
          statusCode: 420,
          message: "Vendor ID field must not be empty!",
        });
      }

      let where = {
        is_active: true,
      };

      if (id) {
        where.id = id;
      } else if (vendor_name) {
        where.vendor_name = vendor_name;
      }

      const vendor = await models.VendorMaster.findOne({
        where,
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
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (vendor_name) {
        where.vendor_name = { [Op.iLike]: vendor_name };
      }

      let locationWhere = {
        is_active: true,
      };

      if (location_master_name) {
        where.location_name = { [Op.iLike]: location_master_name };
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
        length,
        order: [["created_at", "desc"]],
      });

      resolve(vendors);
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

      const vendor = await models.VendorMaster.update(
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
        }
      );

      resolve(vendor);
    } catch (err) {
      reject(err);
    }
  });
};
