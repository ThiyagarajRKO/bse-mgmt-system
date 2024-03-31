"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ProductMaster extends Model {
    static associate(models) {
      ProductMaster.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      ProductMaster.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      ProductMaster.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      ProductMaster.belongsTo(models.ProductCategoryMaster, {
        foreignKey: "product_category_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      ProductMaster.belongsTo(models.SizeMaster, {
        foreignKey: "size_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  ProductMaster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      product_name: {
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
      modelName: "ProductMaster",
      tableName: "product_master",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Create Hook
  ProductMaster.beforeCreate(async (data, options) => {
    try {
      const product_category =
        await sequelize.models.ProductCategoryMaster.findOne({
          required: true,
          attribute: "product_category",
          include: [
            {
              required: true,
              attribute: "species_name",
              model: sequelize.models.SpeciesMaster,
              where: {
                is_active: true,
              },
            },
          ],
          where: { id: data?.product_category_master_id, is_active: true },
        });

      data.product_name = `${product_category?.SpeciesMaster?.species_name
        ?.trim()
        ?.replaceAll(" ", "")
        ?.toUpperCase()}-${product_category.product_category
        ?.trim()
        ?.replaceAll(" ", "")
        ?.toUpperCase()}`;

      if (data?.size_master_id) {
        const { size } = await sequelize.models.SizeMaster.findOne({
          attribute: "size",
          where: { id: data?.size_master_id, is_active: true },
        });
        data.product_name += `-${size
          ?.trim()
          ?.replaceAll(" ", "")
          ?.toUpperCase()}`;
      }

      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while inserting a product master details",
        err?.message || err
      );
    }
  });

  // Update Hook
  ProductMaster.beforeUpdate(async (data, options) => {
    try {
      const product_category =
        await sequelize.models.ProductCategoryMaster.findOne({
          required: true,
          attribute: "product_category",
          include: [
            {
              required: true,
              attribute: "species_name",
              model: sequelize.models.SpeciesMaster,
              where: {
                is_active: true,
              },
            },
          ],
          where: { id: data?.product_category_master_id, is_active: true },
        });

      data.product_name = `${product_category?.SpeciesMaster?.species_name
        ?.trim()
        ?.replaceAll(" ", "")
        ?.toUpperCase()}-${product_category.product_category
        ?.trim()
        ?.replaceAll(" ", "")
        ?.toUpperCase()}`;

      if (data?.size_master_id) {
        const { size } = await sequelize.models.SizeMaster.findOne({
          attribute: "size",
          where: { id: data?.size_master_id, is_active: true },
        });
        data.product_name += `-${size
          ?.trim()
          ?.replaceAll(" ", "")
          ?.toUpperCase()}`;
      }

      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log("Error while updating a product master", err?.message || err);
    }
  });

  // Delete Hook
  ProductMaster.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting a product master", err?.message || err);
    }
  });

  return ProductMaster;
};
