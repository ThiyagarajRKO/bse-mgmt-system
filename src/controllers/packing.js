import models from "../../models";

export const Insert = async (profile_id, packing_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!packing_data?.peeled_dispatch_id) {
        return reject({
          statusCode: 420,
          message: "Dispatched product data must not be empty!",
        });
      }

      const result = await models.Packing.create(packing_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Packed data already exists!",
        });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, packing_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Packing id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!packing_data) {
        return reject({
          statusCode: 420,
          message: "Packed product data must not be empty!",
        });
      }

      const result = await models.Packing.update(packing_data, {
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
          message: "Packing Product ID field must not be empty!",
        });
      }

      const packing = await models.Packing.findOne({
        where: {
          id,
          is_active: true,
        },
      });

      resolve(packing);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({ start, length }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      let procurementLotsWhere = {
        is_active: true,
      };

      const packing_count = await models.Packing.count({
        raw: true,
        subQuery: false,
        include: [
          {
            as: "pd",
            model: models.PeeledDispatches,
            attributes: [],
            where: {
              is_active: true,
            },
            include: [
              {
                as: "pp",
                model: models.PeelingProducts,
                attributes: [],
                where: {
                  is_active: true,
                },
                include: [
                  {
                    as: "pln",
                    model: models.Peeling,
                    attributes: [],
                    where: {
                      is_active: true,
                    },
                    include: [
                      {
                        as: "dis",
                        model: models.Dispatches,
                        attributes: [],
                        where: {
                          is_active: true,
                        },
                        include: [
                          {
                            as: "pp",
                            model: models.ProcurementProducts,
                            attributes: [],
                            where: {
                              is_active: true,
                            },
                            include: [
                              {
                                as: "pl",
                                attributes: [],
                                model: models.ProcurementLots,
                                where: procurementLotsWhere,
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    model: models.ProductMaster,
                    attributes: ["id", "product_name"],
                    where: {
                      is_active: true,
                    },
                  },
                ],
              },
            ],
          },
          {
            model: models.UnitMaster,
            attributes: [],
            where: {
              is_active: true,
            },
          },
          {
            model: models.GradeMaster,
            attributes: [],
            where: {
              is_active: true,
            },
          },
          {
            model: models.SizeMaster,
            attributes: [],
            where: {
              is_active: true,
            },
          },
          {
            model: models.PackagingMaster,
            attributes: [],
            where: {
              is_active: true,
            },
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      const packing_rows = await models.Packing.findAll({
        subQuery: false,
        attributes: [
          "id",
          "created_at",
          "packing_notes",
          "packing_status",
          "packing_quantity",
          "expiry_date",
        ],
        include: [
          {
            as: "pd",
            model: models.PeeledDispatches,
            attributes: ["id", "peeled_dispatch_quantity"],
            where: {
              is_active: true,
            },
            include: [
              {
                as: "pp",
                attributes: ["id"],
                model: models.PeelingProducts,
                where: {
                  is_active: true,
                },
                include: [
                  {
                    as: "pln",
                    model: models.Peeling,
                    attributes: [],
                    where: {
                      is_active: true,
                    },
                    include: [
                      {
                        as: "dis",
                        model: models.Dispatches,
                        attributes: [],
                        where: {
                          is_active: true,
                        },
                        include: [
                          {
                            as: "pp",
                            attributes: [],
                            model: models.ProcurementProducts,
                            where: {
                              is_active: true,
                            },
                            include: [
                              {
                                as: "pl",
                                model: models.ProcurementLots,
                                attributes: [],
                                where: {
                                  is_active: true,
                                },
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    model: models.ProductMaster,
                    attributes: ["id", "product_name"],
                    where: {
                      is_active: true,
                    },
                  },
                ],
              },
            ],
          },
          {
            model: models.UnitMaster,
            attributes: ["id", "unit_code"],
            where: {
              is_active: true,
            },
          },
          {
            model: models.GradeMaster,
            attributes: ["id", "grade_name"],
            where: {
              is_active: true,
            },
          },
          {
            model: models.SizeMaster,
            attributes: ["id", "size"],
            where: {
              is_active: true,
            },
          },
          {
            model: models.PackagingMaster,
            attributes: ["id", "packaging_code"],
            where: {
              is_active: true,
            },
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
        group: [
          "Packing.id",
          "pd.id",
          "pd->pp.id",
          "pd->pp->ProductMaster.id",
          //"pd->pp->pln.id",
          "UnitMaster.id",
          "GradeMaster.id",
          "SizeMaster.id",
          "PackagingMaster.id",
        ],
      });

      let data = {
        count: packing_count,
        rows: packing_rows,
      };

      resolve(data);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetNames = ({ start, length }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const packings = await models.Packing.findAll({
        attributes: ["id", "packing_quantity"],
        where: {
          is_active: true,
        },
        include: [
          {
            attributes: ["id"],
            as: "pd",
            model: models.PeeledDispatches,
            where: { is_active: true },
            include: [
              {
                attributes: ["id"],
                as: "pp",
                model: models.PeelingProducts,
                where: { is_active: true },
                include: [
                  {
                    attributes: ["id", "product_name"],
                    model: models.ProductMaster,
                    where: { is_active: true },
                  },
                ],
              },
            ],
          },
        ],
        limit: length,
        offset: start,
        order: [["created_at", "desc"]],
      });

      resolve(packings);
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
          message: "Peeing ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const peeling = await models.PeelingProducts.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(peeling);
    } catch (err) {
      reject(err);
    }
  });
};
