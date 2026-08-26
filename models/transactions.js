const { dbConnection } = require("../config/dbConfig");
const { DataTypes } = require('sequelize');

const Transaction = dbConnection.define(
    "Transaction",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "user_credentials",
                key: "user_id",
            },
        },
        transaction_type_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "transaction_types",
                key: "id",
            },
        },
        category_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "categories",
                key: "id",
            },
        },
        account_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "accounts",
                key: "id",
            },
        },
        description: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        amount_minor: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: false,
            defaultValue: 0,
            validate: {
                isNonZero(value) {
                    if (Number(value) === 0) {
                        throw new Error("amount_minor cannot be zero");
                    }
                },
            },
        },
        tags: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: [],
        },
        note: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        transaction_on: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        transfer_group_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
        deleted_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: "transactions",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        underscored: true,
    }
);
