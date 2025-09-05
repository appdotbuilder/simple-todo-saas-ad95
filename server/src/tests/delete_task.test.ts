import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput, type CreateTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

// Helper function to create a test task
const createTestTask = async (taskData: Partial<CreateTaskInput> = {}) => {
  const defaultTask = {
    title: 'Test Task',
    description: 'A task for testing',
    priority: 'medium' as const,
    due_date: null
  };

  const taskInput = { ...defaultTask, ...taskData };

  const result = await db.insert(tasksTable)
    .values({
      title: taskInput.title,
      description: taskInput.description,
      priority: taskInput.priority,
      due_date: taskInput.due_date
    })
    .returning()
    .execute();

  return result[0];
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // Create a test task first
    const task = await createTestTask();
    const input: DeleteTaskInput = { id: task.id };

    // Delete the task
    const result = await deleteTask(input);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify task is actually deleted from database
    const deletedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();

    expect(deletedTasks).toHaveLength(0);
  });

  it('should throw error when task does not exist', async () => {
    const nonExistentId = 99999;
    const input: DeleteTaskInput = { id: nonExistentId };

    // Attempt to delete non-existent task should throw error
    await expect(deleteTask(input)).rejects.toThrow(/not found/i);
  });

  it('should delete task with different priorities', async () => {
    // Create tasks with different priorities
    const lowPriorityTask = await createTestTask({ priority: 'low' });
    const highPriorityTask = await createTestTask({ priority: 'high' });

    // Delete both tasks
    await deleteTask({ id: lowPriorityTask.id });
    await deleteTask({ id: highPriorityTask.id });

    // Verify both tasks are deleted
    const remainingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, lowPriorityTask.id))
      .execute();
    
    const remainingHighTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, highPriorityTask.id))
      .execute();

    expect(remainingTasks).toHaveLength(0);
    expect(remainingHighTasks).toHaveLength(0);
  });

  it('should delete task with complex data', async () => {
    // Create a task with all fields populated
    const complexTask = await createTestTask({
      title: 'Complex Task with Long Title and Special Characters !@#$%',
      description: 'A very detailed description with multiple lines\nand special characters: !@#$%^&*()',
      priority: 'high',
      due_date: new Date('2024-12-31T23:59:59Z')
    });

    const input: DeleteTaskInput = { id: complexTask.id };

    // Delete the complex task
    const result = await deleteTask(input);

    expect(result.success).toBe(true);

    // Verify deletion
    const deletedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, complexTask.id))
      .execute();

    expect(deletedTasks).toHaveLength(0);
  });

  it('should not affect other tasks when deleting one', async () => {
    // Create multiple tasks
    const task1 = await createTestTask({ title: 'Task 1' });
    const task2 = await createTestTask({ title: 'Task 2' });
    const task3 = await createTestTask({ title: 'Task 3' });

    // Delete only the middle task
    await deleteTask({ id: task2.id });

    // Verify other tasks still exist
    const remainingTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(remainingTasks).toHaveLength(2);
    
    const taskIds = remainingTasks.map(t => t.id);
    expect(taskIds).toContain(task1.id);
    expect(taskIds).toContain(task3.id);
    expect(taskIds).not.toContain(task2.id);
  });

  it('should handle edge case with ID 0', async () => {
    // Try to delete task with ID 0 (should not exist)
    const input: DeleteTaskInput = { id: 0 };

    await expect(deleteTask(input)).rejects.toThrow(/not found/i);
  });
});