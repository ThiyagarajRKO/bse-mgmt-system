import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, carrier_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!carrier_master_data) {
        return reject({
          statusCode: 420,
          message: "Carrier data must not be empty!",
        });
      }

      if (!carrier_master_data?.carrier_name) {
        return reject({
          statusCode: 420,
          message: "Carrier name must not be empty!",
        });
      }

      const result = await models.CarrierMaster.create(carrier_master_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Carrier already exists!",
        });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, carrier_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Carrier id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!carrier_master_data) {
        return reject({
          statusCode: 420,
          message: "Carrier data must not be empty!",
        });
      }

      const result = await models.CarrierMaster.update(carrier_master_data, {
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
          message: "Carrier ID field must not be empty!",
        });
      }

      const carrier = await models.CarrierMaster.findOne({
        where: {
          id,
          is_active: true,
        },
      });

      resolve(carrier);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({ start, length, carrier_name, search }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (carrier_name) {
        where.carrier_name = { [Op.iLike]: `%${carrier_name}%` };
      }

      if (search) {
        where[Op.or] = [
          { carrier_name: { [Op.iLike]: `%${search}%` } },
          { carrier_address: { [Op.iLike]: `%${search}%` } },
          { carrier_country: { [Op.iLike]: `%${search}%` } },
          { carrier_phone: { [Op.iLike]: `%${search}%` } },
          { carrier_email: { [Op.iLike]: `%${search}%` } },
          { carrier_paymentterms: { [Op.iLike]: `%${search}%` } },
          { carrier_credit: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const carriers = await models.CarrierMaster.findAndCountAll({
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(carriers);
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
          message: "Carrier ID field must not be empty!",
        });
      }

      const carrier = await models.CarrierMaster.count({
        where: {
          id,
          is_active: true,
        },
        raw: true,
      });

      resolve(carrier);
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
          message: "Carrier ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const carrier = await models.CarrierMaster.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(carrier);
    } catch (err) {
      reject(err);
    }
  });
};
