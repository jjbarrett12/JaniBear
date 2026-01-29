// Application constants

export const APP_NAME = "Janibear";
export const APP_DESCRIPTION = "Mobile-first janitorial quality inspection and task management SaaS";

// User roles
export const USER_ROLES = {
  OWNER: "owner",
  MANAGER: "manager",
  INSPECTOR: "inspector",
  CLIENT_VIEWER: "client_viewer",
} as const;

// Issue statuses
export const ISSUE_STATUSES = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  CLOSED: "closed",
} as const;

// Schedule recurrence types
export const RECURRENCE_TYPES = {
  NONE: "none",
  WEEKLY: "weekly",
} as const;

// Item types for inspection templates
export const ITEM_TYPES = {
  YES_NO: "yes_no",
  SCALE_1_5: "scale_1_5",
  SCALE_1_10: "scale_1_10",
  TEXT: "text",
  PHOTO: "photo",
} as const;

// Language preferences
export const LANGUAGES = {
  ENGLISH: "en",
  SPANISH: "es",
} as const;

// Crew member roles
export const CREW_ROLES = {
  LEADER: "leader",
  MEMBER: "member",
} as const;

// Pagination
export const ITEMS_PER_PAGE = 20;

// File upload limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ALLOWED_DOCUMENT_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

// Date formats
export const DATE_FORMAT = "MMM d, yyyy";
export const DATETIME_FORMAT = "MMM d, yyyy 'at' h:mm a";
