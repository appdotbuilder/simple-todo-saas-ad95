import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInputWithAllFields: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing',
  priority: 'high',
  due_date: new Date('2024-12-31')
};

// Test input with minimal required fields
const testInputMinimal: CreateTaskInput = {
  title: 'Minimal Task',
  description: null,
  priority: 'medium', // Zod default
  due_date: null
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with all fields', async () => {
    const result = await createTask(testInputWithAllFields);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.priority).toEqual('high');
    expect(result.status).toEqual('pending'); // Database default
    expect(result.due_date).toEqual(new Date('2024-12-31'));
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task with minimal fields', async () => {
    const result = await createTask(testInputMinimal);

    // Verify minimal fields
    expect(result.title).toEqual('Minimal Task');
    expect(result.description).toBeNull();
    expect(result.priority).toEqual('medium');
    expect(result.status).toEqual('pending');
    expect(result.due_date).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(testInputWithAllFields);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    const savedTask = tasks[0];
    
    expect(savedTask.title).toEqual('Test Task');
    expect(savedTask.description).toEqual('A task for testing');
    expect(savedTask.priority).toEqual('high');
    expect(savedTask.status).toEqual('pending');
    expect(savedTask.due_date).toEqual(new Date('2024-12-31'));
    expect(savedTask.created_at).toBeInstanceOf(Date);
    expect(savedTask.updated_at).toBeInstanceOf(Date);
  });

  it('should apply database defaults correctly', async () => {
    // Create task without explicitly setting status (should use DB default)
    const result = await createTask(testInputMinimal);

    // Verify database defaults were applied
    expect(result.status).toEqual('pending');
    expect(result.priority).toEqual('medium');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify timestamps are recent (within last minute)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(oneMinuteAgo.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(now.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(oneMinuteAgo.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(now.getTime());
  });

  it('should handle different priority levels', async () => {
    const lowPriorityInput: CreateTaskInput = {
      title: 'Low Priority Task',
      description: null,
      priority: 'low',
      due_date: null
    };

    const highPriorityInput: CreateTaskInput = {
      title: 'High Priority Task',
      description: null,
      priority: 'high',
      due_date: null
    };

    const lowTask = await createTask(lowPriorityInput);
    const highTask = await createTask(highPriorityInput);

    expect(lowTask.priority).toEqual('low');
    expect(highTask.priority).toEqual('high');
    
    // Verify they were saved correctly
    const tasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(tasks).toHaveLength(2);
    const priorities = tasks.map(t => t.priority);
    expect(priorities).toContain('low');
    expect(priorities).toContain('high');
  });

  it('should handle future and null due dates', async () => {
    const futureDate = new Date('2025-06-15T10:30:00Z');
    
    const taskWithDueDate: CreateTaskInput = {
      title: 'Task with Due Date',
      description: null,
      priority: 'medium',
      due_date: futureDate
    };

    const taskWithoutDueDate: CreateTaskInput = {
      title: 'Task without Due Date',
      description: null,
      priority: 'medium',
      due_date: null
    };

    const taskWithDue = await createTask(taskWithDueDate);
    const taskWithoutDue = await createTask(taskWithoutDueDate);

    expect(taskWithDue.due_date).toEqual(futureDate);
    expect(taskWithoutDue.due_date).toBeNull();
  });

  it('should create multiple tasks with unique IDs', async () => {
    const task1 = await createTask({
      title: 'Task 1',
      description: null,
      priority: 'low',
      due_date: null
    });

    const task2 = await createTask({
      title: 'Task 2',
      description: null,
      priority: 'high',
      due_date: null
    });

    // Ensure unique IDs
    expect(task1.id).not.toEqual(task2.id);
    expect(typeof task1.id).toBe('number');
    expect(typeof task2.id).toBe('number');

    // Verify both saved to database
    const allTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(allTasks).toHaveLength(2);
    const titles = allTasks.map(t => t.title);
    expect(titles).toContain('Task 1');
    expect(titles).toContain('Task 2');
  });
});