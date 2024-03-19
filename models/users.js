"use strict";

const bcrypt = require("bcrypt");
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    static associate(models) {
      Users.hasOne(models.UserProfiles, {
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Users.hasOne(models.UserProfiles, {
        foreignKey: "updated_by",
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
    }
  );

  Users.beforeCreate((user, options) => {
    if (user?.password) {
      user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(10));
    }
    if (user?.email) {
      user.email = user?.email?.toLowerCase();
    }
  });

  return Users;
};
