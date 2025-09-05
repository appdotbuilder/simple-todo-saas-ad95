import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task, type GetTasksFilter } from '../schema';
import { eq, and, desc } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const getTasks = async (filter?: GetTasksFilter): Promise<Task[]> => {
  try {
    // Build base query with conditions
    const conditions: SQL<unknown>[] = [];

    if (filter?.status) {
      conditions.push(eq(tasksTable.status, filter.status));
    }

    if (filter?.priority) {
      conditions.push(eq(tasksTable.priority, filter.priority));
    }

    // Build the complete query in one go to avoid type issues
    let results;

    if (conditions.length === 0) {
      // No filters - simple query
      results = await db.select()
        .from(tasksTable)
        .orderBy(desc(tasksTable.created_at))
        .execute();
    } else if (conditions.length === 1) {
      // Single condition
      results = await db.select()
        .from(tasksTable)
        .where(conditions[0])
        .orderBy(desc(tasksTable.created_at))
        .execute();
    } else {
      // Multiple conditions
      results = await db.select()
        .from(tasksTable)
        .where(and(...conditions))
        .orderBy(desc(tasksTable.created_at))
        .execute();
    }

    return results;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }
};

export const getTaskById = async (id: number): Promise<Task | null> => {
  try {
    const results = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, id))
      .execute();

    // Return first result or null if not found
    return results[0] || null;
  } catch (error) {
    console.error('Failed to fetch task by ID:', error);
    throw error;
  }
};