'use strict';


// load config from .env into process.env
require('dotenv').config();


// connect to database
const db = require('./db');


// read clients
(async () => {
    let insertedClients = [];
    // load clients
    const clients = JSON.parse(require('fs').readFileSync('./static/client-enrollments.json'));

    // create table
    await db.Client.sync({force: true});

    // write clients
    try {
        insertedClients = await db.Client.bulkCreate(clients.map(client => {
            client.id = client.sourceSystemId;
            client.cj_id = client.cjID;
            client.first_name = client.firstName;
            client.last_name = client.lastName;
            client.disabling_condition = Boolean(client.disabling_condition);
            client.user_type_hmis = client.homelessHousingStatusCount;
            client.user_type_cj = client.bookingCount;
            client.currently_incarcerated = Boolean(client.currentlyInJail);
            client.currently_homeless_shelter = Boolean(client.currently_homeless_shelter);
            client.veteran_status = Boolean(client.veteran_status);
            client.chronic_status = Boolean(client.chronic_status);
            client.disabled_status = Boolean(client.disabled_status);
            client.family_status = Boolean(client.family_status);
            client.history_unsheltered = Boolean(client.history_unsheltered);
            if (client.jail_release_date) {
                client.jail_release_date = new Date(client.jail_release_date).getTime();
            }
            else {
                delete client.jail_release_date;
            }
            client.dob = client.dob;

        return client;
        }));
    } catch (err) {
        console.error('failed to bulk create clients:', err);
    }
    console.log(`Done. Inserted ${insertedClients.length}.`);
    process.exit(0);
})();