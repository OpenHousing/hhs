const { Client } = require('../db');

module.exports = ({
    app, // Koa Server instance
    router, // router instance

    path = '/clients'
}) => {
    // Handle dashboard
    router.get(`/api${path}`, async function (ctx) {
        const queryOptions = {};

        const limit = parseInt(ctx.request.query.limit, 10);
        const offset = parseInt(ctx.request.query.offset, 10);
        const order = ctx.request.query.order && ctx.request.query.order.split(',').map(field => field.split(':'));

        if (limit) {
            queryOptions.limit = limit;
        }

        if (offset) {
            queryOptions.offset = offset;
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