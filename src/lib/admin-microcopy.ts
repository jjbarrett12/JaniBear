/**
 * Admin & Onboarding — microcopy for confirmations, warnings, and empty states.
 * Use these for consistent, enterprise-grade messaging.
 */

export const ADMIN_MICROCOPY = {
  /** Role change: inline confirmation + tooltip */
  roleChange: {
    tooltip:
      'Changing role updates this user’s permissions across the organization. They may gain or lose access to modules and data.',
    confirmTitle: 'Change role?',
    confirmDescription:
      'This will update their permissions immediately. They may gain or lose access to certain areas of the product.',
    confirmButton: 'Change role',
    cancelButton: 'Cancel',
  },

  /** Deactivate user */
  deactivateUser: {
    confirmTitle: 'Deactivate user?',
    confirmDescription:
      'This user will lose access to the organization. You can reactivate them later from this page.',
    confirmButton: 'Deactivate',
    cancelButton: 'Cancel',
  },

  /** Remove user (irreversible) */
  removeUser: {
    confirmTitle: 'Remove user from organization?',
    confirmDescription:
      'This action cannot be undone. The user will be removed from the organization and will need a new invite to rejoin.',
    confirmButton: 'Remove user',
    cancelButton: 'Cancel',
  },

  /** Reset invite (resend) */
  resetInvite: {
    confirmTitle: 'Send a new invite?',
    confirmDescription:
      'A new invite email will be sent and the previous link will stop working. The invite will expire in 7 days.',
    confirmButton: 'Send new invite',
    cancelButton: 'Cancel',
  },

  /** Revoke invite */
  revokeInvite: {
    confirmTitle: 'Revoke invite?',
    confirmDescription: 'This invite link will stop working. You can send a new invite later if needed.',
    confirmButton: 'Revoke',
    cancelButton: 'Cancel',
  },

  /** Invite expiration note (shown on Invites page or in form) */
  inviteExpirationNote: 'Invites expire in 7 days. Recipients can use the link in the email to join the organization.',

  /** Empty states */
  empty: {
    users: {
      title: 'No team members yet',
      description: 'Invite people to your organization to collaborate. They’ll get an email with a link to join.',
      action: 'Invite team member',
    },
    invites: {
      title: 'No pending invites',
      description: 'Invites you send will appear here. You can resend or revoke them until they’re accepted.',
      action: 'Invite by email',
    },
    audit: {
      title: 'No audit events yet',
      description: 'Important actions (role changes, user updates, settings) will appear here for compliance and security.',
    },
  },
} as const;
