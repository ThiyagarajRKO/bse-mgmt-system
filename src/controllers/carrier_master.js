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

      if (!carrier_master_data?.company_id) {
        return reject({
          statusCode: 420,
          message: "Company must not be empty!",
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

export const GetAll = async ({
  start = 0,
  length = 10,
  carrier_name = "",
  carrier_country = "",
  "search[value]": searchValue = "",
}) => {
  start = Number(start) || 0;
  length = Number(length) || 10;

  const where = {
    is_active: true,
  };

  // Manual filter
  if (carrier_name) {
    where.carrier_name = { [Op.iLike]: `%${carrier_name}%` };
  }

  if (carrier_country) {
    where.carrier_country = { [Op.iLike]: `%${carrier_country}%` };
  }

  // Global search (wrapped inside AND to avoid wiping out base filters)
  if (searchValue && searchValue.trim() !== "") {
    where[Op.and] = [
      {
        [Op.or]: [
          { carrier_name: { [Op.iLike]: `%${searchValue}%` } },
          { carrier_address: { [Op.iLike]: `%${searchValue}%` } },
          { carrier_country: { [Op.iLike]: `%${searchValue}%` } },
          { carrier_phone: { [Op.iLike]: `%${searchValue}%` } },
          { carrier_email: { [Op.iLike]: `%${searchValue}%` } },
          { carrier_paymentterms: { [Op.iLike]: `%${searchValue}%` } },
          { carrier_credit: { [Op.iLike]: `%${searchValue}%` } },
        ],
      },
    ];
  }

  const result = await models.CarrierMaster.findAndCountAll({
    include: [
      {
        model: models.CompanyMaster,
        as: "company",
        attributes: ["id", "company_name"],
        required: false,
      },
    ],
    where,
    offset: start,
    limit: length,
    order: [["created_at", "desc"]],
  });

  // Get total count without filters for datatables
  const totalCount = await models.CarrierMaster.count({
    where: { is_active: true },
  });

  console.log("CarrierMaster.GetAll result:", result);

  return {
    rows: result.rows.map((row) => row.toJSON()),
    recordsTotal: totalCount,
    recordsFiltered: result.count,
  };
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
