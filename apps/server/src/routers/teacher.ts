import { z } from "zod";
import { publicProcedure, router } from "../lib/trpc";
import prisma from "@/db";

export const teacherRouter = router({
  getDashboard: publicProcedure
    .input(z.object({ teacherName: z.string() }))
    .query(async ({ input }) => {
      const { teacherName } = input;

      const teacher = await prisma.user.findFirst({
        where: {
          name: teacherName,
          role: "TEACHER",
        },
      });

      if (!teacher) {
        return {
          teacher: null,
          polls: [],
          activePolls: [],
          canStartNewPoll: true,
        };
      }

      const polls = await prisma.poll.findMany({
        where: { createdById: teacher.id },
        include: {
          options: {
            orderBy: { order: "asc" },
            include: {
              _count: {
                select: {
                  votes: true,
                },
              },
            },
          },
          _count: {
            select: {
              votes: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const activePolls = await prisma.poll.findMany({
        where: { status: "ACTIVE" },
        include: {
          createdBy: true,
          options: {
            orderBy: { order: "asc" },
          },
        },
      });

      const canStartNewPoll = activePolls.length === 0;

      return {
        teacher,
        polls,
        activePolls,
        canStartNewPoll,
      };
    }),
});
