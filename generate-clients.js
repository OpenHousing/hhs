// NOTES
/*
    https://www.hmislynk.com/hmis-clientapi/rest/clients?maxItems=10000 - works

    https://www.hmislynk.com/hmis-clientapi-v2016/rest/v2016/clients" - doesn't work
*/

// UNSAFE - REMOVE BEFORE RELEASING TO PRODUCTION - this flag is needed to work with CJ API's self signed SSL cert
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

require('dotenv').config();

const request = require('request-promise');
const retry = require('async-retry')
const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const hmisAuth = require('./hmis-auth');
const jsonfile = require('jsonfile');

const handlers = module.exports = {};

//TODO move to config file - KBC
const hmislynkApiUrl = 'https://www.hmislynk.com/hmis-clientapi/rest';

//TODO move to config file - KBC
const cjAPIConfig = {
    jailStayUrl: 'https://38.118.81.49:8080/CJ/jailstay',
    minConfidence: 0.5
};

const cjAPICredentails = {
    username: process.env.CJ_API_USERNAME,
    password: process.env.CJ_API_PASSWORD,
};

const cocID = process.env.COC_ID;

// 3.8 Disabling Condition
// 0   No
// 1   Yes
// 8   Client doesn’t know 
// 9   Client refused
// 99  Data not collected

// 3. 917A Living Situation
// HOMELESS SITUATION
// 16   Place not meant for habitation 
// 1    Emergency shelter, including hotel or motel paid for with emergency shelter voucher 
// 18   Safe Haven 
// 27   Interim Housing

const hudMappings = {
    disablingConditionIds: [1],
    homelessLivingSituationIds: [16, 1, 18, 27],
    housingStatusIds: [1] // homeless
};

