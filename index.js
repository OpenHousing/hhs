'use strict';


// load config from .env into process.env
require('dotenv').config();


// initialize Koa server
const app = new (require('koa'))();


// initialize top-level configuration
const port = process.env.PORT || 3000;
app.baseUrl = `http://localhost:${port}`;


// setup verbose logging
if (process.env.VERBOSE === 'true') {
    app.use((ctx, next) => {
        console.log(`${ctx.method} ${ctx.path}`);
        return next();
    });
}

// setup error handling
app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        ctx.status = err.status || 500;

        if (err.errors) {
            ctx.body = {
                code: ctx.status,
                message: err.errors
            };
        } else {
            ctx.body = {
                code: ctx.status,
                message: typeof err == 'string' ? err : err.message
            };
        }

        ctx.app.emit('error', err, ctx);
    }
});


// setup session
app.keys = [process.env.KOA_SESSION_KEY || 'KOA_SESSION_KEY should be set'];
app.use(require('koa-session')(app));


// setup passport
app.passport = require('./passport/okta')({ app });


// setup body parser middleware
app.use(require('koa-bodyparser')());


// setup authentication enforcement
app.unauthenticatedRoutes = [];

app.use(async (ctx, next) => {
    if (
        app.unauthenticatedRoutes.indexOf(ctx.path) === -1 && // whitelisted routes don't need auth
        ctx.isUnauthenticated()
    ) {
        if (ctx.path == '/') {
            ctx.redirect('/auth/login');
        } else {
            ctx.throw(401, {
                success: false,
                message: 'You must login first'
            });
        }
    } else {
        return await next();
    }
});


// setup view renderer
const hbs = require('koa-hbs');

app.use(hbs.middleware({
    viewPath: __dirname + '/views'
}));

hbs.registerHelper('json', data => {
    return new hbs.SafeString(JSON.stringify(data));
});


// setup router
const router = require('koa-router')();
app.use(router.routes());


// load route bundles
[
    './routes/auth',
    './routes/dashboard'
].forEach(routeBundle => {
    require(routeBundle)({app, router});
});


// setup static asset serving
app.use(require('koa-static')(
    'static',
    {
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
    console.log(`> Ready on ${app.baseUrl}`);
    app.listen(port);
});
