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

      if (!adjustment_data?.adjustment_id) {
        return reject({
          statusCode: 420,
          message: "Adjustment id must not be empty!",
        });
      }
      if (!adjustment_data?.procurement_id) {
        return reject({
          statusCode: 420,
          message: "Adjustment id must not be empty!",
        });
      }

      if (!adjustment_data?.adjustment_adjusted_quantity) {
        return reject({
          statusCode: 420,
          message: "Adjusted quantity must not be empty!",
        });
      }
      if (!adjustment_data?.adjustment_adjusted_price) {
        return reject({
          statusCode: 420,
          message: "Adjusted Price must not be empty!",
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
  procurement_lot,
  procurement_product,
  procurement_quantity,
  procurement_price,
  adjustment_adjusted_quantity,
  adjustment_adjusted_price,
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

      if (procurement_product) {
        where.procurement_product = { [Op.iLike]: procurement_product };
      }

      if (procurement_quantity) {
        where.procurement_quantity = { [Op.iLike]: procurement_quantity };
      }

      if (adjustment_adjusted_quantity) {
        where.adjustment_adjusted_quantity = { [Op.iLike]: adjustment_adjusted_quantity };
      }

      if (procurement_price) {
        where.procurement_price = { [Op.iLike]: procurement_price };
      }
      if (adjustment_adjusted_price) {
        where.adjustment_adjusted_price = { [Op.iLike]: adjustment_adjusted_price };
      }
      if (adjustment_reason) {
        where.adjustment_reason = { [Op.iLike]: adjustment_reason };
      }
      if (adjustment_surveyor) {
        where.adjustment_surveyor = { [Op.iLike]: adjustment_surveyor };
      }

      let procurementWhere = {
        is_active: true,
      };

      if (procurement_lot) {
        procurementWhere.procurement_lot = { [Op.iLike]: procurement_lot };
      }

      if (procurement_product) {
        procurementWhere.procurement_product = { [Op.iLike]: procurement_quantity };
      }

      if (procurement_quantity) {
        procurementWhere.procurement_quantity = { [Op.iLike]: procurement_quantity };
      }

      if (procurement_price) {
        procurementWhere.procurement_price = { [Op.iLike]: procurement_price };
      }

      const adjustments = await models.Adjustment.findAndCountAll({
        include: [
          {
            model: models.Procurement,
            where: procurementWhere,
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

export const Count = ({ id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Adjustment ID field must not be empty!",
        });
      }

      const adjustment = await models.Adjustment.count({
        where: {
          is_active: true,
          id,
        },
      });

      resolve(adjustment);
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
