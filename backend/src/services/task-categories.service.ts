import { pool } from '../config/database.ts';

export interface TaskCategory {
  category_id: number;
  display_name: string;
  task_count: number;
}

export interface TaskCategoryTasks extends TaskCategory {
  tasks: string[];
}

const taskCategorySelection = `
  category_id,
  display_name,
  COALESCE(tasks, ARRAY[]::text[]) AS tasks,
  cardinality(COALESCE(tasks, ARRAY[]::text[])) AS task_count
`;

export async function getTaskCategories(): Promise<TaskCategory[]> {
  const { rows } = await pool.query<TaskCategory>(`
    SELECT category_id, display_name,
      cardinality(COALESCE(tasks, ARRAY[]::text[])) AS task_count
    FROM event_categories
    ORDER BY category_id
  `);
  return rows;
}

export async function getTaskCategory(
  categoryId: number,
): Promise<TaskCategoryTasks | undefined> {
  const { rows } = await pool.query<TaskCategoryTasks>(
    `
      SELECT ${taskCategorySelection}
      FROM event_categories
      WHERE category_id = $1
      LIMIT 1
    `,
    [categoryId],
  );
  return rows[0];
}

export async function addCategoryTask(
  categoryId: number,
  task: string,
): Promise<TaskCategoryTasks | undefined> {
  const { rows } = await pool.query<TaskCategoryTasks>(
    `
      UPDATE event_categories
      SET tasks = array_append(COALESCE(tasks, ARRAY[]::text[]), $2::text)
      WHERE category_id = $1
      RETURNING ${taskCategorySelection}
    `,
    [categoryId, task],
  );
  return rows[0];
}

export async function deleteCategoryTask(
  categoryId: number,
  taskIndex: number,
): Promise<TaskCategoryTasks | undefined> {
  const { rows } = await pool.query<TaskCategoryTasks>(
    `
      UPDATE event_categories
      SET tasks = ARRAY(
        SELECT item.task
        FROM unnest(COALESCE(tasks, ARRAY[]::text[]))
          WITH ORDINALITY AS item(task, task_index)
        WHERE item.task_index <> $2
        ORDER BY item.task_index
      )
      WHERE category_id = $1
        AND $2 <= cardinality(COALESCE(tasks, ARRAY[]::text[]))
      RETURNING ${taskCategorySelection}
    `,
    [categoryId, taskIndex + 1],
  );
  return rows[0];
}

export async function moveCategoryTask(
  categoryId: number,
  fromIndex: number,
  toIndex: number,
): Promise<TaskCategoryTasks | undefined> {
  const { rows } = await pool.query<TaskCategoryTasks>(
    `
      UPDATE event_categories
      SET tasks = ARRAY(
        SELECT item.task
        FROM unnest(COALESCE(tasks, ARRAY[]::text[]))
          WITH ORDINALITY AS item(task, task_index)
        ORDER BY CASE
          WHEN item.task_index = $2 + 1 THEN $3 + 1
          WHEN $2 < $3 AND item.task_index > $2 + 1 AND item.task_index <= $3 + 1
            THEN item.task_index - 1
          WHEN $2 > $3 AND item.task_index >= $3 + 1 AND item.task_index < $2 + 1
            THEN item.task_index + 1
          ELSE item.task_index
        END
      )
      WHERE category_id = $1
        AND $2 < cardinality(COALESCE(tasks, ARRAY[]::text[]))
        AND $3 < cardinality(COALESCE(tasks, ARRAY[]::text[]))
      RETURNING ${taskCategorySelection}
    `,
    [categoryId, fromIndex, toIndex],
  );
  return rows[0];
}
