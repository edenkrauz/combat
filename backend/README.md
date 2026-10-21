# combat

The API uses PostgreSQL. By default it connects to `teams` at `127.0.0.1:15432`
as `dbadmin` with SSL required. Set `DATABASE_URL` to override the connection,
and set `PGPASSWORD` in `.env` if the database requires a password. A password
can also be included in `DATABASE_URL`. The database must contain `events` and
the `events` columns defined by the database schema, including the `categories`
array. Checklist task templates are stored in `event_categories.tasks`.

Checklist task routes:

- `GET /task-categories` lists categories and task counts.
- `GET /task-categories/:categoryId/tasks` returns the task list for a category.
- `POST /task-categories/:categoryId/tasks` appends `{ "task": "..." }`.
- `PATCH /task-categories/:categoryId/tasks/reorder` moves a task with
  `{ "fromIndex": 0, "toIndex": 1 }` (zero-based indexes).
- `DELETE /task-categories/:categoryId/tasks/:taskIndex` removes a task
  (zero-based index).
