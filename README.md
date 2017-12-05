# OpenHousing/hhs

## Requirements

- node 8.x.

## Scripts to Rule Them All

This project follows the [Scripts to Rule Them All](https://githubengineering.com/scripts-to-rule-them-all/) pattern:

- `script/bootstrap` - installs/updates all dependencies
- `script/setup` - sets up a project to be used for the first time
- `script/update` - updates a project to run at its current version
- `script/server` - starts app

## Getting started

To initialize or reset your environment, run:

```bash
script/setup
````

**This command may destroy configuration and data.**

## Running the server

To start the web server, run:

```bash
script/server
```

## Accessing the application

Navigate to [http://localhost:3000](http://localhost:3000)

You will be prompted to login, contact kclough@jarv.us for credentials or set up new Okta authentication. Once logged in, you should see client data.

## Setting up Okta authentication

1. Sign up as a developer at [https://developer.okta.com/signup/](https://developer.okta.com/signup/)
1. Set `OKTA_URL` in `.env` to the base URL for your okta site
1. Open the **Applications**→**Add Application** page from the Developer Console
1. Choose **Web** as the platform
1. Enter a **Name** like `OpenHousing HHS`
1. Enter a **Base URI** like `http://localhost:3000/`
1. Enter a **Login redirectURI** like `http://localhost:3000/auth/okta/callback`
1. Set `OKTA_CLIENTID` and `OKTA_CLIENTSECRET` in `.env`

See also [Okta Javascript SDK](https://developer.okta.com/code/javascript/)