const { Client } = require('../db');
const moment = require('moment');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

module.exports = ({
    app, // Koa Server instance
    router, // router instance

    path = '/clients'
}) => {
    // Handle dashboard
    router.get(`/api${path}`, async function (ctx) {
        const queryOptions = {where:{}};

        const limit = parseInt(ctx.request.query.limit, 10);
        const offset = parseInt(ctx.request.query.offset, 10);
        const search = ctx.request.query.search;
        const searchColumns = ctx.request.query.searchColumns && ctx.request.query.searchColumns.split(',').map(field => field.split(':'));
        const releaseDateStart = ctx.query.releaseDateStart;
        const releaseDateEnd = ctx.query.releaseDateEnd;
        const youthOnly = (ctx.query.youthOnly == 'true');
        const order = ctx.request.query.order && ctx.request.query.order.split(',').map(field => field.split(':'));

        if (limit) {
            queryOptions.limit = limit;
        }

        if (offset) {
            queryOptions.offset = offset;
        }

        if (search && search.length > 0) {
            if (isNaN(search)) {
                queryOptions.where[Op.or] = [{
                    first_name: {[Op.iLike]: `%${search}%`}
                }, {
                    last_name: {[Op.iLike]: `%${search}%`}
                }];
            }
            else {
                // TODO Could be more optimal, breaks search index on integer -- KBC
                queryOptions.where[Op.or] = [
                    Sequelize.literal(`CAST("id" AS TEXT) like '%${search}%'`),
                    Sequelize.literal(`CAST("cj_id" AS TEXT) like '%${search}%'`)
                ];
            }
        }

        if (searchColumns) {
            searchColumns.forEach(field => {
                queryOptions.where[field[0]] = field[1];
            });
        }

        var validReleaseStartDate = moment(releaseDateStart, "MM/DD/YYYY", true).isValid();
        var validReleaseEndDate = moment(releaseDateEnd, "MM/DD/YYYY", true).isValid();

        if (validReleaseStartDate) {
            queryOptions.where['jail_release_date'] = {
                [Op.gte]: releaseDateStart
            };
        }

        if (validReleaseEndDate) {
            if (!queryOptions.where['jail_release_date']) {
                queryOptions.where['jail_release_date'] = {};
            }
            queryOptions.where['jail_release_date'][Op.lte] = releaseDateEnd ;
        }

        if (youthOnly) {
            queryOptions.where[Op.and] = [
                Sequelize.literal(`"dob" <= '${moment().subtract(18, "years").format("YYYY-MM-DD")}'`),
                Sequelize.literal(`"dob" >= '${moment().subtract(24, "years").format("YYYY-MM-DD")}'`)
            ];
        }

        if (order) {
            order.forEach(field => {
                field[1] = field[1].toUpperCase();

                if (!field[0] in Client.rawAttributes) {
                    throw new Error('invalid field name: '+field[0]);
                }

                if (field[1] != 'ASC' && field[1] != 'DESC') {
                    throw new Error('invalid field order direction: '+field[1]);
                }
            });

            queryOptions.order = order;
        } else {
            queryOptions.order = [
                ['created_at', 'DESC'],
                ['id', 'DESC']
            ];
        }

        const result = await Client.findAndCountAll(queryOptions);

        ctx.body = {
            success: true,
            data: result.rows,
            total: result.count
        };
    });
};