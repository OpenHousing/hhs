module.exports = ({
    app, // Koa Server instance
    router // router instance
}) => {
    // Handle dashboard
    router.get('/', ctx => {
        ctx.render('dashboard', {
            user: ctx.state.user
        });
    });

};