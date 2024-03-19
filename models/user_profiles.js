"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class UserProfiles extends Model {
    static associate(models) {
      UserProfiles.belongsTo(models.Users, {
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      UserProfiles.belongsTo(models.Users, {
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      UserProfiles.belongsTo(models.RoleMaster, {
        foreignKey: "role_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      // One to Many
      UserProfiles.hasMany(models.DeviceTokens, {
        foreignKey: "created_by",
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
        allowNull: false,
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
    },
    {
      sequelize,
      modelName: "UserProfiles",
      underscored: true,
      createdAt: false,
      updatedAt: false,
    }
  );

  UserProfiles.beforeCreate((user, options) => {
    if (user?.first_name || user?.last_name) {
      user.full_name = (user?.first_name + " " + user?.last_name)?.trim();
    }
  });

  return UserProfiles;
};
