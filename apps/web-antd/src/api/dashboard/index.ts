import { requestClient } from '#/api/request';

export async function getDashboardDataApi() {
  return requestClient.get('/dashboard');
}
