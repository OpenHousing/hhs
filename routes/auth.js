module.exports = ({
    app, // Koa Server instance
    router, // router instance

    path = '/auth',
    successRedirect = '/',
    failureRedirect = '/'
}) => {

    // Handle user check
    const userUrl = `${path}/user`;

    app.unauthenticatedRoutes.push(userUrl);

    router.get(userUrl, ctx => {
        ctx.body = {
            success: true,
            user: ctx.state.user || null
        };
    });

    // Handle login
    const loginUrl = `${path}/login`;

    app.unauthenticatedRoutes.push(loginUrl);

    router.get(loginUrl, app.passport.authenticate('okta', {
        successRedirect,
        failureRedirect
    }));


    // Handle okta auth callback
    const oktaCallbackUrl = `${path}/okta/callback`;

    app.unauthenticatedRoutes.push(oktaCallbackUrl);

    router.get(oktaCallbackUrl, (ctx, next) => {
        return app.passport.authenticate('okta', async (err, user, info, status) => {
            if (err) {
                throw err;
            }

            if (!user) {
                ctx.throw(status || 400, info || {
                    success: false,
                    message: 'Login failed'
                });
            }

            await ctx.login(user);

            ctx.redirect(successRedirect);
        })(ctx, next);
    });


    // Handle logout
    const logoutUrl = `${path}/logout`;

    app.unauthenticatedRoutes.push(logoutUrl);

    router.get(logoutUrl, async ctx => {
        ctx.logout();
        ctx.redirect(`${process.env.OKTA_AUDIENCE}/login/signout?fromURI=${app.baseUrl}`);
    });
};