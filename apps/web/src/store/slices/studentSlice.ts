import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { trpcClient } from "@/utils/trpc";

interface StudentState {
  studentName: string;
  hasVoted: boolean;
  selectedOptionId: string | null;
  selectedOptionText: string | null;
  isLoading: boolean;
  error: string | null;
  joinedPollId: string | null;
}

const initialState: StudentState = {
  studentName: "",
  hasVoted: false,
  selectedOptionId: null,
  selectedOptionText: null,
  isLoading: false,
  error: null,
  joinedPollId: null,
};

export const submitVote = createAsyncThunk(
  "student/submitVote",
  async (data: { pollId: string; optionId: string; studentName: string }) => {
    const response = await trpcClient.votes.submit.mutate(data);
    return response;
  }
);

export const checkHasVoted = createAsyncThunk(
  "student/checkHasVoted",
  async (data: { pollId: string; studentName: string }) => {
    const response = await trpcClient.votes.hasVoted.query(data);
    return { ...response, pollId: data.pollId };
  }
);

const studentSlice = createSlice({
  name: "student",
  initialState,
  reducers: {
    setStudentName: (state, action: PayloadAction<string>) => {
      state.studentName = action.payload;

      if (typeof window !== "undefined") {
        localStorage.setItem("studentName", action.payload);
      }
    },

    loadStudentName: (state) => {
      if (typeof window !== "undefined") {
        const savedName = localStorage.getItem("studentName");
        if (savedName) {
          state.studentName = savedName;
        }
      }
    },

    setJoinedPollId: (state, action: PayloadAction<string | null>) => {
      state.joinedPollId = action.payload;
    },

    resetVoteState: (state) => {
      state.hasVoted = false;
      state.selectedOptionId = null;
      state.selectedOptionText = null;
      state.error = null;
    },

    clearError: (state) => {
      state.error = null;
    },

    onPollStarted: (state) => {
      state.hasVoted = false;
      state.selectedOptionId = null;
      state.selectedOptionText = null;
      state.error = null;
    },

    onPollEnded: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(submitVote.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitVote.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hasVoted = true;
        state.selectedOptionId = action.payload.pollOptionId;
        state.selectedOptionText = action.payload.pollOption?.text || null;
      })
      .addCase(submitVote.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to submit vote";
      });

    builder.addCase(checkHasVoted.fulfilled, (state, action) => {
      const { hasVoted, pollId } = action.payload;
      const selectedOption =
        "selectedOption" in action.payload
          ? action.payload.selectedOption
          : null;

      if (pollId === state.joinedPollId) {
        state.hasVoted = hasVoted;
        state.selectedOptionId = selectedOption?.id || null;
        state.selectedOptionText = selectedOption?.text || null;
      }
    });
  },
});

export const {
  setStudentName,
  loadStudentName,
  setJoinedPollId,
  resetVoteState,
  clearError,
  onPollStarted,
  onPollEnded,
} = studentSlice.actions;

export default studentSlice.reducer;
