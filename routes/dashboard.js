require('dotenv').config();

module.exports = ({
    app, // Koa Server instance
    router // router instance
}) => {
    // Handle dashboard
    router.get('/', ctx => {
        ctx.render('dashboard', {
            user: ctx.state.user,
            config: {
                UTILIZATION_TYPE_JAIL: {
                    HIGH: parseInt(process.env.UTILIZATION_TYPE_JAIL_HIGH),
                    MEDIUM_HIGH: parseInt(process.env.UTILIZATION_TYPE_JAIL_MEDIUM_HIGH),
                    MEDIUM: parseInt(process.env.UTILIZATION_TYPE_JAIL_MEDIUM)
                },
                UTILIZATION_TYPE_HMIS: {
                    HIGH: parseInt(process.env.UTILIZATION_TYPE_HMIS_HIGH),
                    MEDIUM_HIGH: parseInt(process.env.UTILIZATION_TYPE_HMIS_MEDIUM_HIGH),
                    MEDIUM: parseInt(process.env.UTILIZATION_TYPE_HMIS_MEDIUM)
                }
            },
            helpers: { json: function (context) { return JSON.stringify(context); }}
        });
    });
};