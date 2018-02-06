'use strict';

// load config from .env into process.env
require('dotenv').config();
const fs = require('fs');
const parse = require('csv-parse/lib/sync');

// connect to database
const db = require('./db');

(async () => {
    let insertedVispdat = [];

    const crosswalkCSV = fs.readFileSync(__dirname+'/VISPDAT.csv').toString();
    const vispdat = parse(crosswalkCSV, {columns: true});

    for(let i = 0; i < vispdat.length; i++) {
        const v = vispdat[i];
        try {
            const client = await db.Client.findById(v['client-id']);
            

            if(client) {
                const accessedDate = new Date(v['vispdat-date']);
                if(!client.vi_spdat_assessed_date || client.vi_spdat_assessed_date < accessedDate) {
                    client.vi_spdat = parseInt(v['vispdat-score']);
                    client.vi_spdat_assessed_date = accessedDate;

                    await client.save();
                }
            }
        } catch (err) {
            console.error('failed to update client with vispdat record:', v);
        }
        console.log('Done!');
    }
    
    process.exit(0);
})();