"use strict";

const bcrypt = require("bcrypt");
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    static associate(models) {
      Users.hasOne(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Users.hasOne(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Users.hasOne(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  Users.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      username: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
      },
      phone: {
        type: DataTypes.STRING,
      },
      country_code: {
        type: DataTypes.STRING,
      },
      password: {
        type: DataTypes.STRING,
      },
      is_email_verified: {
        type: DataTypes.BOOLEAN,
      },
      is_mobile_verified: {
        type: DataTypes.BOOLEAN,
      },
      is_password_forgot: {
        type: DataTypes.BOOLEAN,
      },
      user_status: {
        defaultValue: "0",
        type: DataTypes.ENUM("0", "1", "2", "3"),
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
      deactivated_at: {
        type: DataTypes.DATE,
      },
      deleted_at: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "Users",
      schema: "auth",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  Users.beforeCreate((data, options) => {
    try {
      if (data?.password) {
        data.password = bcrypt.hashSync(data.password, bcrypt.genSaltSync(10));
      }
      if (data?.email) {
        data.email = data?.email?.toLowerCase();
      }
    } catch (err) {
      console.log("Error while creating an user", err?.message || err);
    }
  });

  // Update Hook
  Users.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
    } catch (err) {
      console.log("Error while updating an user", err?.message || err);
    }
  });

  return Users;
};
