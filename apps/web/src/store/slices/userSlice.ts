import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  isAuthenticated: boolean;
  role: "TEACHER" | "STUDENT" | null;
  name: string;
  id: string | null;
}

const initialState: UserState = {
  isAuthenticated: false,
  role: null,
  name: "",
  id: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserRole: (state, action: PayloadAction<"TEACHER" | "STUDENT">) => {
      state.role = action.payload;

      if (typeof window !== "undefined") {
        localStorage.setItem("userRole", action.payload);
      }
    },

    setUserName: (state, action: PayloadAction<string>) => {
      state.name = action.payload;

      if (typeof window !== "undefined") {
        localStorage.setItem("userName", action.payload);
      }
    },

    setUserId: (state, action: PayloadAction<string>) => {
      state.id = action.payload;

      if (typeof window !== "undefined") {
        localStorage.setItem("userId", action.payload);
      }
    },

    authenticateUser: (state) => {
      state.isAuthenticated = true;
      if (!state.id) {
        state.id = `${state.role}_${Date.now()}`;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("isAuthenticated", "true");
        if (state.id) {
          localStorage.setItem("userId", state.id);
        }
      }
    },

    loadUserFromStorage: (state) => {
      if (typeof window !== "undefined") {
        const isAuthenticated =
          localStorage.getItem("isAuthenticated") === "true";
        const role = localStorage.getItem("userRole") as
          | "TEACHER"
          | "STUDENT"
          | null;
        const name = localStorage.getItem("userName");
        const id = localStorage.getItem("userId");

        if (isAuthenticated && role && name) {
          state.isAuthenticated = true;
          state.role = role;
          state.name = name;
          state.id = id;
        }
      }
    },

    logout: (state) => {
      state.isAuthenticated = false;
      state.role = null;
      state.name = "";
      state.id = null;

      if (typeof window !== "undefined") {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
        localStorage.removeItem("userId");
        localStorage.removeItem("studentName");
      }
    },

    clearRole: (state) => {
      state.role = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("userRole");
      }
    },
  },
});

export const {
  setUserRole,
  setUserName,
  setUserId,
  authenticateUser,
  loadUserFromStorage,
  logout,
  clearRole,
} = userSlice.actions;

export default userSlice.reducer;
