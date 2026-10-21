export interface TaskCategory {
  category_id: number;
  display_name: string;
  task_count: number;
}

export interface TaskCategoryTasks extends TaskCategory {
  tasks: string[];
}

export const CHECKLIST_TASKS_UPDATED_EVENT = 'checklist-tasks-updated';

function normalizeCategoryName(name: string): string {
  return name
    .normalize('NFKC')
    .replace(/[״׳"]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('he');
}

function normalizeTask(task: string): string {
  return task.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('he');
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

async function readError(response: Response): Promise<string> {
  const body = await response.text();
  if (body) {
    try {
      const payload: unknown = JSON.parse(body);
      if (
        typeof payload === 'object' &&
        payload !== null &&
        'error' in payload &&
        typeof payload.error === 'string'
      ) {
        return payload.error;
      }
    } catch {
      return body;
    }
  }
  return `בקשת השרת נכשלה (${response.status})`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return (await response.json()) as T;
}

export function getTaskCategories(): Promise<TaskCategory[]> {
  return request('/task-categories');
}

export function getCategoryTasks(
  categoryId: number,
): Promise<TaskCategoryTasks> {
  return request(`/task-categories/${categoryId}/tasks`);
}

export async function getTasksForCategories(
  categoryNames: string[],
): Promise<string[]> {
  if (categoryNames.length === 0) return [];

  const categories = await getTaskCategories();
  const requestedNames = new Set(categoryNames.map(normalizeCategoryName));
  const matchingCategories = categories.filter(
    (category) =>
      requestedNames.has(normalizeCategoryName(category.display_name)) ||
      requestedNames.has(String(category.category_id)),
  );
  const categoryTasks = await Promise.all(
    matchingCategories.map((category) => getCategoryTasks(category.category_id)),
  );

  const seenTasks = new Set<string>();
  return categoryTasks.flatMap((category) =>
    category.tasks.flatMap((task) => {
      const normalizedTask = normalizeTask(task);
      if (!normalizedTask || seenTasks.has(normalizedTask)) return [];
      seenTasks.add(normalizedTask);
      return [task.trim().replace(/\s+/g, ' ')];
    }),
  );
}

export function addCategoryTask(
  categoryId: number,
  task: string,
): Promise<TaskCategoryTasks> {
  return updateCategoryTasks(
    `/task-categories/${categoryId}/tasks`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task }),
    },
  );
}

export function deleteCategoryTask(
  categoryId: number,
  taskIndex: number,
): Promise<TaskCategoryTasks> {
  return updateCategoryTasks(
    `/task-categories/${categoryId}/tasks/${taskIndex}`,
    { method: 'DELETE' },
  );
}

export function moveCategoryTask(
  categoryId: number,
  fromIndex: number,
  toIndex: number,
): Promise<TaskCategoryTasks> {
  return updateCategoryTasks(
    `/task-categories/${categoryId}/tasks/reorder`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromIndex, toIndex }),
    },
  );
}

async function updateCategoryTasks(
  path: string,
  init: RequestInit,
): Promise<TaskCategoryTasks> {
  const category = await request<TaskCategoryTasks>(path, init);
  window.dispatchEvent(new Event(CHECKLIST_TASKS_UPDATED_EVENT));
  return category;
}
