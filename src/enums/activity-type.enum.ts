/**
 * Types of append-only audit entries written to a Task's Updates/Activity log.
 */
export enum ActivityType {
  CREATED = 'created',
  STATUS_CHANGE = 'status_change',
  PRIORITY_CHANGE = 'priority_change',
  ASSIGNEE_CHANGE = 'assignee_change',
  DUE_DATE_CHANGE = 'due_date_change',
  LABEL_CHANGE = 'label_change',
  TITLE_CHANGE = 'title_change',
  DESCRIPTION_CHANGE = 'description_change',
  COMMENT = 'comment',
  SUBTASK_ADDED = 'subtask_added',
}
