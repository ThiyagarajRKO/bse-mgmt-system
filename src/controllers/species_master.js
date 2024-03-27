import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, species_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!species_data) {
        return reject({
          statusCode: 420,
          message: "Species data must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!species_data?.species_name) {
        return reject({
          statusCode: 420,
          message: "Species name must not be empty!",
        });
      }

      const result = await models.SpeciesMaster.create(species_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({ statusCode: 420, message: "Species already exists!" });
      }

      reject(err);
    }
  });
};

export const Update = async (profile_id, id, species_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Species id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!species_data) {
        return reject({
          statusCode: 420,
          message: "Species data must not be empty!",
        });
      }

      const result = await models.SpeciesMaster.update(species_data, {
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

export const Get = ({ id, species_code }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Species ID field must not be empty!",
        });
      }

      let where = {
        is_active: true,
      };

      if (id) {
        where.id = id;
      } else if (species_code) {
        where.species_code = species_code;
      }

      const species = await models.SpeciesMaster.findOne({
        where,
      });

      resolve(species);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({
  species_code,
  species_name,
  scientific_name,
  start,
  length,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (species_name) {
        where.species_name = { [Op.iLike]: species_name };
      }

      if (species_code) {
        where.species_code = { [Op.iLike]: species_code };
      }

      if (scientific_name) {
        where.scientific_name = { [Op.iLike]: scientific_name };
      }

      const vendors = await models.SpeciesMaster.findAndCountAll({
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

export const Count = ({ id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Species ID field must not be empty!",
        });
      }

      const species = await models.SpeciesMaster.count({
        where: {
          id,
          is_active: true,
        },
        raw: true,
      });

      resolve(species);
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
          message: "Species ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const vendor = await models.SpeciesMaster.destroy({
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
