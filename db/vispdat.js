'use strict';

module.exports = (sequelize, DataTypes) => {
    const VISPDAT = sequelize.define('Vispdat', {
        client_id: {
            type: DataTypes.INTEGER
        },
        date: {
            type: DataTypes.STRING
        },
        score: {
            type: DataTypes.INTEGER
        }
    }, {
        timestamps: true,
        paranoid: false,
        underscored: true
    });

    return VISPDAT;
};