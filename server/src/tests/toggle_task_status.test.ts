import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type ToggleTaskStatusInput } from '../schema';
import { toggleTaskStatus } from '../handlers/toggle_task_status';
import { eq } from 'drizzle-orm';

describe('toggleTaskStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should toggle task from pending to completed', async () => {
    // Create a pending task
    const createdTasks = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A test task',
        status: 'pending',
        priority: 'medium'
      })
      .returning()
      .execute();

    const createdTask = createdTasks[0];
    expect(createdTask.status).toBe('pending');

    const input: ToggleTaskStatusInput = {
      id: createdTask.id
    };

    // Toggle status
    const result = await toggleTaskStatus(input);

    // Verify the status was toggled
    expect(result.id).toBe(createdTask.id);
    expect(result.status).toBe('completed');
    expect(result.title).toBe('Test Task');
    expect(result.description).toBe('A test task');
    expect(result.priority).toBe('medium');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Verify updated_at was changed (should be more recent)
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime());
  });

  it('should toggle task from completed to pending', async () => {
    // Create a completed task
    const createdTasks = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: 'An already completed task',
        status: 'completed',
        priority: 'high'
      })
      .returning()
      .execute();

    const createdTask = createdTasks[0];
    expect(createdTask.status).toBe('completed');

    const input: ToggleTaskStatusInput = {
      id: createdTask.id
    };

    // Toggle status back to pending
    const result = await toggleTaskStatus(input);

    // Verify the status was toggled back
    expect(result.id).toBe(createdTask.id);
    expect(result.status).toBe('pending');
    expect(result.title).toBe('Completed Task');
    expect(result.description).toBe('An already completed task');
    expect(result.priority).toBe('high');
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify updated_at was changed
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime());
  });

  it('should persist changes to database', async () => {
    // Create a pending task
    const createdTasks = await db.insert(tasksTable)
      .values({
        title: 'Database Test Task',
        status: 'pending',
        priority: 'low'
      })
      .returning()
      .execute();

    const createdTask = createdTasks[0];

    const input: ToggleTaskStatusInput = {
      id: createdTask.id
    };

    // Toggle status
    await toggleTaskStatus(input);

    // Query the database directly to verify the change was persisted
    const updatedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(updatedTasks).toHaveLength(1);
    const updatedTask = updatedTasks[0];
    expect(updatedTask.status).toBe('completed');
    expect(updatedTask.updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime());
  });

  it('should handle tasks with due dates correctly', async () => {
    const dueDate = new Date('2024-12-31T10:00:00Z');
    
    // Create a task with a due date
    const createdTasks = await db.insert(tasksTable)
      .values({
        title: 'Task with Due Date',
        description: null,
        status: 'pending',
        priority: 'medium',
        due_date: dueDate
      })
      .returning()
      .execute();

    const createdTask = createdTasks[0];

    const input: ToggleTaskStatusInput = {
      id: createdTask.id
    };

    // Toggle status
    const result = await toggleTaskStatus(input);

    // Verify due date is preserved and properly converted
    expect(result.status).toBe('completed');
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.due_date?.getTime()).toBe(dueDate.getTime());
  });

  it('should throw error when task does not exist', async () => {
    const input: ToggleTaskStatusInput = {
      id: 99999 // Non-existent task ID
    };

    // Should throw error for non-existent task
    await expect(toggleTaskStatus(input)).rejects.toThrow(/not found/i);
  });

  it('should handle multiple toggles correctly', async () => {
    // Create a pending task
    const createdTasks = await db.insert(tasksTable)
      .values({
        title: 'Multiple Toggle Test',
        status: 'pending',
        priority: 'medium'
      })
      .returning()
      .execute();

    const createdTask = createdTasks[0];
    const input: ToggleTaskStatusInput = {
      id: createdTask.id
    };

    // First toggle: pending -> completed
    const firstToggle = await toggleTaskStatus(input);
    expect(firstToggle.status).toBe('completed');

    // Second toggle: completed -> pending
    const secondToggle = await toggleTaskStatus(input);
    expect(secondToggle.status).toBe('pending');
    expect(secondToggle.updated_at.getTime()).toBeGreaterThan(firstToggle.updated_at.getTime());

    // Third toggle: pending -> completed
    const thirdToggle = await toggleTaskStatus(input);
    expect(thirdToggle.status).toBe('completed');
    expect(thirdToggle.updated_at.getTime()).toBeGreaterThan(secondToggle.updated_at.getTime());
  });
});