const getClients = async() => {
    const authHeaders = await hmisAuth.getAccessTokenAuthHeaders();

    // TODO is this a reasonable number?
    const clientRequestOptions = {
        url: `${hmislynkApiUrl}/clients`,
        qs: {
            maxItems: 750
        },
        headers: authHeaders,
        json: true
    };

    const crosswalkCSV = fs.readFileSync(__dirname+'/crosswalk.csv').toString();
    const crosswalkData = parse(crosswalkCSV, {columns: true});

    const response = await request(clientRequestOptions);

    if (response && response.Clients && response.Clients.clients) {
        const clients = response.Clients.clients;

        console.log(`Loaded ${clients.length} clients`);

        do {
            clientRequestOptions.qs.startIndex = clients.length;
            
            let additionalRecordsResponse = null;

            await retry(async bail => {
                additionalRecordsResponse = await request(clientRequestOptions);
            }, {retries: 10});

            if(additionalRecordsResponse.Clients && additionalRecordsResponse.Clients.clients) {
                clients.push(...additionalRecordsResponse.Clients.clients)
            }
            else {
                console.log('error?');
                throw 'Unable to load clients, unexpected response.';
            }
            console.log(`Loaded ${clients.length} clients`);
        }
        while (response.Clients.pagination && clients.length < response.Clients.pagination.total)

        console.log('Loaded All Clients');
        
        var staticClientsRawFile = './static/client-raw.json';
        jsonfile.writeFileSync(staticClientsRawFile, clients);

        const results = [];
        for(var i = 0; i < clients.length; i++) {
            console.log(`Processing Client: ${i}/${clients.length}`);
            var client = clients[i];

            client.originalSourceId = client.sourceSystemId;
            client.hmisID = client.sourceSystemId.substring(7);

            try {
                // TODO load project type
                const enrollmentUrl = `${hmislynkApiUrl}/clients/${client.clientId}/enrollments`
                const enrollmentRequestOptions = {
                    url: enrollmentUrl,
                    qs: {
                        maxItems: 100000
                    },
                    headers: authHeaders,
                    json: true
                };

                const enrollmentsResponse = await request(enrollmentRequestOptions);

                if (enrollmentsResponse && enrollmentsResponse.enrollments && enrollmentsResponse.enrollments.enrollments) {
                    // sort enrollments by `entrydate` column
                    const enrollments = enrollmentsResponse.enrollments.enrollments.sort((a, b) => a.entrydate > b.entrydate ? 1 : a.entrydate === b.entrydate ? 0 : -1 );

                    console.log(`Loaded ${enrollments.length} enrollments for client ${client.clientId} ${i}/${clients.length}`);

                    disablingConditionCount = enrollments.filter((e) => {
                        return hudMappings.disablingConditionIds.includes(e.disablingcondition);
                    }).length;

                    homelessHousingStatusCount = enrollments.filter((e) => {
                        return hudMappings.homelessLivingSituationIds.includes(e.housingstatus);
                    }).length;

                    familyStatusCount = enrollments.filter((e) => {
                        return hudMappings.housingStatusIds.includes(e.housingstatus)
                    }).length;

                    client.disabling_condition = disablingConditionCount > 0;
                    client.homelessHousingStatusCount = homelessHousingStatusCount;
                    client.family_status = familyStatusCount > 0;
                    client.history_unsheltered = homelessHousingStatusCount > 0;
                    client.currently_homeless_shelter = enrollments.filter((e) => {
                        return hudMappings.homelessLivingSituationIds.includes(e.housingstatus);
                    }).length > 0;

                    // Disable CocID check for now since all hmislynk data has this id.
                    client.cocMatch = true;

                    /*
                    for(var j = 0; j < enrollments.length; j++) {
                        const enrollment = enrollments[j];
                        const enrollmentCocsUrl = `${hmislynkApiUrl}/clients/${client.clientId}/enrollments/${enrollment.enrollmentId}/enrollmentcocs`;
                        const enrollmentCocsRequestOptions = {
                            url: enrollmentCocsUrl,
                            qs: {
                                maxItems: 100000
                            },
                            headers: authHeaders,
                            json: true
                        };
                        const enrollmentCocsResponse = await request(enrollmentCocsRequestOptions);

                        if(enrollmentCocsResponse.enrollmentCocs &&
                            enrollmentCocsResponse.enrollmentCocs.enrollmentCocs &&
                            enrollmentCocsResponse.enrollmentCocs.enrollmentCocs.length > 0) {
                                const enrollmentCocs = enrollmentCocsResponse.enrollmentCocs.enrollmentCocs;
                                client.cocMatch = false;

                                for(var k=0; k < enrollmentCocs.length; k++) {
                                    const enrollmentCoc = enrollmentCocs[k]; 
                                    // console.log('enrollmentCoc', enrollmentCoc);
                                    console.log('cocCode', enrollmentCoc.cocCode);
                                    // debugger

                                    if(cocID == enrollmentCoc.cocCode) {
                                        console.log('hit');
                                        client.cocMatch = true;
                                        // debugger
                                    }
                                }

                                // enrollments[j].cocIds = enrollmentCocs.map(x => x.cocCode.trim()).reduce((x, y) => x.includes(y) ? x : [...x, y], []);
                            }
                    }
                    */

                    // client.enrollments = enrollments;
                }

                if(!client.cocMatch) {
                    continue;
                }

                const crosswalkRecord = crosswalkData.find((x) => x.confidence > cjAPIConfig.minConfidence && x.source_system_id === client.originalSourceId);

                client.currentlyInJail = false;
                client.bookingCount = 0;

                if(crosswalkRecord) {
                    client.cjID = crosswalkRecord.person_id;

                    const cjJailStayRequestOptions = {
                        method: 'POST',
                        url: cjAPIConfig.jailStayUrl,
                        headers: {
                            'content-type': 'application/json'
                        },
                        body: {
                            username: process.env.CJ_API_USERNAME,
                            password: process.env.CJ_API_PASSWORD,
                            pid: crosswalkRecord.person_id
                        },
                        json: true
                    };

                    await retry(async bail => {
                        // if anything throws, we retry
                        const cjResponse = await request(cjJailStayRequestOptions);
    
                        console.log('cjResponse length: ', cjResponse.length);
    
                        client.currentlyInJail = cjResponse.find(x => (new Date(cjResponse[0].date_of_release)) > (new Date())) !== undefined;
                        client.bookingCount = cjResponse.length;
                        if (cjResponse.length > 0) {
                            client.jailReleaseDate = cjResponse
                                .map(x => new Date(x.date_of_release))
                                .sort()
                                .reverse()[0];
                        }
                    }, {retries: 10});
                }
                
            }
            catch(err) {
                console.log('Error:', err);
                debugger
            }

            try {
                const veteranInfoUrl = `${hmislynkApiUrl}/clients/${client.clientId}/veteraninfos`;
                const veteranInfoRequestOptions = {
                    url: veteranInfoUrl,
                    qs: {
                        maxItems: 100000
                    },
                    headers: authHeaders,
                    json: true
                };

                const veteransResponse = await request(veteranInfoRequestOptions);
                client.veteran_status = veteransResponse && veteransResponse.veteranInfos.length > 0;
            }
            catch (err) {
                console.log('Error:', err);
                debugger
            }

            if(client.cocMatch) {
                results.push(client);
            }
        }
        
        const file = './static/client-enrollments.json';
        
        jsonfile.writeFileSync(file, results);

        console.log(`Wrote ${results.length} clients`);
    }
}

getClients().then(() => { console.log('Done'); });