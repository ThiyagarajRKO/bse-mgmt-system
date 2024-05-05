import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, shipping_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!shipping_data.carrier_master_id) {
        return reject({
          statusCode: 420,
          message: "Carrier master id must not be empty!",
        });
      }

      if (!shipping_data) {
        return reject({
          statusCode: 420,
          message: "Shipping data must not be empty!",
        });
      }

      const result = await models.ShippingMaster.create(shipping_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({ statusCode: 420, message: "Shipping already exists!" });
      }

      reject(err);
    }
  });
};

export const Update = async (profile_id, id, shipping_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Shipping id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!shipping_data) {
        return reject({
          statusCode: 420,
          message: "Shipping data must not be empty!",
        });
      }

      const result = await models.ShippingMaster.update(shipping_data, {
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
          message: "Shipping ID field must not be empty!",
        });
      }

      const shipping = await models.ShippingMaster.findOne({
        where: {
          id,
          is_active: true,
        },
      });

      resolve(shipping);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({
  shipping_carrier_name,
  shipping_source,
  shipping_destination,
  shipping_price,
  shipping_notes,
  start,
  length,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (shipping_source) {
        where.shipping_source = { [Op.iLike]: `%${shipping_source}%` };
      }

      if (shipping_destination) {
        where.shipping_destination = {
          [Op.iLike]: `%${shipping_destination}%`,
        };
      }

      let carrierWhere = {
        is_active: true,
      };

      if (search) {
        where[Op.or] = [
          { shipping_source: { [Op.iLike]: `%${search}%` } },
          { shipping_destination: { [Op.iLike]: `%${search}%` } },
          { "$CarrierMaster.carrier_name$": { [Op.iLike]: `%${search}%` } },
          { "$CarrierMaster.carrier_country$": { [Op.iLike]: `%${search}%` } },
        ];
      }

      const shippings = await models.ShippingMaster.findAndCountAll({
        include: [
          {
            model: models.CarrierMaster,
            where: carrierWhere,
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(shippings);
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
          message: "Shipping ID field must not be empty!",
        });
      }

      const shipping = await models.ShippingMaster.count({
        where: {
          id,
          is_active: true,
        },
        raw: true,
      });

      resolve(shipping);
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
          message: "Shipping ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const shipping = await models.ShippingMaster.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(shipping);
    } catch (err) {
      reject(err);
    }
  });
};
