import { serial, text, pgTable, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Define enums for task status and priority
export const taskStatusEnum = pgEnum('task_status', ['pending', 'completed']);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high']);

// Tasks table definition
export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable by default
  status: taskStatusEnum('status').notNull().default('pending'),
  priority: taskPriorityEnum('priority').notNull().default('medium'),
  due_date: timestamp('due_date', { withTimezone: true }), // Nullable by default
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// TypeScript types for the table schema
export type Task = typeof tasksTable.$inferSelect; // For SELECT operations
export type NewTask = typeof tasksTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { tasks: tasksTable };