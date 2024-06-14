# Plock

Plock is an all in one authentication server, providing email & password, email verification codes, two-factor authentication, OAuth with social providers, and passkey authentication, with session management using cookies and bearer tokens.

> [!WARNING]
> N.B. This project is still in early development. It is not ready for production use yet.
> It is currently only supporting Turso as the database. I plan to add support for other databases in the near future, such as SQLite, PostgreSQL, and MySQL.

## Usage

Simply pull the Docker image and use it with your app:

```bash
docker pull ghcr.io/eliottwantz/plock:latest
docker run -it --rm -p 5173:5173 ghcr.io/eliottwantz/plock:latest
```

or with docker compose:

```yaml
services:
  plock:
    image: ghcr.io/eliottwantz/plock:latest
    ports:
      - 5173:5173
    env_file:
      - .env
```

### Environment variables

Please check an example of the .env file in the example [examples/simple](./examples/simple/.env.example)

| Name                       | Description                                                                  |
| -------------------------- | ---------------------------------------------------------------------------- |
| `PORT`                     | The port to listen on. Defaults to 5173.                                     |
| `TURSO_URL`                | The URL of the turso server. Defaults to `http://host.docker.internal:8080`. |
| `TURSO_AUTH_TOKEN`         | The token of the turso server. Defaults to `null`.                           |
| `ENV`                      | The environment to run in, either `DEV` or `PROD`                            |
| `GOOGLE_CLIENT_ID`         | The client ID of the Google OAuth provider.                                  |
| `GOOGLE_CLIENT_SECRET`     | The client secret of the Google OAuth provider.                              |
| `GOOGLE_AUTH_CALLBACK_URL` | The callback URL of the Google OAuth provider.                               |
| `GITHUB_CLIENT_ID`         | The client ID of the GitHub OAuth provider.                                  |
| `GITHUB_CLIENT_SECRET`     | The client secret of the GitHub OAuth provider.                              |
| `PUBLIC_AUTH_ORIGIN`       | The origin of the Plock server.                                              |
| `PUBLIC_CALLBACK_URL`      | The callback URL where you want to be redirected after authentication.       |
| `PUBLIC_LOGOUT_URL`        | The URL where you want to be redirected after logout.                        |
| `PUBLIC_SITE_NAME`         | The name of your website.                                                    |
