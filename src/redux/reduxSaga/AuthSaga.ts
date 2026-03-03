import AsyncStorage from '@react-native-async-storage/async-storage';
import { call, put, select, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import ToastAlert from '../../utils/helper/Toast';
import {
  getTokenFailure,
  getTokenSuccess,
  loginFailure,
  loginSuccess,
  logoutFailure,
  logoutSuccess,
  userDetailsFailure,
  userDetailsSuccess,
} from '../reducer/AuthReducer';
// import { getApi, postApi } from '../../utils/helper/ApiRequest';
import { ApiHeaders, ApiResponse } from '../types';
import { constants } from '../../utils/constants';
import { postApi } from '../../utils/helper/ApiRequest';

// Define types for action payloads
interface LoginPayload {
  email: string;
  password: string;
}

interface LogoutPayload {
  showMsg: boolean;
}

const getItems = (state: any) => state.AuthReducer;

//Checking Saga
export function* getTokenSaga(): Generator<any, void, any> {
  try {
    const response: string | null = yield call(
      AsyncStorage.getItem,
      constants?.TOKEN,
    );

    if (response != null) {
      const tokenData = JSON.parse(response);
      yield put(getTokenSuccess(tokenData));
    } else {
      yield put(getTokenSuccess(null)); // Provide default empty token instead of null
    }
  } catch (error: any) {
    yield put(getTokenFailure(error));
  }
}

//login saga
export function* loginSaga(
  action: PayloadAction<LoginPayload>,
): Generator<any, void, any> {
  const header: ApiHeaders = {
    Accept: 'application/json',
    contenttype: 'application/json',
  };
  try {
    const response: ApiResponse = yield call(
      postApi,
      'auth/login',
      action.payload,
      header,
    );
    console.log('39', response);
    if (response?.status == 201 || response?.status == 200) {
      yield call(
        AsyncStorage.setItem,
        constants.TOKEN,
        JSON.stringify(response?.data?.access_token),
      );
      yield put(getTokenSuccess(response?.data?.access_token || null));
      yield put(loginSuccess(response?.data?.access_token));
      ToastAlert('Login Successful');
    } else {
      yield put(loginFailure(response?.data));
      // ToastAlert(response.data.message);
    }
  } catch (error: any) {
    console.log(error);
    yield put(loginFailure(error));
    ToastAlert(error?.response?.data?.message || 'Login Failed');
  }
}

//login saga
export function* userDetailsSaga(
  action: PayloadAction<LoginPayload>,
): Generator<any, void, any> {
  const header: ApiHeaders = {
    Accept: 'application/json',
    contenttype: 'application/json',
  };
  try {
    const response: ApiResponse = yield call(
      postApi,
      'v1/user/account/details',
      action.payload,
      header,
    );
    console.log('39', response);
    if (response?.status == 201 || response?.status == 200) {
      yield put(userDetailsSuccess(response?.data?.access_token));
    } else {
      yield put(userDetailsFailure(response?.data));
      // ToastAlert(response.data.message);
    }
  } catch (error: any) {
    console.log(error);
    yield put(userDetailsFailure(error));
    ToastAlert(error?.response?.data?.message || 'Login Failed');
  }
}

//logout saga
export function* logoutSaga(
  action: PayloadAction<LogoutPayload>,
): Generator<any, void, any> {
  try {
    yield call(AsyncStorage.removeItem, constants.TOKEN);
    yield put(getTokenSuccess(null)); // Provide default empty token instead of null
    yield put(logoutSuccess({ message: 'logout', success: true }));
    if (action.payload.showMsg) {
      ToastAlert('Logout Successful');
    }
  } catch (error: any) {
    yield put(logoutFailure(error));
    ToastAlert('Logout Failed');
  }
}

// Watcher Saga
export function* watchAuthSaga(): Generator<any, void, any> {
  yield takeLatest('Auth/getTokenRequest', getTokenSaga);
  yield takeLatest('Auth/loginRequest', loginSaga);
  yield takeLatest('Auth/logoutRequest', logoutSaga);
  yield takeLatest('Auth/userDetailsRequest', userDetailsSaga);
}
