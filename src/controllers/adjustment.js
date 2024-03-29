import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, adjustment_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }


      if (!adjustment_data?.procurement_id) {
        return reject({
          statusCode: 420,
          message: "Purchase id must not be empty!",
        });
      }

      if (!adjustment_data?.adjusted_quantity) {
        return reject({
          statusCode: 420,
          message: "Adjusted quantity must not be empty!",
        });
      }

      if (!adjustment_data?.adjustment_reason) {
        return reject({
          statusCode: 420,
          message: "Reason for adjustment must not be empty!",
        });
      }

      if (!adjustment_data?.adjustment_surveyor) {
        return reject({
          statusCode: 420,
          message: "Quality Surveyor must not be empty!",
        });
      }

      if (!adjustment_data?.adjusted_price) {
        return reject({
          statusCode: 420,
          message: "Purchase Price must not be empty!",
        });
      }

      const result = await models.Adjustment.create(adjustment_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({ statusCode: 420, message: "This Adjustment already exists!" });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, adjustment_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Purchase id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!adjustment_data) {
        return reject({
          statusCode: 420,
          message: "Purchase data must not be empty!",
        });
      }

      const result = await models.Adjustment.update(adjustment_data, {
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
          message: "Adjustment id field must not be empty!",
        });
      }

      const adjust = await models.Adjustment.findOne({
        where: {
          id,
          is_active: true,
        },
      });

      resolve(adjust);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({
  purchase_lot,
  purchase_product,
  purchase_quantity,
  purchase_price,
  adjusted_quantity,
  adjusted_price,
  adjustment_reason,
  adjustment_surveyor,
  start,
  length,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (purchase_lot) {
        where.purchase_lot = { [Op.iLike]: purchase_lot };
      }

      if (purchase_product) {
        where.purchase_product = { [Op.iLike]: purchase_product };
      }

      if (purchase_quantity) {
        where.purchase_quantity = { [Op.iLike]: purchase_quantity };
      }

      if (purchase_quantity) {
        where.purchase_quantity = { [Op.iLike]: purchase_quantity };
      }

      if (purchase_price) {
        where.purchase_price = { [Op.iLike]: purchase_price };
      }

      if (adjusted_quantity) {
        where.adjusted_quantity = { [Op.iLike]: adjusted_quantity };
      }
      if (adjusted_price) {
        where.adjusted_price = { [Op.iLike]: adjusted_price };
      }
      if (adjustment_reason) {
        where.adjustment_reason = { [Op.iLike]: adjustment_reason };
      }
      if (adjustment_surveyor) {
        where.adjustment_surveyor = { [Op.iLike]: adjustment_surveyor };
      }

      let purchaseWhere = {
        is_active: true,
      };

      if (purchase_lot) {
        purchaseWhere.purchase_lot = { [Op.iLike]: purchase_lot };
      }

      if (purchase_product) {
        purchaseWhere.purchase_product = { [Op.iLike]: purchase_product };
      }

      if (purchase_quantity) {
        purchaseWhere.purchase_quantity = { [Op.iLike]: purchase_quantity };
      }

      if (purchase_price) {
        purchaseWhere.purchase_price = { [Op.iLike]: purchase_price };
      }

      const adjustments = await models.Adjustment.findAndCountAll({
        include: [
          {
            model: models.Procurement,
            where: purchaseWhere,
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(adjustments);
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
          message: "Adjustment ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const adjustment = await models.Adjustment.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(adjustment);
    } catch (err) {
      reject(err);
    }
  });
};
