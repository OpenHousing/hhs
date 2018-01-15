const { Client } = require('../db');

module.exports = ({
    app, // Koa Server instance
    router, // router instance

    path = '/clients'
}) => {
    // Handle dashboard
    router.get(`/api${path}`, async function (ctx) {
        const queryOptions = {
            order: [
                ['created_at', 'DESC'],
                ['id', 'DESC']
            ]
        };

        const limit = parseInt(ctx.request.query.limit, 10);
        const offset = parseInt(ctx.request.query.offset, 10);

        if (limit) {
            queryOptions.limit = limit;
        }

        if (offset) {
            queryOptions.offset = offset;
        }

        const result = await Client.findAndCountAll(queryOptions);

        ctx.body = {
            success: true,
            data: result.rows,
            total: result.count
        };
    });
};