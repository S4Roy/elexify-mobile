import { all, fork } from 'redux-saga/effects';
import { watchAuthSaga } from './AuthSaga';
import { watchMainSaga } from './MainSaga';

export default function* RootSaga(): Generator<any, void, any> {
  yield all([
    fork(watchAuthSaga),
    fork(watchMainSaga),
    // Add other sagas here
  ]);
}
