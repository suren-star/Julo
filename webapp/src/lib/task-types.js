export const TASK_EXECUTION_TYPES = {
  review_report: 'Ծանոթանալ և զեկուցել',
  execute: 'Ի կատարում',
  prepare_letter: 'Պատրաստել գրություն',
  organize_meeting: 'Կազմակերպել հանդիպում',
  prepare_documents: 'Պատրաստել փաստաթղթեր',
  acknowledge: 'Ընդունել ի գիտություն',
};

export const isTaskExecutionType = (value) => Boolean(TASK_EXECUTION_TYPES[value]);
