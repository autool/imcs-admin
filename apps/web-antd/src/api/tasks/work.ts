/**
 * 工作任务 API
 */
import { requestClient } from '#/api/request';

export interface WorkTask {
  id: number;
  title: string;
  description?: string;
  task_type?: string;
  priority: number;
  status: string;
  assigned_to?: string;
  assigned_user_id?: string;
  due_date?: string;
  completed_at?: string;
  created_by?: string;
  created_user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkTaskListResponse {
  total: number;
  list: WorkTask[];
}

export interface CreateWorkTaskParams {
  title: string;
  description?: string;
  task_type?: string;
  priority?: number;
  assigned_user_id?: string;
  due_date?: string;
}

export interface UpdateWorkTaskParams {
  title?: string;
  description?: string;
  task_type?: string;
  priority?: number;
  status?: string;
  assigned_user_id?: string;
  due_date?: string;
}

export async function getWorkTaskListApi(params?: {
  assigned_to?: string;
  assigned_user_id?: string;
  limit?: number;
  search?: string;
  skip?: number;
  status?: string;
}) {
  return requestClient.get<WorkTaskListResponse>('/tasks/work-tasks', {
    params,
  });
}

export async function createWorkTaskApi(data: CreateWorkTaskParams) {
  return requestClient.post('/tasks/work-tasks', data);
}

export async function updateWorkTaskApi(
  id: number,
  data: UpdateWorkTaskParams,
) {
  return requestClient.put(`/tasks/work-tasks/${id}`, data);
}

export async function deleteWorkTaskApi(id: number) {
  return requestClient.delete(`/tasks/work-tasks/${id}`);
}

export async function getWorkTaskDetailApi(id: number) {
  return requestClient.get<WorkTask>(`/tasks/work-tasks/${id}`);
}
