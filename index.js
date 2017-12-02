'use strict';


const Koa = require('koa');
const serve = require('koa-static');
const router = require('koa-router')();
const compressor = require('node-minify');
const cookie = require('koa-cookie');
const session = require('koa-session');

const fs = require('fs');

const app = new Koa();
app.keys = [process.env.KOA_SESSION_KEY || 'KOA_SESSION_KEY should be set'];

const unauthenticatedRoutes = [
    '/login',
    '/logout'
];

app.use(cookie.default());
app.use(session(app));

router.get('/logout', function (ctx, next) {
    ctx.session = {};
    ctx.redirect('/login');
});

app.use(router.routes());

app.use(async (ctx, next) => {
    return next().then(() => {
        console.log(`${ctx.method} ${ctx.path}`);

        // redirect to login page / store auth token
        if (ctx.session.isNew || !ctx.session.token) {
            if (unauthenticatedRoutes.indexOf(ctx.path) === -1) {
                ctx.redirect('/login');
                return;
            } else {
                if (ctx.cookie && ctx.cookie.okta_token) {
                    ctx.session.token = ctx.cookie.okta_token;
                }
            }
        }
    });
});


app.use(serve(
    'static',
    {
        index: 'dashboard.html',
        extensions: [
            'json',
            'html'
        ]
    }
));


compressor.minify({
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
    //TODO pull port # from .env -- KBC
    console.log(`> Ready on http://localhost:3000`);
    app.listen(3000);
});
