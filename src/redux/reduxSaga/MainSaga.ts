import AsyncStorage from '@react-native-async-storage/async-storage';
import { call, put, select, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import ToastAlert from '../../utils/helper/Toast';
import { ApiHeaders, ApiResponse } from '../types';
import { constants } from '../../utils/constants';
import { getApi, postApi } from '../../utils/helper/ApiRequest';
import { bannerFailure, bannerSuccess } from '../reducer/MainReducer';

const getItems = (state: any) => state.MainReducer;

//login saga
export function* bannerSaga(
  action: PayloadAction<any>,
): Generator<any, void, any> {
  const header: any = {
    Accept: 'application/json',
    contenttype: 'application/json',
    'x-api-key': 'Ip2A4a02I1r1I9dE1iSnA0S6aB1tE5WS',
    'x-guest-id': '144cac98-7e16-4e14-9aa9-e6dd984f646a',
  };
  try {
    const response: ApiResponse = yield call(
      getApi,
      'v1/site/cms/banners?',
      header,
    );
    console.log('39', response);
    // if (response?.status == 201 || response?.status == 200) {
    yield put(bannerSuccess(response?.data?.data?.docs));
    // } else {
    //   yield put(bannerFailure(response?.data));
    //   // ToastAlert(response.data.message);
    // }
  } catch (error: any) {
    console.log(error);
    yield put(bannerFailure(error));
    ToastAlert(error?.response?.data?.message || 'Failed');
  }
}

// Watcher Saga
export function* watchMainSaga(): Generator<any, void, any> {
  yield takeLatest('Main/bannerRequest', bannerSaga);
}
