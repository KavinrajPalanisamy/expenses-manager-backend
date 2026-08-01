const { dbConnection } = require('../config/dbConfig');
const { DataTypes } = require('sequelize');

const sessionDetails = dbConnection.define(
    "sessionDetails",
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
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        last_used_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        revoked_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        revoked_reason: {
            type: DataTypes.STRING(150),
            allowNull: true,
        },
        expire_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        ip_address: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        os: {
            type: DataTypes.STRING(25),
            allowNull: true,
        },
        user_agent: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        device_type: {
            type: DataTypes.STRING(25),
            allowNull: true,
        },
        refresh_token: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    },
    {
        tableName: "session_details",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        underscored: true,
    }
);

sessionDetails.associate = (models) => {
    sessionDetails.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
    });
};

module.exports.createRecord = async (data) => {
    return await sessionDetails.create(data, { returning: true });
}

module.exports.updateRefreshToken = async (id, refreshToken) => {
    return await sessionDetails.update({ refresh_token: refreshToken }, { where: { id } });
}

module.exports.terminateSessions = async (data) => {
    await dbConnection.query(`UPDATE session_details SET is_active=:status, revoked_reason=:reason, revoked_at=current_timestamp, updated_at=current_timestamp WHERE id=:sessionId and user_id=:userId and is_active=true;`, {
        replacements: { status: false, reason: data.revokeReason, userId: data.userId, sessionId: data.sessionId }
    });
}

module.exports.getSessionInfoUsingSessionId = async (data) => {
    let [sessionDetails] = await dbConnection.query(`select id, refresh_token from session_details WHERE id=:sessionId and user_id=:userId and is_active=true;`, {
        replacements: { sessionId: data.sessionId, userId: data.userId }
    })
    return sessionDetails;
}

module.exports.updateSessions = async (data) => {
    await dbConnection.query(`UPDATE session_details SET updated_at=current_timestamp, last_used_at=current_timestamp WHERE id=:sessionId and user_id=:userId and is_active=true;`, {
        replacements: { userId: data.userId, sessionId: data.sessionId }
    });
}
