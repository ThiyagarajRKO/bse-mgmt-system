import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, customer_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!customer_master_data) {
        return reject({
          statusCode: 420,
          message: "Customer data must not be empty!",
        });
      }

      if (!customer_master_data?.customer_name) {
        return reject({
          statusCode: 420,
          message: "Customer name must not be empty!",
        });
      }

      const result = await models.CustomerMaster.create(customer_master_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Customer already exists!",
        });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, customer_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Customer id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!customer_master_data) {
        return reject({
          statusCode: 420,
          message: "Customer data must not be empty!",
        });
      }

      const result = await models.CustomerMaster.update(customer_master_data, {
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
          message: "Customer ID field must not be empty!",
        });
      }

      const customer = await models.CustomerMaster.findOne({
        where: {
          id,
          is_active: true,
        },
      });

      resolve(customer);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({ start, length, customer_name, search }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (customer_name) {
        where.customer_name = { [Op.iLike]: `%${customer_name}%` };
      }

      if (search) {
        where[Op.or] = [
          { customer_name: { [Op.iLike]: `%${search}%` } },
          { customer_address: { [Op.iLike]: `%${search}%` } },
          { customer_country: { [Op.iLike]: `%${search}%` } },
          { customer_phone: { [Op.iLike]: `%${search}%` } },
          { customer_email: { [Op.iLike]: `%${search}%` } },
          { customer_paymentterms: { [Op.iLike]: `%${search}%` } },
          { customer_credit: { [Op.iLike]: `%${search}%` } },
          { customer_type: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const customers = await models.CustomerMaster.findAndCountAll({
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(customers);
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
          message: "Customer ID field must not be empty!",
        });
      }

      const customer = await models.CustomerMaster.count({
        where: {
          id,
          is_active: true,
        },
        raw: true,
      });

      resolve(customer);
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
          message: "Customer ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const customer = await models.CustomerMaster.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(customer);
    } catch (err) {
      reject(err);
    }
  });
};
