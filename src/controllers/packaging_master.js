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

      if (!packaging_data?.packaging_height) {
        return reject({
          statusCode: 420,
          message: "Package height number must not be empty!",
        });
      }

      if (!packaging_data?.packaging_width) {
        return reject({
          statusCode: 420,
          message: "Packaging width must not be empty!",
        });
      }

      if (!packaging_data?.packaging_length) {
        return reject({
          statusCode: 420,
          message: "Packaging Length must not be empty!",
        });
      }
      if (!packaging_data?.packaging_material_composition) {
        return reject({
          statusCode: 420,
          message: "Packaging Width must not be empty!",
        });
      }
      if (!packaging_data?.packaging_supplier) {
        return reject({
          statusCode: 420,
          message: "Packaging Supplier must not be empty!",
        });
      }

      const result = await models.PackagingMaster.create(packaging_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
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
  packaging_name,
  packaging_type,
  packaging_height,
  packaging_width,
  packaging_length,
  packaging_supplier,
  start,
  length,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (packaging_name) {
        where.packaging_name = { [Op.iLike]: packaging_name };
      }

      if (packaging_type) {
        where.packaging_type = { [Op.iLike]: packaging_type };
      }

      if (packaging_length) {
        where.packaging_length = { [Op.iLike]: packaging_length };
      }

      if (packaging_width) {
        where.packaging_width = { [Op.iLike]: packaging_width };
      }

      if (packaging_supplier) {
        where.packaging_supplier = { [Op.iLike]: packaging_supplier };
      }

      const vendors = await models.PackagingMaster.findAndCountAll({
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

      const vendor = await models.PackagingMaster.destroy({
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
