const { dbConnection } = require("../config/dbConfig");
const { DataTypes } = require('sequelize');

const Menu = dbConnection.define(
    "Menu",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        menu_key: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        display_label: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING(200),
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
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        url: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: true,
        },
    },
    {
        tableName: "menu",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        underscored: true,
    }
);

const SubMenu = dbConnection.define(
    "SubMenu",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        menu_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "menu",
                key: "id",
            },
        },
        sub_menu_key: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        display_label: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.STRING(200),
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
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true,
        },
        url: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: true,
        },
    },
    {
        tableName: "sub_menu",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        underscored: true,
    }
);

// Associations
Menu.hasMany(SubMenu, {
    foreignKey: "menu_id",
    as: "sub_menus",
});

SubMenu.belongsTo(Menu, {
    foreignKey: "menu_id",
    as: "menu",
});

module.exports.getMenuOnly = async () => {
    const menuData = await dbConnection.query(`select * from menu where is_active = true;`, {
        type: dbConnection.QueryTypes.SELECT
    });
    return menuData?.length ? menuData : null;
}

module.exports.getSubMenuOnly = async () => {
    const subMenuData = await dbConnection.query(`select * from sub_menu where is_active = true;`, {
        type: dbConnection.QueryTypes.SELECT
    });
    return subMenuData?.length ? subMenuData : null;
}

module.exports.getMenuAndSubMenu = async () => {
    const menuAndSubMenuData = await dbConnection.query(`select sm.menu_id, m.menu_key, m.display_label as menu_label, m.description as menu_description, m.created_at as menu_created_at, m.updated_at as menu_updated_at,
        sm.id as sub_menu_id, sm.sub_menu_key, sm.display_label as sub_menu_label, sm.description as sub_menu_description, sm.created_at as sub_menu_created_at, sm.updated_at as sub_menu_updated_at
        from menu m
        join sub_menu sm on sm.menu_id = m.id 
        where m.is_active = true and sm.is_active = true;`, {
        type: dbConnection.QueryTypes.SELECT
    });
    return menuAndSubMenuData?.length ? menuAndSubMenuData : null;
}

module.exports.getSubMenuGroupWithMenu = async () => {
    const subMenuGroupWithMenuData = await dbConnection.query(`select id, menu_key, display_label, description, icon, m.url,
    (select json_agg(jsonb_build_object('id', sm.id,'sub_menu_key', sm.sub_menu_key,'display_label', sm.display_label,'description', sm.description, 'icon', sm.icon, 'url', sm.url) order by sm.order_no asc) from sub_menu sm where sm.menu_id = m.id and sm.is_active = true)::jsonb as sub_menu_items
    from menu m where m.is_active = true order by order_no asc;`, {
        type: dbConnection.QueryTypes.SELECT
    });
    return subMenuGroupWithMenuData?.length ? subMenuGroupWithMenuData : null;
}

