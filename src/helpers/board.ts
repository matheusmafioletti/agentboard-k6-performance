import http from 'k6/http';
import { check } from 'k6';
import { ENV, API } from '@config/environment';
import {
  checkResponse,
  parseJson,
  projectDuration,
  randomSleep,
  workItemDuration,
} from '@helpers/api';
import { getAuthHeaders, loginWithEnvCredentials, type AuthResult } from '@helpers/auth';
import { generateProjectName, generateWorkItemTitle } from '@helpers/data';

interface ProjectResponse {
  id: string;
  name: string;
}

interface WorkItemResponse {
  id: string;
  title: string;
  type: string;
  status: string;
}

export function listProjects(auth: AuthResult): ProjectResponse[] {
  const headers = getAuthHeaders(auth.token, auth.tenantId);
  const response = http.get(`${ENV.boardBaseUrl}${API.board.projects}`, {
    headers,
    tags: { name: 'board_list_projects' },
  });
  projectDuration.add(response.timings.duration);
  checkResponse(response, 200, 'list-projects');
  return parseJson<ProjectResponse[]>(response.body);
}

export function createProject(auth: AuthResult, name: string): ProjectResponse {
  const headers = getAuthHeaders(auth.token, auth.tenantId);
  const response = http.post(
    `${ENV.boardBaseUrl}${API.board.projects}`,
    JSON.stringify({ name }),
    { headers, tags: { name: 'board_create_project' } }
  );
  projectDuration.add(response.timings.duration);
  checkResponse(response, 201, 'create-project');
  return parseJson<ProjectResponse>(response.body);
}

export function ensureProject(auth: AuthResult): string {
  const projects = listProjects(auth);
  if (projects.length > 0) {
    return projects[0].id;
  }
  const project = createProject(auth, generateProjectName());
  randomSleep();
  return project.id;
}

export function listWorkItems(auth: AuthResult, projectId: string): WorkItemResponse[] {
  const headers = getAuthHeaders(auth.token, auth.tenantId);
  const response = http.get(
    `${ENV.boardBaseUrl}${API.board.workItems}?projectId=${projectId}`,
    { headers, tags: { name: 'board_list_work_items' } }
  );
  workItemDuration.add(response.timings.duration);
  checkResponse(response, 200, 'list-work-items');
  return parseJson<WorkItemResponse[]>(response.body);
}

export function createWorkItem(
  auth: AuthResult,
  projectId: string,
  type: string,
  title: string,
  parentId?: string
): WorkItemResponse {
  const headers = getAuthHeaders(auth.token, auth.tenantId);
  const body: Record<string, string | number> = { type, title, priority: 5 };
  if (parentId) {
    body.parentId = parentId;
  }

  const response = http.post(
    `${ENV.boardBaseUrl}${API.board.workItems}?projectId=${projectId}`,
    JSON.stringify(body),
    { headers, tags: { name: 'board_create_work_item' } }
  );
  workItemDuration.add(response.timings.duration);
  checkResponse(response, 201, 'create-work-item');
  const item = parseJson<WorkItemResponse>(response.body);
  check(item, {
    'work item id present': (i) => !!i.id,
    'work item type matches': (i) => i.type === type,
  });
  return item;
}

export function updateWorkItemStatus(
  auth: AuthResult,
  workItemId: string,
  status: string
): WorkItemResponse {
  const headers = getAuthHeaders(auth.token, auth.tenantId);
  const response = http.patch(
    `${ENV.boardBaseUrl}${API.board.workItemStatus(workItemId)}`,
    JSON.stringify({ status }),
    { headers, tags: { name: 'board_update_work_item_status' } }
  );
  workItemDuration.add(response.timings.duration);
  checkResponse(response, 200, 'update-work-item-status');
  return parseJson<WorkItemResponse>(response.body);
}

function ensureUserStoryParent(auth: AuthResult, projectId: string): string {
  const items = listWorkItems(auth, projectId);
  const existingStory = items.find((item) => item.type === 'USER_STORY');
  if (existingStory) {
    return existingStory.id;
  }

  const feature = createWorkItem(auth, projectId, 'FEATURE', generateWorkItemTitle());
  randomSleep();
  const story = createWorkItem(
    auth,
    projectId,
    'USER_STORY',
    generateWorkItemTitle(),
    feature.id
  );
  randomSleep();
  return story.id;
}

export function boardFlow(): void {
  const auth = loginWithEnvCredentials();
  randomSleep();

  const projectId = ensureProject(auth);
  randomSleep();

  const storyId = ensureUserStoryParent(auth, projectId);
  const task = createWorkItem(auth, projectId, 'TASK', generateWorkItemTitle(), storyId);
  randomSleep();

  listWorkItems(auth, projectId);
  randomSleep();

  updateWorkItemStatus(auth, task.id, 'ACTIVE');
  randomSleep();
}
