/**
 * Status values a Task can be in. Drives both the List view's collapsible
 * group sections and the Board view's Kanban columns (1:1 mapping).
 */
export enum TaskStatus {
  BACKLOG = 'backlog',
  TODO = 'todo',
  DOING = 'doing',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
}
