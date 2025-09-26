import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface PollState {
  isConnected: boolean;
  timeRemaining: number | null;
}

const initialState: PollState = {
  isConnected: false,
  timeRemaining: null,
};

const pollSlice = createSlice({
  name: "poll",
  initialState,
  reducers: {
    setTimeRemaining: (state, action: PayloadAction<number | null>) => {
      state.timeRemaining = action.payload;
    },

    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
  },
});

export const { setTimeRemaining, setConnectionStatus } = pollSlice.actions;

export default pollSlice.reducer;
