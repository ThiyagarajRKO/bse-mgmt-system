"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Packing extends Model {
    static associate(models) {
      Packing.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Packing.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Packing.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Packing.belongsTo(models.PeeledDispatches, {
        as: "pd",
        foreignKey: "peeled_dispatch_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Packing.belongsTo(models.UnitMaster, {
        foreignKey: "unit_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Packing.belongsTo(models.GradeMaster, {
        foreignKey: "grade_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Packing.belongsTo(models.SizeMaster, {
        foreignKey: "size_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Packing.belongsTo(models.PackagingMaster, {
        foreignKey: "packaging_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      //hsa Many
      Packing.hasMany(models.OrderProducts, {
        foreignKey: "packing_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  Packing.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      packing_quantity: {
        type: DataTypes.FLOAT,
      },
      packing_status: {
        type: DataTypes.STRING,
      },
      packing_notes: {
        type: DataTypes.TEXT,
      },
      expiry_date: {
        type: DataTypes.DATE,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
      },
      created_at: {
        type: DataTypes.DATE,
      },
      updated_at: {
        type: DataTypes.DATE,
      },
      deleted_at: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "Packing",
      tableName: "packing",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Create Hook
  Packing.beforeCreate(async (data, options) => {
    try {
      data.created_by = options.profile_id;
    } catch (err) {
      console.log("Error while appending a packing data", err?.message || err);
    }
  });

  Packing.afterCreate(async (data, options) => {
    updateInvenoryQuantity(sequelize, data, options);
  });

  // Update Hook
  Packing.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log("Error while updating a packing data", err?.message || err);
    }
  });

  Packing.afterUpdate(async (data, options) => {
    updateInvenoryQuantity(sequelize, data, options);
  });

  // Delete Hook
  Packing.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting a packing data", err?.message || err);
    }
  });

  return Packing;
};

// Utils Functions
const updateInvenoryQuantity = async (sequelize, data, options) => {
  try {
    const packingData = await sequelize.models.Packing.findOne({
      subQuery: false,
      attributes: [
        [
          sequelize.fn("sum", sequelize.col("packing_quantity")),
          "total_quantity",
        ],
      ],
      include: [
        {
          as: "pd",
          attributes: ["id"],
          model: sequelize.models.PeeledDispatches,
          include: [
            {
              as: "pp",
              attributes: ["id", "product_master_id"],
              model: sequelize.models.PeelingProducts,
              where: {
                is_active: true,
              },
            },
          ],
          where: {
            is_active: true,
            id: data?.peeled_dispatch_id,
          },
        },
      ],
      where: {
        is_active: true,
      },
      group: ["Packing.id", "pd.id", "pd->pp.id"],
    });

    const product_master_id = packingData?.pd?.pp?.product_master_id;

    const inventoryData = await sequelize.models.SalesInventory.findOne({
      attributes: ["id"],
      where: {
        product_master_id,
        is_active: true,
      },
      raw: true,
    });

    const finalQuantity = packingData?.dataValues?.total_quantity || 0;

    if (inventoryData?.id) {
      await sequelize.models.SalesInventory.update(
        {
          quantity: finalQuantity,
          updated_at: new Date(),
          updated_by: options?.profile_id,
        },
        {
          where: {
            id: inventoryData?.id,
            is_active: true,
          },
        }
      ).catch(console.log);
    } else {
      await sequelize.models.SalesInventory.create({
        packing_id: data?.id,
        product_master_id,
        quantity: finalQuantity,
        is_active: true,
        created_by: options?.profile_id,
      }).catch(console.log);
    }
  } catch (err) {
    console.log("Error while inserting a packing data", err?.message || err);
  }
};
