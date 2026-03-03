import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export default function connectionrequest() {
  return new Promise(function (resolve, reject) {
    NetInfo.fetch().then((state: NetInfoState) => {
      ////console.log("Is connected", state.isConnected);
      if (state.isConnected) {
        resolve(state.isConnected);
      } else {
        reject(state.isConnected);
      }
    });
  });
}
