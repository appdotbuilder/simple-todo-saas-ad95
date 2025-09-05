import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTasksFilter, type CreateTaskInput } from '../schema';
import { getTasks, getTaskById } from '../handlers/get_tasks';
import { eq } from 'drizzle-orm';

// Test data for creating tasks
const testTask1: Omit<CreateTaskInput, 'priority'> = {
  title: 'First Task',
  description: 'Description for first task',
  due_date: new Date('2024-12-31')
};

const testTask2: Omit<CreateTaskInput, 'priority'> = {
  title: 'Second Task',
  description: null,
  due_date: null
};

const testTask3: Omit<CreateTaskInput, 'priority'> = {
  title: 'Third Task',
  description: 'High priority urgent task',
  due_date: new Date('2024-06-15')
};

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();
    expect(result).toEqual([]);
  });

  it('should return all tasks without filter', async () => {
    // Create test tasks
    await db.insert(tasksTable).values([
      { ...testTask1, priority: 'medium' },
      { ...testTask2, priority: 'low' },
      { ...testTask3, priority: 'high' }
    ]).execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    
    // Verify all fields are present
    result.forEach(task => {
      expect(task.id).toBeDefined();
      expect(task.title).toBeDefined();
      expect(task.status).toBeDefined();
      expect(task.priority).toBeDefined();
      expect(task.created_at).toBeInstanceOf(Date);
      expect(task.updated_at).toBeInstanceOf(Date);
    });

    // Verify tasks are ordered by created_at descending
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at >= result[i + 1].created_at).toBe(true);
    }

    // Verify we have the expected tasks (order may vary due to timestamps)
    const titles = result.map(task => task.title);
    expect(titles).toContain('First Task');
    expect(titles).toContain('Second Task');
    expect(titles).toContain('Third Task');
  });

  it('should filter tasks by status', async () => {
    // Create tasks with different statuses
    const tasks = await db.insert(tasksTable).values([
      { ...testTask1, priority: 'medium', status: 'pending' },
      { ...testTask2, priority: 'low', status: 'completed' },
      { ...testTask3, priority: 'high', status: 'pending' }
    ]).returning().execute();

    // Update one task to completed status
    await db.update(tasksTable)
      .set({ status: 'completed' })
      .where(eq(tasksTable.id, tasks[0].id))
      .execute();

    const filter: GetTasksFilter = { status: 'completed' };
    const result = await getTasks(filter);

    expect(result).toHaveLength(2);
    result.forEach(task => {
      expect(task.status).toEqual('completed');
    });
  });

  it('should filter tasks by priority', async () => {
    // Create tasks with different priorities
    await db.insert(tasksTable).values([
      { ...testTask1, priority: 'high' },
      { ...testTask2, priority: 'low' },
      { ...testTask3, priority: 'high' }
    ]).execute();

    const filter: GetTasksFilter = { priority: 'high' };
    const result = await getTasks(filter);

    expect(result).toHaveLength(2);
    result.forEach(task => {
      expect(task.priority).toEqual('high');
    });
  });

  it('should filter tasks by both status and priority', async () => {
    // Create tasks with various combinations
    const tasks = await db.insert(tasksTable).values([
      { ...testTask1, priority: 'high', status: 'pending' },
      { ...testTask2, priority: 'high', status: 'completed' },
      { ...testTask3, priority: 'low', status: 'pending' }
    ]).returning().execute();

    // Update one task to match our filter criteria
    await db.update(tasksTable)
      .set({ status: 'completed' })
      .where(eq(tasksTable.id, tasks[0].id))
      .execute();

    const filter: GetTasksFilter = { status: 'completed', priority: 'high' };
    const result = await getTasks(filter);

    expect(result).toHaveLength(2);
    result.forEach(task => {
      expect(task.status).toEqual('completed');
      expect(task.priority).toEqual('high');
    });
  });

  it('should return tasks ordered by created_at descending', async () => {
    // Create tasks with slight delay to ensure different timestamps
    const task1 = await db.insert(tasksTable).values({
      ...testTask1,
      priority: 'medium'
    }).returning().execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const task2 = await db.insert(tasksTable).values({
      ...testTask2,
      priority: 'low'
    }).returning().execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const task3 = await db.insert(tasksTable).values({
      ...testTask3,
      priority: 'high'
    }).returning().execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    // Most recently created should be first
    expect(result[0].id).toEqual(task3[0].id);
    expect(result[1].id).toEqual(task2[0].id);
    expect(result[2].id).toEqual(task1[0].id);

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });
});

describe('getTaskById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when task does not exist', async () => {
    const result = await getTaskById(999);
    expect(result).toBeNull();
  });

  it('should return task when it exists', async () => {
    // Create a test task
    const created = await db.insert(tasksTable).values({
      ...testTask1,
      priority: 'high'
    }).returning().execute();

    const taskId = created[0].id;
    const result = await getTaskById(taskId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(taskId);
    expect(result!.title).toEqual('First Task');
    expect(result!.description).toEqual('Description for first task');
    expect(result!.priority).toEqual('high');
    expect(result!.status).toEqual('pending'); // Default value
    expect(result!.due_date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle tasks with null values correctly', async () => {
    // Create task with null description and due_date
    const created = await db.insert(tasksTable).values({
      ...testTask2,
      priority: 'medium'
    }).returning().execute();

    const taskId = created[0].id;
    const result = await getTaskById(taskId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(taskId);
    expect(result!.title).toEqual('Second Task');
    expect(result!.description).toBeNull();
    expect(result!.due_date).toBeNull();
    expect(result!.priority).toEqual('medium');
    expect(result!.status).toEqual('pending');
  });

  it('should return the correct task when multiple tasks exist', async () => {
    // Create multiple tasks
    const tasks = await db.insert(tasksTable).values([
      { ...testTask1, priority: 'high' },
      { ...testTask2, priority: 'medium' },
      { ...testTask3, priority: 'low' }
    ]).returning().execute();

    // Get the middle task
    const targetTaskId = tasks[1].id;
    const result = await getTaskById(targetTaskId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(targetTaskId);
    expect(result!.title).toEqual('Second Task');
    expect(result!.priority).toEqual('medium');
  });
});