import { z } from 'zod';

// Task status enum
export const taskStatusSchema = z.enum(['pending', 'completed']);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

// Priority levels
export const taskPrioritySchema = z.enum(['low', 'medium', 'high']);
export type TaskPriority = z.infer<typeof taskPrioritySchema>;

// Task schema with proper type handling
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  due_date: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Input schema for creating tasks
export const createTaskInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").nullable(),
  priority: taskPrioritySchema.default('medium'),
  due_date: z.coerce.date().nullable()
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating tasks
export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").max(200, "Title too long").optional(),
  description: z.string().max(1000, "Description too long").nullable().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  due_date: z.coerce.date().nullable().optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Input schema for deleting tasks
export const deleteTaskInputSchema = z.object({
  id: z.number()
});

export type DeleteTaskInput = z.infer<typeof deleteTaskInputSchema>;

// Input schema for toggling task completion status
export const toggleTaskStatusInputSchema = z.object({
  id: z.number()
});

export type ToggleTaskStatusInput = z.infer<typeof toggleTaskStatusInputSchema>;

// Filter schema for querying tasks
export const getTasksFilterSchema = z.object({
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional()
});

export type GetTasksFilter = z.infer<typeof getTasksFilterSchema>;