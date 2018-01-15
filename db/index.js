'use strict';

// ensure env is complete
if (!process.env.POSTGRES_URI) {
    throw new Error("POSTGRES_URI required in env");
}


// connect to Postgres
const Sequelize = require('sequelize');
const db = {
    sequelize: new Sequelize(process.env.POSTGRES_URI)
};


// load all models in directory
const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);

fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        const model = db.sequelize.import(path.join(__dirname, file));
        db[model.name] = model;
    });

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});


/**
 * Monkey patch issue causing deprecation warning when customizing allowNull validation error
 *
 * See https://github.com/sequelize/sequelize/issues/1500
 */
Sequelize.Validator.notNull = function (item) {
    return !this.isNull(item);
};


// export db object
module.exports = db;