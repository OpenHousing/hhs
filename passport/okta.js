module.exports = ({ app }) => {
    const passport = require('koa-passport');
    const OktaStrategy = require('passport-okta-oauth').Strategy;


    // setup Okta strategy
    passport.use(new OktaStrategy(
        {
            audience: process.env.OKTA_AUDIENCE,
            clientID: process.env.OKTA_CLIENTID,
            clientSecret: process.env.OKTA_CLIENTSECRET,
            idp: process.env.OKTA_IDP,
            scope: ['openid', 'email', 'profile'],
            response_type: 'code',
            callbackURL: `${app.baseUrl}/auth/okta/callback`
        },
        (accessToken, refreshToken, profile, done) => {
            done(null, profile);
        })
    );

    // Serialization
    passport.serializeUser((user, done) => {
        done(null, {
            id: user.id,
            displayName: user.displayName,
            username: user.username,
            emails: user.emails,
            name: user.name
        });
    });

    passport.deserializeUser((user, done) => {
        done(null, user);
    });


    // register middleware methods
    app.use(passport.initialize());
    app.use(passport.session());


    // export reference on app
    app.passport = passport;


    // return configured passport instance
    return passport;
};