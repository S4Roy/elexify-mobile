import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  status: string;
  isLoading: boolean;
  isReqLoading: boolean;
  getTokenResponse: string | null;
  loginResponse: {};
  logoutResponse: {};
  error?: string;
  userDetailsRes: {};
}

const initialState: AuthState = {
  status: '',
  isLoading: true,
  isReqLoading: false,
  getTokenResponse: '',
  loginResponse: {},
  logoutResponse: {},
  userDetailsRes: {},
};

const AuthSlice = createSlice({
  name: 'Auth',
  initialState,
  reducers: {
    //get token
    getTokenRequest(state, action: PayloadAction<void>) {
      state.isLoading = true;
      state.status = action.type;
    },
    getTokenSuccess(state, action: PayloadAction<string | null>) {
      state.isLoading = false;
      state.getTokenResponse = action.payload;
      state.status = action.type;
    },
    getTokenFailure(state, action: PayloadAction<any>) {
      state.isLoading = false;
      state.error = action.payload?.error || 'Get token failed';
      state.status = action.type;
    },

    //login
    loginRequest(state, action: PayloadAction<any>) {
      state.isReqLoading = true;
      state.status = action.type;
    },
    loginSuccess(state, action: PayloadAction<any>) {
      state.isReqLoading = false;
      state.loginResponse = action.payload;
      state.status = action.type;
    },
    loginFailure(state, action: PayloadAction<any>) {
      state.isReqLoading = false;
      state.error = action.payload?.error || 'Login failed';
      state.status = action.type;
    },

    //login
    userDetailsRequest(state, action: PayloadAction<any>) {
      state.isReqLoading = true;
      state.status = action.type;
    },
    userDetailsSuccess(state, action: PayloadAction<any>) {
      state.isReqLoading = false;
      state.userDetailsRes = action.payload;
      state.status = action.type;
    },
    userDetailsFailure(state, action: PayloadAction<any>) {
      state.isReqLoading = false;
      state.error = action.payload?.error || 'userDetails failed';
      state.status = action.type;
    },

    //logout
    logoutRequest(state, action: PayloadAction<any>) {
      state.isReqLoading = true;
      state.status = action.type;
    },
    logoutSuccess(state, action: PayloadAction<any>) {
      state.isReqLoading = false;
      state.logoutResponse = action.payload;
      state.status = action.type;
    },
    logoutFailure(state, action: PayloadAction<any>) {
      state.isReqLoading = false;
      state.error = action.payload?.error || 'Logout failed';
      state.status = action.type;
    },
  },
});

export const {
  getTokenRequest,
  getTokenSuccess,
  getTokenFailure,

  loginRequest,
  loginSuccess,
  loginFailure,

  logoutRequest,
  logoutSuccess,
  logoutFailure,

  userDetailsRequest,
  userDetailsSuccess,
  userDetailsFailure,
} = AuthSlice.actions;

export default AuthSlice.reducer;
