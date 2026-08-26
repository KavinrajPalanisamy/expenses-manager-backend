const { dbConnection } = require("../config/dbConfig");
const { DataTypes } = require('sequelize');
const time = require('../utils/timeStamps');

const Account = dbConnection.define("Account", {
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
    account_type_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "account_types",
            key: "id",
        },
    },
    account_provider_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "providers",
            key: "id",
        },
    },
    account_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    account_holder_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    account_number: {
        type: DataTypes.STRING(4),
        allowNull: true,
        defaultValue: null,
    },
    opening_balance_minor: {
        type: DataTypes.DECIMAL(15, 0),
        allowNull: true,
        defaultValue: 0,
    },
    currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: "INR",
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
    },
    expire_on: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    is_default: {
        type: DataTypes.BOOLEAN,
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
},
    {
        tableName: "accounts",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        underscored: true,
    }
);

module.exports.getProviders = async () => {
    const data = await dbConnection.query(`SELECT p.id, p.provider_name FROM providers p WHERE p.is_active = true;`, {
        type: dbConnection.QueryTypes.SELECT
    });
    return data?.length ? data : null;
}

module.exports.getAccountTypes = async () => {
    const data = await dbConnection.query(`select id, account_type from account_types t where t.is_active = true;`, {
        type: dbConnection.QueryTypes.SELECT
    });
    return data?.length ? data : null;
}

module.exports.getAllAccountsByUserId = async (req) => {
    const data = await dbConnection.query(`
        select a.id, a.account_name, a.account_holder_name, '•••• ' || a.account_number as account_number, (coalesce(a.opening_balance_minor, 0)/100)::numeric(15,2) as account_balance, a.currency, a.is_active, a.expire_on, a.created_at, a.updated_at,
        t.description, t.account_type, p.provider_name, p.logo, a.is_default, a.account_provider_id, a.account_type_id
        from accounts a
        join account_types t on t.id = a.account_type_id
        join providers p on p.id = a.account_provider_id
        where a.user_id = :userId
        order by a.updated_at desc;`, {
        type: dbConnection.QueryTypes.SELECT,
        replacements: { userId: req.userId }
    });
    return data?.length ? data : null;
}

module.exports.checkAccountIdAgainstUserId = async (req) => {
    const data = await dbConnection.query(`select count(*) from accounts a where user_id = :userId and id = :accountId;`, {
        type: dbConnection.QueryTypes.SELECT,
        replacements: { userId: req.userId, accountId: req.accountId }
    });
    return data?.length ? data[0].count : null;
}

module.exports.updateAccountDetails = async(updateData, whereCondition) => {
    updateData['updated_at'] = time.getCurrentTimestamp();
    if (updateData?.opening_balance_minor) {
        updateData['opening_balance_minor'] = updateData.opening_balance_minor * 100;
    }
    await Account.update(updateData, whereCondition);
}
