"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PeelingProducts extends Model {
    static associate(models) {
      PeelingProducts.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PeelingProducts.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PeelingProducts.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PeelingProducts.belongsTo(models.Peeling, {
        foreignKey: "peeling_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      /*PeelingProducts.belongsTo(models.Dispatches, {
        foreignKey: "dispatch_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });*/

      PeelingProducts.belongsTo(models.ProcurementProducts, {
        foreignKey: "product_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      PeelingProducts.belongsTo(models.ProcurementLots, {
        foreignKey: "id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PeelingProducts.belongsTo(models.ProductMaster, {
        foreignKey: "product_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PeelingProducts.hasMany(models.PeeledDispatches, {
        foreignKey: "peeled_product_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  PeelingProducts.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      yield_quantity: {
        type: DataTypes.FLOAT,
      },
      peeling_status: {
        type: DataTypes.STRING,
        defaultValue: "In Progress",
      },
      peeling_notes: {
        type: DataTypes.TEXT,
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
      modelName: "PeelingProducts",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Bulk Create Hook
  PeelingProducts.beforeBulkCreate(async (data, options) => {
    try {
      data?.map((item) => {
        item.peeling_status = item.yield_quantity ? "Completed" : "In Progress";

        item.is_active = true;

        item.created_by = options?.profile_id;
      });
    } catch (err) {
      console.log(
        "Error while appending an peeling products data",
        err?.message || err
      );
    }
  });

  // Create Hook
  PeelingProducts.beforeCreate(async (data, options) => {
    try {
      data.peeling_status = data.yield_quantity ? "Completed" : "In Progress";
      data.is_active = true;

      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while appending an peeling products data",
        err?.message || err
      );
    }
  });

  // Update Hook
  PeelingProducts.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while updating an peeling products data",
        err?.message || err
      );
    }
  });

  // Delete Hook
  PeelingProducts.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log(
        "Error while deleting an peeling products data",
        err?.message || err
      );
    }
  });

  return PeelingProducts;
};
