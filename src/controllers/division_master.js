import { Op } from "sequelize";
import models from "../../models";

/* -----------------------------------------------------------
   CREATE
----------------------------------------------------------- */
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
    return await models.DivisionMaster.create(
      {
        ...division_data,
        created_by: profile_id,
      },
      { profile_id }
    );
  } catch (err) {
    if (err?.name === "SequelizeUniqueConstraintError") {
      throw { statusCode: 420, message: "Division already exists!" };
    }
    throw err;
  }
};

/* -----------------------------------------------------------
   UPDATE
----------------------------------------------------------- */
export const Update = async (profile_id, id, division_data) => {
  if (!id) throw { statusCode: 420, message: "Division ID must not be empty!" };

  if (!profile_id)
    throw { statusCode: 420, message: "User ID must not be empty!" };

  if (!division_data)
    throw { statusCode: 420, message: "Division data must not be empty!" };

  const [updated] = await models.DivisionMaster.update(
    {
      ...division_data,
      updated_by: profile_id,
    },
    {
      where: { id, is_active: true },
      individualHooks: true,
      profile_id,
    }
  );

  return updated;
};

/* -----------------------------------------------------------
   GET ONE
----------------------------------------------------------- */
export const Get = async ({ id }) => {
  if (!id) throw { statusCode: 420, message: "Division ID must not be empty!" };

  return await models.DivisionMaster.findOne({
    where: { id, is_active: true },
    include: [
      {
        model: models.CompanyMaster,
        as: "company",
        attributes: ["id", "company_name"],
      },
    ],
  });
};

/* -----------------------------------------------------------
   GET ALL (FOR DATATABLES)
----------------------------------------------------------- */
export const GetAll = async ({
  start = 0,
  length = 10,
  division_name = "",
  company_name = "",
  "search[value]": searchValue = "",
}) => {
  const where = { is_active: true };

  // Filter by manual fields
  if (division_name) {
    where.division_name = { [Op.iLike]: `%${division_name}%` };
  }

  // Global DataTables Search
  if (searchValue) {
    where[Op.or] = [
      { division_name: { [Op.iLike]: `%${searchValue}%` } },
      { description: { [Op.iLike]: `%${searchValue}%` } },
      // Search inside associated company
      { "$company.company_name$": { [Op.iLike]: `%${searchValue}%` } },
    ];
  }

  const result = await models.DivisionMaster.findAndCountAll({
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

  // Get total count without filters for datatables
  const totalCount = await models.DivisionMaster.count({
    where: { is_active: true },
  });

  return {
    rows: result.rows.map((row) => row.toJSON()),
    recordsTotal: totalCount,
    recordsFiltered: result.count,
  };
};

/* -----------------------------------------------------------
   COUNT
----------------------------------------------------------- */
export const Count = async ({ id }) => {
  if (!id) throw { statusCode: 420, message: "Division ID must not be empty!" };

  return await models.DivisionMaster.count({
    where: { id, is_active: true },
  });
};

/* -----------------------------------------------------------
   DELETE
----------------------------------------------------------- */
export const Delete = async ({ profile_id, id }) => {
  if (!id) throw { statusCode: 420, message: "Division ID must not be empty!" };

  if (!profile_id)
    throw { statusCode: 420, message: "User ID must not be empty!" };

  return await models.DivisionMaster.destroy({
    where: { id, is_active: true },
    individualHooks: true,
    profile_id,
  });
};
