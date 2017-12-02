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

You will be prompted to login, contact kclough@jarv.us for credentials. Once logged in, you should see client data.
