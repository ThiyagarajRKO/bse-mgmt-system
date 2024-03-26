"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class UserProfiles extends Model {
    static associate(models) {
      UserProfiles.belongsTo(models.Users, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      UserProfiles.belongsTo(models.Users, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      UserProfiles.belongsTo(models.Users, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      UserProfiles.belongsTo(models.RoleMaster, {
        foreignKey: "role_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  UserProfiles.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      full_name: {
        type: DataTypes.STRING,
      },
      first_name: {
        type: DataTypes.STRING,
      },
      last_name: {
        type: DataTypes.STRING,
      },
      dob: {
        type: DataTypes.STRING,
      },
      experience: {
        type: DataTypes.STRING,
      },
      skills: {
        type: DataTypes.STRING,
      },
      appearance_url: {
        type: DataTypes.STRING,
      },
      is_admin: {
        type: DataTypes.BOOLEAN,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
      },
      is_banned: {
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
      modelName: "UserProfiles",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  UserProfiles.beforeCreate((data, options) => {
    if (data?.first_name || data?.last_name) {
      data.full_name = data?.first_name?.trim() + " " + data?.last_name?.trim();
    }

    data.created_at = new Date();
    // data.created_by = options?.user_id;
  });

  // Update Hook
  UserProfiles.beforeUpdate(async (data, options) => {
    try {
      if (data?.first_name || data?.last_name)
        data.full_name =
          data?.first_name?.trim() + " " + data?.last_name?.trim();

      data.updated_at = new Date();
      // data.updated_by = options?.user_id;
    } catch (err) {
      console.log("Error while updating a driver", err?.message || err);
    }
  });

  // Delete Hook
  UserProfiles.afterDestroy(async (data, options) => {
    try {
      // data.deleted_by = options?.user_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting a driver", err?.message || err);
    }
  });

  return UserProfiles;
};
