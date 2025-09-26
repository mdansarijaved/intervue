import { z } from "zod";
import { publicProcedure, router } from "../lib/trpc";

import type { Server } from "socket.io";
import prisma from "@/db";

const submitVoteSchema = z.object({
  pollId: z.string(),
  optionId: z.string(),
  studentName: z.string().min(1, "Student name is required"),
});

export const votesRouter = router({
  submit: publicProcedure
    .input(submitVoteSchema)
    .mutation(async ({ input, ctx }) => {
      const { pollId, optionId, studentName } = input;
      const io = (ctx as any).io as Server;

      const poll = await prisma.poll.findUnique({
        where: { id: pollId },
        include: {
          options: true,
        },
      });

      if (!poll) {
        throw new Error("Poll not found");
      }

      if (poll.status !== "ACTIVE") {
        throw new Error("Poll is not active");
      }

      if (poll.endsAt && new Date() > poll.endsAt) {
        throw new Error("Poll has ended");
      }

      const option = poll.options.find(
        (opt: { id: string }) => opt.id === optionId
      );
      if (!option) {
        throw new Error("Invalid option for this poll");
      }

      let student = await prisma.user.findFirst({
        where: {
          name: studentName,
          role: "STUDENT",
        },
      });

      if (!student) {
        student = await prisma.user.create({
          data: {
            name: studentName,
            role: "STUDENT",
          },
        });
      }

      const existingVote = await prisma.vote.findUnique({
        where: {
          pollId_userId: {
            pollId,
            userId: student.id,
          },
        },
      });

      if (existingVote) {
        throw new Error("You have already voted in this poll");
      }

      const vote = await prisma.vote.create({
        data: {
          pollId,
          pollOptionId: optionId,
          userId: student.id,
        },
        include: {
          user: true,
          pollOption: true,
        },
      });

      const updatedPoll = await prisma.poll.findUnique({
        where: { id: pollId },
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
      });

      if (updatedPoll) {
        const totalVotes = updatedPoll._count.votes;
        const results = updatedPoll.options.map(
          (option: {
            id: string;
            text: string;
            _count: { votes: number };
          }) => ({
            id: option.id,
            text: option.text,
            votes: option._count.votes,
            percentage:
              totalVotes > 0
                ? Math.round((option._count.votes / totalVotes) * 100)
                : 0,
          })
        );

        const liveResults = {
          poll: {
            id: updatedPoll.id,
            question: updatedPoll.question,
            status: updatedPoll.status,
            totalVotes,
          },
          results,
        };

        io.to("teacher").emit("vote-submitted", {
          vote,
          liveResults,
        });
        io.to("students").emit("vote-submitted", {
          vote,
          liveResults,
        });
        io.to(`poll:${pollId}`).emit("vote-submitted", {
          vote,
          liveResults,
        });
      }

      return vote;
    }),

  hasVoted: publicProcedure
    .input(
      z.object({
        pollId: z.string(),
        studentName: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { pollId, studentName } = input;

      const student = await prisma.user.findFirst({
        where: {
          name: studentName,
          role: "STUDENT",
        },
      });

      if (!student) {
        return { hasVoted: false };
      }

      const vote = await prisma.vote.findUnique({
        where: {
          pollId_userId: {
            pollId,
            userId: student.id,
          },
        },
        include: {
          pollOption: true,
        },
      });

      return {
        hasVoted: !!vote,
        selectedOption: vote?.pollOption || null,
      };
    }),

  getByPoll: publicProcedure
    .input(z.object({ pollId: z.string() }))
    .query(async ({ input }) => {
      const { pollId } = input;

      return await prisma.vote.findMany({
        where: { pollId },
        include: {
          user: true,
          pollOption: true,
        },
        orderBy: { submittedAt: "desc" },
      });
    }),
});
