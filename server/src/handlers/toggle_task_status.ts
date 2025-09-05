import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type ToggleTaskStatusInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const toggleTaskStatus = async (input: ToggleTaskStatusInput): Promise<Task> => {
  try {
    // First, fetch the current task to get its status
    const existingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    if (existingTasks.length === 0) {
      throw new Error(`Task with id ${input.id} not found`);
    }

    const existingTask = existingTasks[0];
    
    // Toggle the status: 'pending' -> 'completed', 'completed' -> 'pending'
    const newStatus = existingTask.status === 'pending' ? 'completed' : 'pending';

    // Update the task with new status and updated timestamp
    const updatedTasks = await db.update(tasksTable)
      .set({
        status: newStatus,
        updated_at: new Date()
      })
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    const updatedTask = updatedTasks[0];
    
    // Return the updated task with proper date conversion
    return {
      ...updatedTask,
      created_at: new Date(updatedTask.created_at),
      updated_at: new Date(updatedTask.updated_at),
      due_date: updatedTask.due_date ? new Date(updatedTask.due_date) : null
    };
  } catch (error) {
    console.error('Toggle task status failed:', error);
    throw error;
  }
};