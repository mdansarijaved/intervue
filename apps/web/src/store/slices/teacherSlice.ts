import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { trpcClient } from "@/utils/trpc";

interface PollOption {
  id?: string;
  text: string;
  order: number;
  votes?: number;
  percentage?: number;
  _count?: { votes: number };
}

interface Poll {
  id: string;
  question: string;
  description?: string | null;
  status: "DRAFT" | "ACTIVE" | "COMPLETED";
  options: PollOption[];
  totalVotes?: number;
  createdAt: string;
  startedAt?: string | null;
  endsAt?: string | null;
  _count?: { votes: number };
}

interface TeacherState {
  teacherName: string;
  currentPoll: Poll | null;
  polls: Poll[];
  canStartNewPoll: boolean;
  activePollId: string | null;
  isLoading: boolean;
  error: string | null;

  formData: {
    question: string;
    description: string;
    options: PollOption[];
  };
}

const initialState: TeacherState = {
  teacherName: "",
  currentPoll: null,
  polls: [],
  canStartNewPoll: true,
  activePollId: null,
  isLoading: false,
  error: null,
  formData: {
    question: "",
    description: "",
    options: [
      { text: "", order: 0 },
      { text: "", order: 1 },
    ],
  },
};

export const checkCanStartNewPoll = createAsyncThunk(
  "teacher/checkCanStartNewPoll",
  async () => {
    const response = await trpcClient.polls.canStartNewPoll.query();
    return response;
  }
);

export const createPoll = createAsyncThunk(
  "teacher/createPoll",
  async (pollData: {
    question: string;
    description?: string;
    options: PollOption[];
    teacherName: string;
  }) => {
    const response = await trpcClient.polls.create.mutate(pollData);
    return response;
  }
);

export const startPoll = createAsyncThunk(
  "teacher/startPoll",
  async (data: { pollId: string; duration?: number }) => {
    const response = await trpcClient.polls.start.mutate(data);
    return response;
  }
);

export const endPoll = createAsyncThunk(
  "teacher/endPoll",
  async (data: { pollId: string }) => {
    const response = await trpcClient.polls.end.mutate(data);
    return response;
  }
);

export const fetchTeacherPolls = createAsyncThunk(
  "teacher/fetchPolls",
  async () => {
    const response = await trpcClient.polls.getAll.query();
    return response;
  }
);

export const fetchPollResults = createAsyncThunk(
  "teacher/fetchPollResults",
  async (pollId: string) => {
    const response = await trpcClient.polls.getLiveResults.query({ pollId });
    return response;
  }
);

const teacherSlice = createSlice({
  name: "teacher",
  initialState,
  reducers: {
    setTeacherName: (state, action: PayloadAction<string>) => {
      state.teacherName = action.payload;
    },

    updateFormQuestion: (state, action: PayloadAction<string>) => {
      state.formData.question = action.payload;
    },

    updateFormDescription: (state, action: PayloadAction<string>) => {
      state.formData.description = action.payload;
    },

    updateFormOption: (
      state,
      action: PayloadAction<{ index: number; text: string }>
    ) => {
      const { index, text } = action.payload;
      if (state.formData.options[index]) {
        state.formData.options[index].text = text;
      }
    },

    addFormOption: (state) => {
      if (state.formData.options.length < 4) {
        const newOrder = state.formData.options.length;
        state.formData.options.push({ text: "", order: newOrder });
      }
    },

    removeFormOption: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (state.formData.options.length > 2) {
        state.formData.options.splice(index, 1);

        state.formData.options.forEach((option, idx) => {
          option.order = idx;
        });
      }
    },

    resetForm: (state) => {
      return {
        ...state,
        formData: {
          question: "",
          description: "",
          options: [
            { text: "", order: 0 },
            { text: "", order: 1 },
          ],
        },
      };
    },

    clearError: (state) => {
      state.error = null;
    },

    updatePollResults: (
      state,
      action: PayloadAction<{
        pollId: string;
        results: Array<{
          id: string;
          text: string;
          votes: number;
          percentage: number;
          order: number;
        }>;
        totalVotes: number;
      }>
    ) => {
      const { pollId, results, totalVotes } = action.payload;

      if (state.currentPoll && state.currentPoll.id === pollId) {
        state.currentPoll.options = results;
        state.currentPoll.totalVotes = totalVotes;
      }

      const pollIndex = state.polls.findIndex((p) => p.id === pollId);
      if (pollIndex !== -1) {
        state.polls[pollIndex].options = results;
        state.polls[pollIndex].totalVotes = totalVotes;
      }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(checkCanStartNewPoll.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkCanStartNewPoll.fulfilled, (state, action) => {
        state.isLoading = false;
        state.canStartNewPoll = action.payload.canStart;
        state.activePollId = action.payload.activePollId;
      })
      .addCase(checkCanStartNewPoll.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to check poll status";
      });

    builder
      .addCase(createPoll.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPoll.fulfilled, (state, action) => {
        state.isLoading = false;
        const poll = {
          ...action.payload,
          totalVotes: action.payload._count?.votes || 0,
        };
        state.polls.unshift(poll);

        state.formData = {
          question: "",
          description: "",
          options: [
            { text: "", order: 0 },
            { text: "", order: 1 },
          ],
        };
      })
      .addCase(createPoll.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to create poll";
      });

    builder
      .addCase(startPoll.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startPoll.fulfilled, (state, action) => {
        state.isLoading = false;
        const poll = {
          ...action.payload,
          totalVotes: action.payload._count?.votes || 0,
        };
        state.currentPoll = poll;
        state.canStartNewPoll = false;
        state.activePollId = poll.id;

        const pollIndex = state.polls.findIndex((p) => p.id === poll.id);
        if (pollIndex !== -1) {
          state.polls[pollIndex] = poll;
        }
      })
      .addCase(startPoll.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to start poll";
      });

    builder
      .addCase(endPoll.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(endPoll.fulfilled, (state, action) => {
        state.isLoading = false;
        state.canStartNewPoll = true;
        state.activePollId = null;

        const poll = {
          ...action.payload,
          totalVotes: action.payload._count?.votes || 0,
        };

        if (state.currentPoll && state.currentPoll.id === poll.id) {
          state.currentPoll = poll;
        }

        const pollIndex = state.polls.findIndex((p) => p.id === poll.id);
        if (pollIndex !== -1) {
          state.polls[pollIndex] = poll;
        }
      })
      .addCase(endPoll.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to end poll";
      });

    builder.addCase(fetchTeacherPolls.fulfilled, (state, action) => {
      state.polls = action.payload.map((poll: any) => ({
        ...poll,
        totalVotes: poll._count?.votes || 0,
      }));
    });

    builder.addCase(fetchPollResults.fulfilled, (state, action) => {
      const { poll, results } = action.payload;

      if (state.currentPoll && state.currentPoll.id === poll.id) {
        state.currentPoll.options = results.map(
          (result: any, index: number) => ({
            ...result,
            order: index,
          })
        );
        state.currentPoll.totalVotes = poll.totalVotes;
      }
    });
  },
});

export const {
  setTeacherName,
  updateFormQuestion,
  updateFormDescription,
  updateFormOption,
  addFormOption,
  removeFormOption,
  resetForm,
  clearError,
  updatePollResults,
} = teacherSlice.actions;

export default teacherSlice.reducer;
