import axios, { AxiosResponse } from 'axios';
import { constants } from '../constants';
// import constants from './constants';

// Define types for headers
export interface ApiHeaders {
  Accept: string;
  contenttype: string;
  accesstoken?: string;
}

// Define generic API response type
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
}

export async function getApi(
  url: string,
  header: ApiHeaders,
): Promise<AxiosResponse<any>> {
  console.log('GetApi: ', `${constants.BASE_URL}/${url}`);

  return await axios.get(`${constants.BASE_URL}/${url}`, {
    headers: {
      'Content-type': header.contenttype,
      'auth-token': header.accesstoken || '',
      ...header,
      // Authorization: 'Bearer' + ' ' + header.accesstoken,
    },
  });
}

export async function getApiWithParam(
  url: string,
  param: Record<string, any>,
  header: ApiHeaders,
): Promise<AxiosResponse<any>> {
  console.log('getApiWithParam: ', `${constants.BASE_URL}/${url}`);

  return await axios({
    method: 'GET',
    baseURL: constants.BASE_URL,
    url: url,
    params: param,
    headers: {
      Accept: header.Accept,
      'Content-type': header.contenttype,
    },
  });
}

export async function postApi(
  url: string,
  payload: any,
  header: ApiHeaders,
): Promise<AxiosResponse<any>> {
  console.log('PostApi: ', `${constants.BASE_URL}/${url}`);

  return await axios.post(`${constants.BASE_URL}/${url}`, payload, {
    headers: {
      Accept: header.Accept,
      'Content-Type': header.contenttype,
      'auth-token': header.accesstoken || '',
      // Authorization: 'Bearer' + ' ' + header.accesstoken,
    },
  });
}
