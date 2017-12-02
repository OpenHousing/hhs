'use strict';


// load config from .env into process.env
require('dotenv').config();


// initialize Koa server
const app = new (require('koa'))();


// setup verbose logging
if (process.env.VERBOSE === 'true') {
    app.use((ctx, next) => {
        console.log(`${ctx.method} ${ctx.path}`);
        return next();
    });
}


// setup session
app.keys = [process.env.KOA_SESSION_KEY || 'KOA_SESSION_KEY should be set'];
app.use(require('koa-session')(app));


// setup cookie parser
// TODO: is this AND koa-session needed?
app.use(require('koa-cookie').default());


// setup authentication enforcement
const unauthenticatedRoutes = [
    '/login',
    '/logout'
];

app.use((ctx, next) => {
    // redirect to login page / store auth token
    if (ctx.session.isNew || !ctx.session.token) {
        if (unauthenticatedRoutes.indexOf(ctx.path) === -1) {
            ctx.redirect('/login');
            return;
        } else {
            // TODO: validate authentication
            if (ctx.cookie && ctx.cookie.okta_token) {
                ctx.session.token = ctx.cookie.okta_token;
            }
        }
    }

    return next();
});


// setup router
const router = require('koa-router')();
app.use(router.routes());


// setup authentication routes
router.get('/logout', ctx => {
    ctx.session = {};
    // TODO: erase session
    ctx.redirect('/login');
});


// setup static asset serving
app.use(require('koa-static')(
    'static',
    {
        index: 'dashboard.html',
        extensions: [
            'json',
            'html'
        ]
    }
));


// compress assets and start server
require('node-minify').minify({
    compressor: 'no-compress',
    publicFolder: './src/js/',
    input: [
        'enums.js',
        'presets.js',
        'filters.js',
        'moment.min.js'
    ],
    output: './static/js/main.js'
}).then(() => {
    const port = process.env.PORT || 3000;

    console.log(`> Ready on http://localhost:${port}`);
    app.listen(port);
});
