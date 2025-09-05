import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schema types for validation
import { 
  createTaskInputSchema,
  updateTaskInputSchema,
  deleteTaskInputSchema,
  toggleTaskStatusInputSchema,
  getTasksFilterSchema
} from './schema';

// Import handlers
import { createTask } from './handlers/create_task';
import { getTasks, getTaskById } from './handlers/get_tasks';
import { updateTask } from './handlers/update_task';
import { deleteTask } from './handlers/delete_task';
import { toggleTaskStatus } from './handlers/toggle_task_status';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Task management routes
  createTask: publicProcedure
    .input(createTaskInputSchema)
    .mutation(({ input }) => createTask(input)),

  getTasks: publicProcedure
    .input(getTasksFilterSchema.optional())
    .query(({ input }) => getTasks(input)),

  getTaskById: publicProcedure
    .input(deleteTaskInputSchema) // Reuse the same schema since it just needs id
    .query(({ input }) => getTaskById(input.id)),

  updateTask: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),

  deleteTask: publicProcedure
    .input(deleteTaskInputSchema)
    .mutation(({ input }) => deleteTask(input)),

  toggleTaskStatus: publicProcedure
    .input(toggleTaskStatusInputSchema)
    .mutation(({ input }) => toggleTaskStatus(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();