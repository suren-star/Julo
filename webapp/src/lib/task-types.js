export const TASK_EXECUTION_TYPES = Object.freeze({
  review_report: 'Ծանոթանալ և զեկուցել',
  execute: 'Ի կատարում',
  prepare_letter: 'Պատրաստել գրություն',
  organize_meeting: 'Կազմակերպել հանդիպում',
  prepare_documents: 'Պատրաստել փաստաթղթեր',
  acknowledge: 'Ընդունել ի գիտություն',
});

export const TASK_EXECUTION_OPTIONS = Object.freeze(Object.entries(TASK_EXECUTION_TYPES));

export const TASK_STATUS_LABELS = Object.freeze({
  todo: 'Առաջադրանք',
  doing: 'Ընթացքում',
  done: 'Ավարտված',
});

export const TASK_STATUS_ORDER = Object.freeze({ todo: 0, doing: 1, done: 2 });

export const TASK_PRIORITY_LABELS = Object.freeze({
  low: 'Ցածր',
  normal: 'Սովորական',
  high: 'Բարձր',
});

export const TASK_PRIORITY_OPTIONS = Object.freeze(Object.entries(TASK_PRIORITY_LABELS));

export const isTaskExecutionType = (value) => Boolean(TASK_EXECUTION_TYPES[value]);

export function createTaskDraft({ dueDate = new Date().toISOString().slice(0, 10) } = {}) {
  return {
    title: '',
    description: '',
    projectId: '',
    executionType: 'execute',
    dueDate,
    priority: 'normal',
    assigneeUserIds: [],
    primaryAssigneeUserId: '',
  };
}
