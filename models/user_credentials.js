const { dbConnection } = require('../config/dbConfig');
const { DataTypes } = require('sequelize');

const userCredentials = dbConnection.define(
    "userCredentials",
    {
        user_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        current_password: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        role_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        is_locked: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        failed_login_attempts: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        last_login_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        password_updated_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        first_name: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        last_name: {
            type: DataTypes.STRING(50),
            allowNull: true,
            defaultValue: "",
        },
        display_name: {
            type: DataTypes.STRING(24),
            allowNull: true,
        },
        date_of_birth: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
    },
    {
        tableName: "user_credentials",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        underscored: true,
    }
);

userCredentials.associate = (models) => {
    userCredentials.belongsTo(models.UserRole, {
        foreignKey: "role_id",
        as: "role",
    });
};


module.exports.createUser = async (data) => {
    return await userCredentials.create(data, { returning: true });
}

module.exports.getUserData = async (data) => {
        let [userDetails] = await dbConnection.query(`select user_id, username, email, first_name, last_name, display_name, is_locked, current_password from user_credentials uc where is_active = true and (username = :username or email = :email)`, {
        replacements: { username: data.userName || '', email: data?.email || '' },
        type: dbConnection.QueryTypes.SELECT
    });
    if (userDetails) {
        return userDetails;
    }
    return null;
}
