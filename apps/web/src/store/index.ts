import { configureStore } from "@reduxjs/toolkit";
import teacherReducer from "./slices/teacherSlice";
import pollReducer from "./slices/pollSlice";
import studentReducer from "./slices/studentSlice";
import userReducer from "./slices/userSlice";
import chatReducer from "./slices/chatSlice";

export const store = configureStore({
  reducer: {
    teacher: teacherReducer,
    poll: pollReducer,
    student: studentReducer,
    user: userReducer,
    chat: chatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
