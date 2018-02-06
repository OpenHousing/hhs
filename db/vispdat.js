'use strict';


module.exports = (sequelize, DataTypes) => {
    const VISPDAT = sequelize.define('vispdat', {
        vi_spdat: {
            type: DataTypes.INTEGER
        },
        project_entry_id: {
            type: DataTypes.INTEGER
        },

    }, {
        timestamps: false,
        paranoid: false,
        underscored: true
    });

    return VISPDAT;
};