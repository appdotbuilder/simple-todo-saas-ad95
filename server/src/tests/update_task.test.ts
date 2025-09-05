import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type Task } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Test input for creating a base task
const baseTaskInput = {
  title: 'Original Task',
  description: 'Original description',
  priority: 'low' as const,
  due_date: new Date('2024-12-31'),
  status: 'pending' as const
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let createdTaskId: number;

  beforeEach(async () => {
    // Create a base task for testing updates
    const result = await db.insert(tasksTable)
      .values(baseTaskInput)
      .returning()
      .execute();
    createdTaskId = result[0].id;
  });

  it('should update a task with all fields', async () => {
    const updateInput: UpdateTaskInput = {
      id: createdTaskId,
      title: 'Updated Task',
      description: 'Updated description',
      status: 'completed',
      priority: 'high',
      due_date: new Date('2025-01-15')
    };

    const result = await updateTask(updateInput);

    // Verify all fields are updated
    expect(result.id).toEqual(createdTaskId);
    expect(result.title).toEqual('Updated Task');
    expect(result.description).toEqual('Updated description');
    expect(result.status).toEqual('completed');
    expect(result.priority).toEqual('high');
    expect(result.due_date).toEqual(new Date('2025-01-15'));
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const updateInput: UpdateTaskInput = {
      id: createdTaskId,
      title: 'Partially Updated Task',
      status: 'completed'
    };

    const result = await updateTask(updateInput);

    // Updated fields
    expect(result.title).toEqual('Partially Updated Task');
    expect(result.status).toEqual('completed');
    
    // Unchanged fields should remain the same
    expect(result.description).toEqual('Original description');
    expect(result.priority).toEqual('low');
    expect(result.due_date).toEqual(new Date('2024-12-31'));
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update task in database', async () => {
    const updateInput: UpdateTaskInput = {
      id: createdTaskId,
      title: 'Database Updated Task',
      priority: 'medium'
    };

    await updateTask(updateInput);

    // Verify changes persisted in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTaskId))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Database Updated Task');
    expect(tasks[0].priority).toEqual('medium');
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null values correctly', async () => {
    const updateInput: UpdateTaskInput = {
      id: createdTaskId,
      description: null,
      due_date: null
    };

    const result = await updateTask(updateInput);

    expect(result.description).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.title).toEqual('Original Task'); // Should remain unchanged
  });

  it('should update updated_at timestamp', async () => {
    // Get original timestamp
    const originalTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTaskId))
      .execute();
    
    const originalUpdatedAt = originalTask[0].updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateTaskInput = {
      id: createdTaskId,
      title: 'Timestamp Test'
    };

    const result = await updateTask(updateInput);

    // Verify updated_at was changed
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error for non-existent task', async () => {
    const updateInput: UpdateTaskInput = {
      id: 99999, // Non-existent ID
      title: 'This should fail'
    };

    await expect(updateTask(updateInput)).rejects.toThrow(/Task with id 99999 not found/i);
  });

  it('should handle minimal update correctly', async () => {
    const updateInput: UpdateTaskInput = {
      id: createdTaskId
      // Only ID provided - should still update updated_at
    };

    const result = await updateTask(updateInput);

    // All original values should be preserved
    expect(result.title).toEqual('Original Task');
    expect(result.description).toEqual('Original description');
    expect(result.status).toEqual('pending');
    expect(result.priority).toEqual('low');
    expect(result.due_date).toEqual(new Date('2024-12-31'));
    
    // But updated_at should be changed
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should preserve created_at when updating', async () => {
    // Get original created_at
    const originalTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTaskId))
      .execute();
    
    const originalCreatedAt = originalTask[0].created_at;

    const updateInput: UpdateTaskInput = {
      id: createdTaskId,
      title: 'Created At Test'
    };

    const result = await updateTask(updateInput);

    // created_at should remain unchanged
    expect(result.created_at.getTime()).toEqual(originalCreatedAt.getTime());
    // But updated_at should be different
    expect(result.updated_at.getTime()).not.toEqual(originalCreatedAt.getTime());
  });
});