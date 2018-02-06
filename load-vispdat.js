'use strict';


// load config from .env into process.env
require('dotenv').config();
const csv = require('csvtojson')();


// connect to database
const db = require('./db');


// read vispdat
(async () => {
    let insertedVispdat = [];
    // load vispdat
    // TODO: parse CSV
    let vispdat = [];
    csv
        .fromFile('./static/VISPDAT.csv')
        .on('json', (json) => {
            vispdat.push(json);
        });

    // create table
    await db.vispdat.sync({force: true});

    // write clients
    try {
        insertedVispdat = await db.vispdat.bulkCreate(vispdat.map(vi_spdat_record => ({
            vi_spdat: vi_spdat_record['VISPDAT'],
            project_entry_id: vi_spdat_record['ProjectEntryID']
        })));
    } catch (err) {
        console.error('failed to bulk create VISPDAT:', err);
    }
    console.log(`Done. Inserted ${insertedVispdat.length}.`);
    process.exit(0);
})();