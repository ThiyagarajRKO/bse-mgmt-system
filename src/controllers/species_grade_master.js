import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, species_grade_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!species_grade_master_data?.grade_name) {
        return reject({
          statusCode: 420,
          message: "Species Grade name must not be empty!",
        });
      }

      if (!species_grade_master_data?.species_master_id) {
        return reject({
          statusCode: 420,
          message: "Species master id must not be empty!",
        });
      }

      const result = await models.SpeciesGradeMaster.create(
        species_grade_master_data,
        {
          profile_id,
        }
      );
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Species Grade already exists!",
        });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, species_grade_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Species Grade id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!species_grade_master_data) {
        return reject({
          statusCode: 420,
          message: "Species Grade data must not be empty!",
        });
      }

      const result = await models.SpeciesGradeMaster.update(
        species_grade_master_data,
        {
          where: {
            id,
            is_active: true,
          },
          individualHooks: true,
        }
      );
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

export const Get = ({ id, species_grade_name }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id && !species_grade_name) {
        return reject({
          statusCode: 420,
          message: "Species Grade ID field must not be empty!",
        });
      }

      let where = {
        is_active: true,
      };

      if (id) {
        where.id = id;
      } else if (species_grade_name) {
        where.grade_name = species_grade_name;
      }

      const unit = await models.SpeciesGradeMaster.findOne({
        where,
      });

      resolve(unit);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({
  species_grade_name,
  species_master_name,
  species_master_code,
  start,
  length,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (species_grade_name) {
        where.grade_name = { [Op.iLike]: species_grade_name };
      }

      let speciesWhere = {
        is_active: true,
      };

      if (species_master_name) {
        where.species_name = { [Op.iLike]: species_master_name };
      }

      if (species_master_code) {
        where.species_code = { [Op.iLike]: species_master_code };
      }

      const units = await models.SpeciesGradeMaster.findAndCountAll({
        include: [
          {
            model: models.SpeciesMaster,
            where: speciesWhere,
          },
        ],
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
          message: "Species Grade ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const unit = await models.SpeciesGradeMaster.destroy({
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
