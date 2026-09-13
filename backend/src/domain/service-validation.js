export const TASK_EXECUTION_TYPES = Object.freeze([
  'review_report',
  'execute',
  'prepare_letter',
  'organize_meeting',
  'prepare_documents',
  'acknowledge',
]);

export const TASK_PRIORITIES = Object.freeze(['low', 'normal', 'high']);
export const TASK_STATUSES = Object.freeze(['todo', 'doing', 'done']);

const EXECUTION_TYPE_SET = new Set(TASK_EXECUTION_TYPES);
const PRIORITY_SET = new Set(TASK_PRIORITIES);
const STATUS_SET = new Set(TASK_STATUSES);

export function serviceError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

export function assertId(value, field) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 80) {
    throw serviceError(400, `invalid_${field}`, `${field} is invalid.`);
  }
  return value;
}

export function cleanText(value, { field, max, required = true, trim = true }) {
  const raw = typeof value === 'string' ? value : '';
  const text = trim ? raw.trim() : raw;
  if ((required && !text) || text.length > max) {
    throw serviceError(400, `invalid_${field}`, `${field} is invalid.`);
  }
  return text;
}

export function dateOnly(value, field) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw serviceError(400, `invalid_${field}`, `${field} is invalid.`);
  }
  return value;
}

export function assertExpectedVersion(value) {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw serviceError(400, 'invalid_expected_version', 'expectedVersion must be a positive integer.');
  }
  return value;
}

export function normalizeProjectId(value) {
  return value == null || value === '' ? null : assertId(value, 'project_id');
}

export function normalizeTaskTags(value = []) {
  if (!Array.isArray(value)) {
    throw serviceError(400, 'invalid_tags', 'tags must be an array.');
  }
  if (value.length > 50) {
    throw serviceError(400, 'too_many_tags', 'Too many task tags.');
  }
  const tags = [];
  const seen = new Set();
  for (const item of value) {
    const tag = cleanText(item, { field: 'tag', max: 80, required: false });
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
  }
  return tags;
}

export function assertTaskExecutionType(value, message = 'Execution type is invalid.') {
  if (!EXECUTION_TYPE_SET.has(value)) {
    throw serviceError(400, 'invalid_execution_type', message);
  }
  return value;
}

export function assertTaskPriority(value = 'normal') {
  if (!PRIORITY_SET.has(value)) {
    throw serviceError(400, 'invalid_priority', 'Priority is invalid.');
  }
  return value;
}

export function assertTaskStatus(value) {
  if (!STATUS_SET.has(value)) {
    throw serviceError(400, 'invalid_status', 'Status is invalid.');
  }
  return value;
}

export function normalizeTaskAssignees(input, { patch = false } = {}) {
  const hasIds = Object.prototype.hasOwnProperty.call(input ?? {}, 'assigneeUserIds');
  const hasPrimary = Object.prototype.hasOwnProperty.call(input ?? {}, 'primaryAssigneeUserId');

  if (patch && !hasIds && !hasPrimary) return null;
  if (patch && !hasIds) {
    throw serviceError(400, 'assignees_required_with_primary', 'assigneeUserIds is required when primaryAssigneeUserId is changed.');
  }

  const raw = input?.assigneeUserIds ?? [];
  if (!Array.isArray(raw)) {
    throw serviceError(400, 'invalid_assignees', 'assigneeUserIds must be an array.');
  }
  if (raw.length > 100) {
    throw serviceError(400, 'too_many_assignees', 'Too many task assignees.');
  }

  const assigneeUserIds = [...new Set(raw.map((id) => assertId(id, 'assignee_user_id')))];
  const primaryAssigneeUserId = input?.primaryAssigneeUserId == null || input.primaryAssigneeUserId === ''
    ? null
    : assertId(input.primaryAssigneeUserId, 'primary_assignee_user_id');

  if (assigneeUserIds.length === 0) {
    throw serviceError(400, 'assignee_required', 'At least one task assignee is required.');
  }
  if (!primaryAssigneeUserId) {
    throw serviceError(400, 'primary_assignee_required', 'A primary assignee is required.');
  }
  if (!assigneeUserIds.includes(primaryAssigneeUserId)) {
    throw serviceError(400, 'primary_assignee_not_selected', 'Primary assignee must be one of the selected assignees.');
  }

  return { assigneeUserIds, primaryAssigneeUserId };
}
