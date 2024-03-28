import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, packaging_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!packaging_data) {
        return reject({
          statusCode: 420,
          message: "Packaging data must not be empty!",
        });
      }

      if (!packaging_data?.packaging_type) {
        return reject({
          statusCode: 420,
          message: "Packaging type must not be empty!",
        });
      }

      if (!packaging_data?.packaging_material_composition) {
        return reject({
          statusCode: 420,
          message: "Packaging Width must not be empty!",
        });
      }
      if (!packaging_data?.vendor_master_id) {
        return reject({
          statusCode: 420,
          message: "Vendor master id must not be empty!",
        });
      }

      const result = await models.PackagingMaster.create(packaging_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Packaging data already exists!",
        });
      }

      reject(err);
    }
  });
};

export const Update = async (profile_id, id, packaging_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Packaging master id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!packaging_data) {
        return reject({
          statusCode: 420,
          message: "Packaging data must not be empty!",
        });
      }

      packaging_data.updated_at = new Date();
      packaging_data.updated_by = profile_id;
      const result = await models.PackagingMaster.update(packaging_data, {
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
          message: "Packaging Master ID field must not be empty!",
        });
      }

      const packaging = await models.PackagingMaster.findOne({
        where: {
          id,
          is_active: true,
        },
      });

      resolve(packaging);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({
  packaging_code,
  packaging_type,
  packaging_height,
  packaging_width,
  packaging_length,
  packaging_weight,
  packaging_material_composition,
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

      if (packaging_code) {
        where.packaging_code = { [Op.iLike]: `%${packaging_code}%` };
      }

      if (packaging_type) {
        where.packaging_type = { [Op.iLike]: `%${packaging_type}%` };
      }

      if (packaging_length) {
        where.packaging_length = { [Op.iLike]: `%${packaging_length}%` };
      }

      if (packaging_width) {
        where.packaging_width = { [Op.iLike]: `%${packaging_width}%` };
      }

      if (packaging_height) {
        where.packaging_height = { [Op.iLike]: `%${packaging_height}%` };
      }
      if (packaging_weight) {
        where.packaging_weight = { [Op.iLike]: `%${packaging_weight}%` };
      }

      if (packaging_material_composition) {
        where.packaging_material_composition = {
          [Op.iLike]: `%${packaging_material_composition}%`,
        };
      }

      let vendorWhere = {
        is_active: true,
      };

      if (vendor_master_name) {
        vendorWhere.vendor_name = { [Op.iLike]: `%${vendor_master_name}%` };
      }

      if (search) {
        where[Op.or] = [
          { packaging_code: { [Op.iLike]: `%${search}%` } },
          // { packaging_type: { [Op.iLike]: `%${search}%` } },
          // { packaging_length: { [Op.iLike]: `%${search}%` } },
          // { packaging_width: { [Op.iLike]: `%${search}%` } },
          // { packaging_height: { [Op.iLike]: `%${search}%` } },
          // { packaging_weight: { [Op.iLike]: `%${search}%` } },
          // { packaging_material_composition: { [Op.iLike]: `%${search}%` } },
          { "$VendorMaster.vendor_name$": { [Op.iLike]: `%${search}%` } },
        ];
      }

      const packagings = await models.PackagingMaster.findAndCountAll({
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

      resolve(packagings);
    } catch (err) {
      reject(err);
    }
  });
};

export const Count = ({ id, packaging_code }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Packaging Master ID field must not be empty!",
        });
      }

      const packaging = await models.PackagingMaster.count({
        where: {
          id,
          is_active: true,
        },
        raw: true,
      });

      resolve(packaging);
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
          message: "Packaging ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const packaging = await models.PackagingMaster.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(packaging);
    } catch (err) {
      reject(err);
    }
  });
};
