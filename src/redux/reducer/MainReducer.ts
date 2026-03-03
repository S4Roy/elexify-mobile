import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MainState {
  status: string;
  isLoading: boolean;
  isMainLoading: boolean;
  getTokenResponse: string | null;
  bannerResponse: {};
  error?: string;
}

const initialState: MainState = {
  status: '',
  isLoading: true,
  isMainLoading: false,
  getTokenResponse: '',
  bannerResponse: {},
};

const MainSlice = createSlice({
  name: 'Main',
  initialState,
  reducers: {
    //login
    bannerRequest(state, action: PayloadAction<any>) {
      state.isMainLoading = true;
      state.status = action.type;
    },
    bannerSuccess(state, action: PayloadAction<any>) {
      state.isMainLoading = false;
      state.bannerResponse = action.payload;
      state.status = action.type;
    },
    bannerFailure(state, action: PayloadAction<any>) {
      state.isMainLoading = false;
      state.error = action.payload?.error || 'Login failed';
      state.status = action.type;
    },
  },
});

export const { bannerRequest, bannerSuccess, bannerFailure } =
  MainSlice.actions;

export default MainSlice.reducer;
