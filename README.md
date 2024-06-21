# Plock

Plock is an all-in-one authentication server, providing email & password, email verification codes, two-factor authentication, OAuth with social providers, and passkey authentication, with session management using cookies and bearer tokens.

> [!WARNING]
> N.B. This project is still in early development. It is not ready for production use yet.
> It currently only supports `Turso` and `Postgres` as the database. I am gradually adding support for other databases, such as SQLite and MySQL.

<br />
<img src="./.github/plockdemo.gif" />

## Table of content

- [Plock](#Plock)
  - [Table of content](#table-of-content)
- [Usage](#usage)
- [Environment variables](#environment-variables)
  - [General environment](#general-environment)
  - [Database environment](#database-environment)
    - [Turso/LibSQL](#turso-libSQL)
    - [Postgres](#postgresql)

## Usage

Simply pull the Docker image and use it with your app:

```bash
docker pull ghcr.io/eliottwantz/plock:latest
docker run -it --rm -p 5173:5173 ghcr.io/eliottwantz/plock:latest
```

or with docker-compose:

```yaml
services:
  plock:
    image: ghcr.io/eliottwantz/plock:latest
    ports:
      - 5173:5173
    env_file:
      - .env
```

## Environment variables

### General environment

Please check an example of the .env file in the example [examples/simple](./examples/simple/.env.example)

| Name                       | Description                                                            |
| -------------------------- | ---------------------------------------------------------------------- |
| `PORT`                     | The port to listen on. Defaults to 5173.                               |
| `ENV`                      | The environment to run in, either `DEV` or `PROD`                      |
| `GOOGLE_CLIENT_ID`         | The client ID of the Google OAuth provider.                            |
| `GOOGLE_CLIENT_SECRET`     | The client secret of the Google OAuth provider.                        |
| `GOOGLE_AUTH_CALLBACK_URL` | The callback URL of the Google OAuth provider.                         |
| `GITHUB_CLIENT_ID`         | The client ID of the GitHub OAuth provider.                            |
| `GITHUB_CLIENT_SECRET`     | The client secret of the GitHub OAuth provider.                        |
| `PUBLIC_AUTH_ORIGIN`       | The origin of the Plock server.                                        |
| `PUBLIC_CALLBACK_URL`      | The callback URL where you want to be redirected after authentication. |
| `PUBLIC_LOGOUT_URL`        | The URL where you want to be redirected after logout.                  |
| `PUBLIC_SITE_NAME`         | The name of your website.                                              |

### Database environment

Depending on the DB that you are using, set these environment variables accordingly:

> [!TIP]
> Use `host.docker.internal` instead of `localhost` for the DB host.

#### Turso / LibSQL

| Name            | Description                                                                  |
| --------------- | ---------------------------------------------------------------------------- |
| `DB_TYPE`       | The database type. Must be `turso`.                                          |
| `DB_URL`        | The URL of the turso server. Defaults to `http://host.docker.internal:8080`. |
| `DB_AUTH_TOKEN` | The token of the turso server. Defaults to `null`.                           |

#### PostgreSQL

| Name      | Description                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------- |
| `DB_TYPE` | The database type. Must be `postgres`.                                                                        |
| `DB_URL`  | The Postgres connection URL. Defaults to `postgresql://postgres:postgres@host.docker.internal:5432/postgres`. |
