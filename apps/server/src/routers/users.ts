import { z } from "zod";
import { publicProcedure, router } from "../lib/trpc";
import prisma from "@/db";

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  role: z.enum(["TEACHER", "STUDENT"]),
});

const getUserSchema = z.object({
  name: z.string(),
  role: z.enum(["TEACHER", "STUDENT"]),
});

export const usersRouter = router({
  create: publicProcedure
    .input(createUserSchema)
    .mutation(async ({ input }) => {
      const { name, role } = input;

      const existingUser = await prisma.user.findFirst({
        where: {
          name: name.trim(),
          role,
        },
      });

      if (existingUser) {
        return existingUser;
      }

      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          role,
        },
      });

      return user;
    }),

  getByNameAndRole: publicProcedure
    .input(getUserSchema)
    .query(async ({ input }) => {
      const { name, role } = input;

      const user = await prisma.user.findFirst({
        where: {
          name: name.trim(),
          role,
        },
      });

      return user;
    }),
});
