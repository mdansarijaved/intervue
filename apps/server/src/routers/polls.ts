import { z } from "zod";
import { publicProcedure, router } from "../lib/trpc";

import type { Server } from "socket.io";
import prisma from "@/db";

const createPollSchema = z.object({
  question: z.string().min(1, "Question is required"),
  description: z.string().optional(),
  options: z
    .array(
      z.object({
        text: z.string().min(1, "Option text is required"),
        order: z.number().optional(),
      })
    )
    .min(2, "At least 2 options are required"),
  teacherName: z.string().min(1, "Teacher name is required"),
});

const startPollSchema = z.object({
  pollId: z.string(),
  duration: z.number().min(1).max(600).optional(),
});

const endPollSchema = z.object({
  pollId: z.string(),
});

export const pollsRouter = router({
  create: publicProcedure
    .input(createPollSchema)
    .mutation(async ({ input, ctx }) => {
      const { question, description, options, teacherName } = input;
      const io = (ctx as any).io as Server;

      let teacher = await prisma.user.findFirst({
        where: {
          name: teacherName,
          role: "TEACHER",
        },
      });

      if (!teacher) {
        teacher = await prisma.user.create({
          data: {
            name: teacherName,
            role: "TEACHER",
          },
        });
      }

      const poll = await prisma.poll.create({
        data: {
          question,
          description,
          status: "ACTIVE",
          createdById: teacher.id,
          options: {
            create: options.map((option, index) => ({
              text: option.text,
              order: option.order ?? index,
            })),
          },
        },
        include: {
          options: {
            orderBy: { order: "asc" },
          },
          createdBy: true,
          _count: {
            select: {
              votes: true,
            },
          },
        },
      });

      io.to("teacher").emit("poll-created", poll);

      return poll;
    }),

  start: publicProcedure
    .input(startPollSchema)
    .mutation(async ({ input, ctx }) => {
      const { pollId, duration } = input;
      const io = (ctx as any).io as Server;

      const poll = await prisma.poll.update({
        where: { id: pollId },
        data: {
          status: "ACTIVE",
          startedAt: new Date(),
          endsAt: duration ? new Date(Date.now() + duration * 1000) : null,
        },
        include: {
          options: {
            orderBy: { order: "asc" },
          },
          createdBy: true,
          _count: {
            select: {
              votes: true,
            },
          },
        },
      });

      io.to("teacher").emit("poll-started", poll);
      io.to("students").emit("poll-started", poll);
      io.to(`poll:${pollId}`).emit("poll-started", poll);

      if (duration) {
        setTimeout(async () => {
          try {
            const updatedPoll = await prisma.poll.update({
              where: { id: pollId },
              data: { status: "COMPLETED" },
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
                createdBy: true,
                _count: {
                  select: {
                    votes: true,
                  },
                },
              },
            });

            io.to("teacher").emit("poll-ended", updatedPoll);
            io.to("students").emit("poll-ended", updatedPoll);
            io.to(`poll:${pollId}`).emit("poll-ended", updatedPoll);
          } catch (error) {
            console.error("Error auto-ending poll:", error);
          }
        }, duration * 1000);
      }

      return poll;
    }),

  end: publicProcedure.input(endPollSchema).mutation(async ({ input, ctx }) => {
    const { pollId } = input;
    const io = (ctx as any).io as Server;

    const poll = await prisma.poll.update({
      where: { id: pollId },
      data: { status: "COMPLETED" },
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
        createdBy: true,
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });

    io.to("teacher").emit("poll-ended", poll);
    io.to("students").emit("poll-ended", poll);
    io.to(`poll:${pollId}`).emit("poll-ended", poll);

    return poll;
  }),

  getAll: publicProcedure.query(async () => {
    return await prisma.poll.findMany({
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
        createdBy: true,
        _count: {
          select: {
            votes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  getById: publicProcedure
    .input(z.object({ pollId: z.string() }))
    .query(async ({ input }) => {
      const { pollId } = input;

      return await prisma.poll.findUnique({
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
          createdBy: true,
          votes: {
            include: {
              user: true,
              pollOption: true,
            },
          },
          _count: {
            select: {
              votes: true,
            },
          },
        },
      });
    }),

  getLiveResults: publicProcedure
    .input(z.object({ pollId: z.string() }))
    .query(async ({ input }) => {
      const { pollId } = input;

      const poll = await prisma.poll.findUnique({
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

      if (!poll) {
        throw new Error("Poll not found");
      }

      const totalVotes = poll._count.votes;
      const results = poll.options.map(
        (option: { id: string; text: string; _count: { votes: number } }) => ({
          id: option.id,
          text: option.text,
          votes: option._count.votes,
          percentage:
            totalVotes > 0
              ? Math.round((option._count.votes / totalVotes) * 100)
              : 0,
        })
      );

      return {
        poll: {
          id: poll.id,
          question: poll.question,
          status: poll.status,
          totalVotes,
        },
        results,
      };
    }),

  canStartNewPoll: publicProcedure.query(async () => {
    const activePoll = await prisma.poll.findFirst({
      where: { status: "ACTIVE" },
    });

    return {
      canStart: !activePoll,
      activePollId: activePoll?.id || null,
    };
  }),

  getActivePoll: publicProcedure.query(async () => {
    const activePoll = await prisma.poll.findFirst({
      where: { status: "ACTIVE" },
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
        createdBy: true,
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });

    if (!activePoll) {
      return null;
    }

    return {
      ...activePoll,
      totalVotes: activePoll._count.votes,
      options: activePoll.options.map(
        (option: {
          id: string;
          text: string;
          order: number;
          _count: { votes: number };
        }) => ({
          id: option.id,
          text: option.text,
          order: option.order,
          votes: option._count.votes,
          percentage:
            activePoll._count.votes > 0
              ? Math.round(
                  (option._count.votes / activePoll._count.votes) * 100
                )
              : 0,
        })
      ),
    };
  }),

  getNextPollForStudent: publicProcedure
    .input(z.object({ studentName: z.string() }))
    .query(async ({ input }) => {
      const { studentName } = input;

      const student = await prisma.user.findFirst({
        where: {
          name: studentName,
          role: "STUDENT",
        },
      });

      if (!student) {
        return null;
      }

      const nextPoll = await prisma.poll.findFirst({
        where: {
          status: "ACTIVE",
          votes: {
            none: {
              userId: student.id,
            },
          },
        },
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
          createdBy: true,
          _count: {
            select: {
              votes: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      if (!nextPoll) {
        return null;
      }

      return {
        ...nextPoll,
        totalVotes: nextPoll._count.votes,
        options: nextPoll.options.map(
          (option: {
            id: string;
            text: string;
            order: number;
            _count: { votes: number };
          }) => ({
            id: option.id,
            text: option.text,
            order: option.order,
            votes: option._count.votes,
            percentage:
              nextPoll._count.votes > 0
                ? Math.round(
                    (option._count.votes / nextPoll._count.votes) * 100
                  )
                : 0,
          })
        ),
      };
    }),

  getStudentPollProgress: publicProcedure
    .input(z.object({ studentName: z.string() }))
    .query(async ({ input }) => {
      const { studentName } = input;

      const student = await prisma.user.findFirst({
        where: {
          name: studentName,
          role: "STUDENT",
        },
      });

      if (!student) {
        return { totalPolls: 0, answeredPolls: 0, currentPollNumber: 0 };
      }

      const totalPolls = await prisma.poll.count({
        where: { status: "ACTIVE" },
      });

      const answeredPolls = await prisma.vote.count({
        where: {
          userId: student.id,
          poll: { status: "ACTIVE" },
        },
      });

      return {
        totalPolls,
        answeredPolls,
        currentPollNumber: answeredPolls + 1,
      };
    }),

  getParticipants: publicProcedure
    .input(z.object({ teacherName: z.string().optional() }))
    .query(async ({ input }) => {
      const { teacherName } = input;

      const polls = await prisma.poll.findMany({
        where: teacherName
          ? { createdBy: { name: teacherName, role: "TEACHER" } }
          : {},
        select: { id: true },
      });

      const pollIds = polls.map((p: { id: string }) => p.id);
      if (pollIds.length === 0) return [] as { id: string; name: string }[];

      const voters = await prisma.user.findMany({
        where: {
          role: "STUDENT",
          votes: {
            some: { pollId: { in: pollIds } },
          },
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });

      return voters;
    }),
});
