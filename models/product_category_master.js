"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ProductCategoryMaster extends Model {
    static associate(models) {
      ProductCategoryMaster.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      ProductCategoryMaster.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      ProductCategoryMaster.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      ProductCategoryMaster.belongsTo(models.SpeciesMaster, {
        foreignKey: "species_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      // Association with ProductCategoryGradeMapping
      ProductCategoryMaster.hasMany(models.ProductCategoryGradeMapping, {
        foreignKey: "product_category_master_id",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }
  }
  ProductCategoryMaster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      product_category: {
        type: DataTypes.STRING,
      },
      parent_category_type: {
        type: DataTypes.ENUM(
          "Bivalve",
          "Cephalopod",
          "Fish",
          "Crustacean",
          "Gastropod",
          "Other"
        ),
        allowNull: true,
        comment: "Parent category type inherited from species_master",
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
      modelName: "ProductCategoryMaster",
      tableName: "product_category_master",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Create Hook - Populate parent_category_type from species_master
  ProductCategoryMaster.beforeCreate(async (data, options) => {
    try {
      data.created_by = options.profile_id;

      // If species_master_id is provided, fetch parent_category_type from species
      if (data.species_master_id) {
        const species = await sequelize.models.SpeciesMaster.findOne({
          where: { id: data.species_master_id, is_active: true },
          attributes: ["id", "parent_category_type"],
          raw: true,
        });

        if (species && species.parent_category_type) {
          data.parent_category_type = species.parent_category_type;
          console.log(
            `[ProductCategoryMaster.beforeCreate] Mapped parent_category_type: ${species.parent_category_type}`
          );
        }
      }
    } catch (err) {
      console.log(
        "Error while inserting a category details",
        err?.message || err
      );
    }
  });

  // Update Hook - Sync parent_category_type from species_master if species_master_id changes
  ProductCategoryMaster.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options?.profile_id;

      // If species_master_id is being updated, refresh parent_category_type
      if (data.species_master_id) {
        const species = await sequelize.models.SpeciesMaster.findOne({
          where: { id: data.species_master_id, is_active: true },
          attributes: ["id", "parent_category_type"],
          raw: true,
        });

        if (species && species.parent_category_type) {
          data.parent_category_type = species.parent_category_type;
          console.log(
            `[ProductCategoryMaster.beforeUpdate] Updated parent_category_type: ${species.parent_category_type}`
          );
        }
      }
    } catch (err) {
      console.log("Error while updating a category", err?.message || err);
    }
  });

  // Delete Hook
  ProductCategoryMaster.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting a category", err?.message || err);
    }
  });

  return ProductCategoryMaster;
};
