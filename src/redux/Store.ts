import { configureStore } from '@reduxjs/toolkit';
import AuthReducer from './reducer/AuthReducer';
import logger from 'redux-logger';
import RootSaga from './reduxSaga/RootSaga';
import MainReducer from './reducer/MainReducer';
const createSagaMiddleware = require('redux-saga').default;

let sagaMiddleware = createSagaMiddleware();
const middleware = [sagaMiddleware, logger];

export default configureStore({
  reducer: {
    AuthReducer: AuthReducer,
    MainReducer: MainReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({ thunk: false }).concat(middleware),
});

sagaMiddleware.run(RootSaga);
