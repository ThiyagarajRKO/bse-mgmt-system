import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, division_data) => {
  if (!profile_id)
    throw { statusCode: 420, message: "User ID must not be empty!" };

  if (!division_data)
    throw { statusCode: 420, message: "Division data must not be empty!" };

  if (!division_data.division_name)
    throw { statusCode: 420, message: "Division name must not be empty!" };

  if (!division_data.company_id)
    throw { statusCode: 420, message: "Company ID must not be empty!" };

  try {
    return await models.DivisionMaster.create(division_data, {
      profile_id,
    });
  } catch (err) {
    if (err?.name === "SequelizeUniqueConstraintError") {
      throw { statusCode: 420, message: "Division already exists!" };
    }
    throw err;
  }
};

export const Update = async (profile_id, id, division_data) => {
  if (!id) throw { statusCode: 420, message: "Division ID must not be empty!" };
  if (!profile_id)
    throw { statusCode: 420, message: "User ID must not be empty!" };
  if (!division_data)
    throw { statusCode: 420, message: "Division data must not be empty!" };

  const [updated] = await models.DivisionMaster.update(division_data, {
    where: { id, is_active: true },
    individualHooks: true,
    profile_id,
  });

  return updated;
};

export const Get = async ({ id }) => {
  if (!id) throw { statusCode: 420, message: "Division ID must not be empty!" };

  return await models.DivisionMaster.findOne({
    where: { id, is_active: true },
    include: [
      { model: models.CompanyMaster, as: "company" }, // Optional
    ],
  });
};

export const GetAll = async ({
  division_name,
  start = 0,
  length = 10,
  search,
}) => {
  const where = { is_active: true };

  if (division_name) {
    where.division_name = { [Op.iLike]: `%${division_name}%` };
  }

  if (search) {
    where[Op.or] = [
      { division_name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  return await models.DivisionMaster.findAndCountAll({
    where,
    offset: Number(start),
    limit: Number(length),
    order: [["created_at", "desc"]],
    include: [
      {
        model: models.CompanyMaster,
        as: "company",
        attributes: ["id", "company_name"],
      },
    ],
  });
};
export const Count = async ({ id }) => {
  if (!id) throw { statusCode: 420, message: "Division ID must not be empty!" };

  return await models.DivisionMaster.count({
    where: { id, is_active: true },
  });
};

export const Delete = async ({ profile_id, id }) => {
  if (!id) throw { statusCode: 420, message: "Division ID must not be empty!" };
  if (!profile_id)
    throw { statusCode: 420, message: "User ID must not be empty!" };

  const result = await models.DivisionMaster.destroy({
    where: { id, is_active: true },
    individualHooks: true,
    profile_id,
  });

  return result;
};
