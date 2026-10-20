# combat

The API uses PostgreSQL. By default it connects to `teams` at `127.0.0.1:15432`
as `dbadmin` with SSL required. Set `DATABASE_URL` to override the connection,
and set `PGPASSWORD` in `.env` if the database requires a password. A password
can also be included in `DATABASE_URL`. The database must contain `events` and
the `events` columns defined by the database schema, including the `categories`
array.