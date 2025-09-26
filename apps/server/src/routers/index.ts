import { publicProcedure, router } from "../lib/trpc";
import { pollsRouter } from "./polls";
import { votesRouter } from "./votes";
import { teacherRouter } from "./teacher";
import { usersRouter } from "./users";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  polls: pollsRouter,
  votes: votesRouter,
  teacher: teacherRouter,
  users: usersRouter,
});
export type AppRouter = typeof appRouter;
