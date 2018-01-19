'use strict';


// load config from .env into process.env
require('dotenv').config();


// connect to database
const db = require('./db');


// read clients
(async () => {
    // load clients
    const clients = JSON.parse(require('fs').readFileSync('./static/client-enrollments.json'));

    // create table
    await db.Client.sync({force: true});

    // write clients
    try {
        await db.Client.bulkCreate(clients.map(client => {
            client.id = client.hmisID;
            client.cj_id = client.cjID;
            client.first_name = client.firstName;
            client.last_name = client.lastName;
            client.disabling_condition = Boolean(client.disabling_condition);

            return client;
        }));
    } catch (err) {
        console.error('failed to bulk create clients:', err);
    }

    process.exit(0);
})();