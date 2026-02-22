/**
 * Copy for Layout Mode Selector: tooltips, confirm modals, empty state.
 * Use these constants so copy can be updated in one place.
 */

/** Tooltip for "My Layout" option */
export const TOOLTIP_MY_LAYOUT =
  'Your personal arrangement. Only you see this. Customize and save from this view.';

/** Tooltip for "Recommended" option */
export const TOOLTIP_RECOMMENDED =
  'A suggested layout for your role. Good starting point for new users.';

/** Tooltip for "Org Template" option */
export const TOOLTIP_ORG_TEMPLATE =
  'Your organization’s standard layout. Set by admins for consistency.';

/** Replace My Layout — modal title */
export const REPLACE_MODAL_TITLE = 'Replace my layout?';

/** Replace My Layout — modal description */
export const REPLACE_MODAL_DESCRIPTION =
  'Your current layout will be overwritten with this one. You can customize it again after saving.';

/** Replace My Layout — confirm button */
export const REPLACE_MODAL_CONFIRM = 'Replace';

/** Replace My Layout — cancel button */
export const REPLACE_MODAL_CANCEL = 'Cancel';

/** Empty state when no org template exists (shown in dropdown or as hint) */
export const EMPTY_ORG_TEMPLATE =
  'No org template set. Admins can set a standard layout in settings.';

/** Restore default — kebab menu item */
export const RESTORE_DEFAULT_LABEL = 'Restore default';

/** Restore default — tooltip / description */
export const RESTORE_DEFAULT_TOOLTIP =
  'Clear your saved layout and use the default arrangement for this module.';

/** Badge when "Recommended" is selected — prefix before role name */
export const BADGE_RECOMMENDED_PREFIX = 'Recommended for';

/** Save as Template — button label */
export const SAVE_AS_TEMPLATE_BUTTON = 'Save as Template';

/** Save as Template — modal title */
export const SAVE_AS_TEMPLATE_MODAL_TITLE = 'Save as Template';

/** Save as Template — modal description */
export const SAVE_AS_TEMPLATE_MODAL_DESCRIPTION =
  'Save this layout as an org template. Choose which role it applies to and whether to lock or push to the team.';

/** Save as Template — template name field label */
export const SAVE_AS_TEMPLATE_NAME_LABEL = 'Template name';

/** Save as Template — template name placeholder */
export const SAVE_AS_TEMPLATE_NAME_PLACEHOLDER = 'e.g. Ops Standard Q1';

/** Save as Template — role target field label */
export const SAVE_AS_TEMPLATE_ROLE_LABEL = 'Role target';

/** Save as Template — role target description */
export const SAVE_AS_TEMPLATE_ROLE_DESCRIPTION =
  'This template will appear as "Recommended" and "Org template" for users with this role.';

/** Save as Template — lock toggle label */
export const SAVE_AS_TEMPLATE_LOCK_LABEL = 'Lock layout';

/** Save as Template — lock toggle description */
export const SAVE_AS_TEMPLATE_LOCK_DESCRIPTION =
  'When locked, only admins can change the layout. Team members will see a locked message and cannot customize.';

/** Save as Template — apply now toggle label */
export const SAVE_AS_TEMPLATE_APPLY_NOW_LABEL = 'Apply to team now';

/** Save as Template — apply now toggle description */
export const SAVE_AS_TEMPLATE_APPLY_NOW_DESCRIPTION =
  'Push this layout to every team member’s saved layout and set their view to Org template.';

/** Save as Template — primary button */
export const SAVE_AS_TEMPLATE_CONFIRM = 'Save template';

/** Save as Template — cancel button */
export const SAVE_AS_TEMPLATE_CANCEL = 'Cancel';

/** Layout locked — banner text (non-admin when org template is locked) */
export const LAYOUT_LOCKED_BANNER = 'Layout locked by your admin.';

// --- Legacy (used by SaveAsOrgTemplateModal, ApplyToTeamModal) ---
export const SAVE_AS_ORG_TEMPLATE_TITLE = 'Save as org template';
export const SAVE_AS_ORG_TEMPLATE_DESCRIPTION =
  'Save the current layout as your organization's standard for this view. Team members can use it via "Org template".';
export const SAVE_AS_ORG_TEMPLATE_NAME_LABEL = 'Template name';
export const SAVE_AS_ORG_TEMPLATE_CONFIRM = 'Save template';
export const APPLY_TO_TEAM_TITLE = 'Apply to team';
export const APPLY_TO_TEAM_DESCRIPTION =
  'Set the org template as the default for this view. Optionally push this layout to every team member's saved layout.';
export const APPLY_TO_TEAM_PUSH_LABEL = 'Push layout to all users (overwrite their saved layout)';
export const APPLY_TO_TEAM_CONFIRM = 'Apply';
export const LOCKED_BY_ADMIN_BANNER = 'Layout is locked by your admin. You cannot customize widgets.';
