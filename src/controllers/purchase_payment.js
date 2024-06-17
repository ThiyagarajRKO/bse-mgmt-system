import { Op } from "sequelize";
const sequelize = require("sequelize");
import models from "../../models";

export const Insert = async (profile_id, purchse_payment_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!purchse_payment_data) {
        return reject({
          statusCode: 420,
          message: "Purchase Payment data must not be empty!",
        });
      }

      if (!purchase_payment_data?.supplier_master_id) {
        return reject({
          statusCode: 420,
          message: "Supplier data must not be empty!",
        });
      }

      if (!purchase_payment_data?.procurement_lots) {
        return reject({
          statusCode: 420,
          message: "Procurement Lot must not be empty!",
        });
      }

      if (!purchase_payment_data?.total_amount) {
        return reject({
          statusCode: 420,
          message: "Total Amount must not be empty!",
        });
      }

      if (!purchase_payment_data?.net_amount) {
        return reject({
          statusCode: 420,
          message: "Net Amount must not be empty!",
        });
      }

      if (!purchase_payment_data?.tax_amount) {
        return reject({
          statusCode: 420,
          message: "Tax Amount must not be empty!",
        });
      }

      if (!purchase_payment_data?.due_amount) {
        return reject({
          statusCode: 420,
          message: "Due Amount must not be empty!",
        });
      }

      const result = await models.PurchasePayment.create(purchase_payment_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Purchase Payment data already exists!",
        });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "purchase Payment id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!purchase_payment_data) {
        return reject({
          statusCode: 420,
          message: "purchase Payment data must not be empty!",
        });
      }

      const result = await models.PurchasePayment.update(purchase_payment_data, {
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
          message: "Purchase Payment ID field must not be empty!",
        });
      }

      const vehicle = await models.PurchasePayment.findOne({
        where: {
          id,
          is_active: true,
        },
      });

      resolve(vehicle);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({
  start,
  length,
  supplier_master_id,
    procurement_lots,
    payment_method,
    discount,
    total_paid,
    net_amount,
    penalty,
    tax_percentage,
    tax_amount,
    due_amount,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (supplier_master_id) {
        where.supplier_master_id = { [Op.iLike]: `%${supplier_master_id}%` };
      }

      if (procurement_lots) {
        where.procurement_lots = { [Op.iLike]: `%${procurement_lots}%` };
      }

      if (payment_method) {
        where.payment_method = { [Op.iLike]: `%${payment_method}%` };
      }

      if (total_paid) {
        where.total_paid = { [Op.iLike]: `%${total_paid}%` };
      }

      if (net_amount) {
        where.net_amount = { [Op.iLike]: `%${net_amount}%` };
      }

      if (penalty) {
        where.penalty = { [Op.iLike]: `%${penalty}%` };
      }

      if (tax_percentage) {
        where.tax_percentage = { [Op.iLike]: `%${tax_percentage}%` };
      }

      if (tax_amount) {
        where.tax_amount = { [Op.iLike]: `%${tax_amount}%` };
      }

      if (due_amount) {
        where.due_amount = { [Op.iLike]: `%${due_amount}%` };
      }




      if (search) {
        where[Op.or] = [
          { supplier_master_id: { [Op.iLike]: `%${search}%` } },
          { procurement_lots: { [Op.iLike]: `%${search}%` } },
          { payment_method: { [Op.iLike]: `%${search}%` } },
          { total_paid: { [Op.iLike]: `%${search}%` } },
          { net_amount: { [Op.iLike]: `%${search}%` } },
          { penalty: { [Op.iLike]: `%${search}%` } },
          { tax_percentage: { [Op.iLike]: `%${search}%` } },
          { tax_amount: { [Op.iLike]: `%${search}%` } },
          { due_amount: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const purchase_payments = await models.PurchasePayment.findAndCountAll({
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(purchase_payments);
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
          message: "Purchase Payment ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const purchase_payment = await models.PurchasePayment.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(purchase_payment);
    } catch (err) {
      reject(err);
    }
  });
};
