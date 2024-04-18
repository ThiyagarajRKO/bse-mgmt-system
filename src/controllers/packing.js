import { Op } from "sequelize";
import models, { sequelize } from "../../models";

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

export const GetAll = ({ start, length, search }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      let procurementLotsWhere = {
        is_active: true,
      };

      if (search) {
        where[Op.or] = [
          sequelize.where(
            sequelize.cast(sequelize.col("packing_quantity"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          { packing_notes: { [Op.iLike]: `%${search}%` } },
          sequelize.where(
            sequelize.cast(sequelize.col("packing_status"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          {
            "$PeeledDispatches->PeelingProducts->ProductMaster.product_name$": {
              [Op.iLike]: `%${search}%`,
            },
          },
          { "$UnitMaster.unit_code$": { [Op.iLike]: `%${search}%` } },
          { "$GradeMaster.grade_name$": { [Op.iLike]: `%${search}%` } },
          { "$SizeMaster.size$": { [Op.iLike]: `%${search}%` } },
          { "$PackagingMaster.packaging_code$": { [Op.iLike]: `%${search}%` } },
        ];
      }

      const packing_count = await models.Packing.count({
        raw: true,
        subQuery: false,
        include: [
          {
            model: models.PeeledDispatches,
            attributes: ["id"],
            where: {
              is_active: true,
            },
            include: [
              {
                model: models.PeelingProducts,
                attributes: ["id"],
                where: {
                  is_active: true,
                },
                include: [
                  {
                    model: models.Peeling,
                    attributes: [],
                    where: {
                      is_active: true,
                    },
                    include: [
                      {
                        model: models.Dispatches,
                        attributes: [],
                        where: {
                          is_active: true,
                        },
                        include: [
                          {
                            model: models.ProcurementProducts,
                            attributes: [],
                            where: {
                              is_active: true,
                            },
                            include: [
                              {
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
          "packing_id",
          "packing_notes",
          "packing_status",
        ],
        include: [
          {
            model: models.PeeledDispatches,
            attributes: ["id", "peeled_dispatch_quantity"],
            where: {
              is_active: true,
            },
            include: [
              {
                model: models.PeelingProducts,
                attributes: [],
                where: {
                  is_active: true,
                },
                include: [
                  {
                    model: models.Peeling,
                    attributes: [],
                    where: {
                      is_active: true,
                    },
                    include: [
                      {
                        model: models.Dispatches,
                        attributes: [],
                        where: {
                          is_active: true,
                        },
                        include: [
                          {
                            model: models.ProcurementProducts,
                            attributes: [],
                            where: {
                              is_active: true,
                            },
                            include: [
                              {
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
          "PeeledDispatches.id",
          "PeelingProduct.id",
          "PeelingProduct.ProductMaster.id",
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
export const GetQuantity = ({ id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Dispatch product ID field must not be empty!",
        });
      }

      const product = await models.PeeledDispatches.findOne({
        attributes: ["peeled_dispatch_quantity"],
        where: {
          id,
          is_active: true,
        },
      });

      resolve(product);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetDestinations = ({
  procurement_lot_id,
  start,
  length,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      let procurementLotsWhere = {
        is_active: true,
      };

      if (procurement_lot_id) {
        procurementLotsWhere.id = procurement_lot_id;
      }

      const packing = await models.Packing.findAll({
        subQuery: false,
        attributes: ["id"],
        attributes: [
          "id",
          "created_at",
          "packing_quantity",
          [
            sequelize.literal(
              `(SELECT CASE WHEN SUM(packing_quantity) IS NULL THEN 0 ELSE SUM(packing_quantity) END)`
            ),
            "packing_quantity",
          ],
        ],
        include: [
          {
            model: models.PeeledDispatches,
            attributes: ["id"],
            where: {
              is_active: true,
            },
            include: [
              {
                model: models.PeelingProducts,
                attributes: ["id"],
                where: {
                  is_active: true,
                },
                include: [
                  {
                    model: models.Peeling,
                    attributes: ["id"],
                    where: {
                      is_active: true,
                    },
                    include: [
                      {
                        model: models.Dispatches,
                        attributes: ["id"],
                        where: {
                          is_active: true,
                        },
                        include: [
                          {
                            model: models.ProcurementProducts,
                            attributes: ["id"],
                            where: {
                              is_active: true,
                            },
                            include: [
                              {
                                model: models.UnitMaster,
                                attributes: ["id", "unit_code"],

                                where: {
                                  is_active: true,
                                  unit_type: "Peeling Center",
                                },
                              },
                            ],
                            include: [
                              {
                                model: models.GradeMaster,
                                attributes: ["id", "grade_name"],

                                where: {
                                  is_active: true,
                                },
                              },
                            ],
                            include: [
                              {
                                model: models.SizeMaster,
                                attributes: ["id", "size"],

                                where: {
                                  is_active: true,
                                },
                              },
                            ],
                            include: [
                              {
                                model: models.PackagingMaster,
                                attributes: ["id", "packaging_code"],

                                where: {
                                  is_active: true,
                                },
                              },
                            ],
                            include: [
                              {
                                model: models.ProcurementLots,
                                where: procurementLotsWhere,
                                attributes: ["id", "procurement_lot"],
                                where: {
                                  is_active: true,
                                },
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
                    ],
                  },
                ],
              },
            ],
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
        group: [
          "Packing.id",
          "PeelingDispatch.id",
          "PeelingProducts.id",
          "Peeling->Dispatch.id",
          "Peeling->Dispatch->ProcurementProduct.id",
          "Peeling->Dispatch->ProcurementProduct->ProcurementLot.id",
          "Peeling->Dispatch->ProcurementProduct->ProductMaster.id",
          "Peeling.id",
          "UnitMaster.id",
          "GradeMaster.id",
          "SizeMaster.id",
          "PackagingMaster.id",
        ],
      });

      resolve(packing);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetPackingProductNames = ({
  procurement_lot_id,
  peeled_dispatch_id,
  unit_master_id,
  start = 0,
  length = 10,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      let procurementLotsWhere = {
        is_active: true,
      };

      if (procurement_lot_id) {
        procurementLotsWhere.id = procurement_lot_id;
      }

      let unitWhere = {
        is_active: true,
      };

      if (unit_master_id) {
        unitWhere.id = unit_master_id;
      }

      const peeled = await models.PeeledDispatches.findAll({
        subQuery: false,
        attributes: [
          "id",
          "packing_quantity",
          [
            sequelize.literal(
              `(SELECT CASE WHEN SUM(packing_quantity) IS NULL THEN 0 ELSE SUM(packing_quantity) END FROM packing WHERE ${
                peeled_dispatch_id != "null"
                  ? "id != '" + peeled_dispatch_id + "' and"
                  : ""
              } packing_id = "PeeledDispatch".id and packing.is_active = true)`
            ),
            "total_packing_quantity",
          ],
        ],
        include: [
          {
            required: true,
            attributes: [],
            model: models.UnitMaster,
            where: unitWhere,
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
        group: [
          "PeeledDispatches.id",
          "Peeling.id",
          "PeeledProducts.id",
          "PeeledDispatches->Peeling->PeeledProducts->ProductMaster.id",
          "PeeledDispatches->Peeling->PeeledProducts->ProductMaster->ProductCategoryMaster.id",
          // "ProcurementProduct->ProductMaster->ProductCategoryMaster->SpeciesMaster.id",
        ],
      });

      resolve(peeled);
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
