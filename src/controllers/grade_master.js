import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, grade_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!grade_master_data?.grade_name) {
        return reject({
          statusCode: 420,
          message: "Grade name must not be empty!",
        });
      }

      const result = await models.GradeMaster.create(grade_master_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Grade already exists!",
        });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, grade_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Grade id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!grade_master_data) {
        return reject({
          statusCode: 420,
          message: "Grade data must not be empty!",
        });
      }

      const result = await models.GradeMaster.update(grade_master_data, {
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

export const Get = ({ id, grade_name }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id && !grade_name) {
        return reject({
          statusCode: 420,
          message: "Grade ID field must not be empty!",
        });
      }

      let where = {
        is_active: true,
      };

      if (id) {
        where.id = id;
      } else if (grade_name) {
        where.grade_name = grade_name;
      }

      const unit = await models.GradeMaster.findOne({
        where,
      });

      resolve(unit);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({ grade_name, start, length }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (grade_name) {
        where.grade_name = { [Op.iLike]: grade_name };
      }

      const units = await models.GradeMaster.findAndCountAll({
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(units);
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
          message: "Grade ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const unit = await models.GradeMaster.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(unit);
    } catch (err) {
      reject(err);
    }
  });
};
