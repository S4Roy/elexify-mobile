/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
// import { Provider } from 'react-redux';
// import Store from './src/redux/Store';
import { Provider } from 'react-redux';
import Store from './src/redux/Store';

const Elexify = () => {
  return (
    <Provider store={Store}>
      <App />
    </Provider>
  );
};

AppRegistry.registerComponent(appName, () => Elexify);
