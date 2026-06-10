import { check } from 'k6';
import { randomSleep } from '@helpers/api';
import { register } from '@helpers/auth';
import {
  createProject,
  createWorkItem,
  listWorkItems,
  updateWorkItemStatus,
} from '@helpers/board';
import {
  generateEmail,
  generateProjectName,
  generateTenantName,
  generateUserName,
  generateWorkItemTitle,
  TEST_PASSWORD,
} from '@helpers/data';

export function fullJourneyFlow(): void {
  const email = generateEmail();
  const auth = register(
    email,
    TEST_PASSWORD,
    generateTenantName(),
    generateUserName()
  );
  randomSleep();

  const project = createProject(auth, generateProjectName());
  randomSleep();

  const feature = createWorkItem(
    auth,
    project.id,
    'FEATURE',
    generateWorkItemTitle()
  );
  randomSleep();

  const story = createWorkItem(
    auth,
    project.id,
    'USER_STORY',
    generateWorkItemTitle(),
    feature.id
  );
  randomSleep();

  const task = createWorkItem(
    auth,
    project.id,
    'TASK',
    generateWorkItemTitle(),
    story.id
  );
  randomSleep();

  const items = listWorkItems(auth, project.id);
  check(items, {
    'full journey has 3 work items': (list) => list.length >= 3,
  });
  randomSleep();

  updateWorkItemStatus(auth, task.id, 'ACTIVE');
  randomSleep();
}
