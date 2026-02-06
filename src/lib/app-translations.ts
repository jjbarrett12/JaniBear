/**
 * App / crew-facing UI translations (EN + ES).
 * Used for My Tasks, Schedules, and other worker-facing surfaces.
 */
import type { Locale } from './survey-translations';

export const appTranslations = {
  en: {
    // My Tasks
    myTasks: 'My Tasks',
    yourAssignedCleaningTasks: 'Your assigned cleaning tasks',
    upcomingTasks: 'Upcoming Tasks',
    due: 'Due',
    complete: 'Complete',
    completed: 'Completed',
    recentlyCompleted: 'Recently Completed',
    noUpcomingTasks: 'No upcoming tasks',
    noCompletedTasks: 'No completed tasks yet',
    failedToCompleteTask: 'Failed to complete task',

    // Schedules (crew view)
    schedules: 'Schedules',
    manageSchedulesAndAssignments: 'Manage inspection schedules and assignments',
    upcoming: 'Upcoming',
    location: 'Location',
    template: 'Template',
    crew: 'Crew',
    newSchedule: 'New Schedule',

    // QC Assign
    qcTaskAssign: 'QC Task Assign',
    assignTasksToCrew: 'Assign tasks to crew members',
    schedule: 'Schedule',
    selectSchedule: 'Select schedule',
    selectCrew: 'Select crew',
    dueDate: 'Due date',
    assign: 'Assign',
    assignTasks: 'Assign tasks',

    // Common
    signOut: 'Sign Out',
    loading: 'Loading…',
    save: 'Save',
    cancel: 'Cancel',
    back: 'Back',
    next: 'Next',
    today: 'Today',
  },
  es: {
    myTasks: 'Mis tareas',
    yourAssignedCleaningTasks: 'Tus tareas de limpieza asignadas',
    upcomingTasks: 'Próximas tareas',
    due: 'Vence',
    complete: 'Completar',
    completed: 'Completado',
    recentlyCompleted: 'Completadas recientemente',
    noUpcomingTasks: 'No hay tareas próximas',
    noCompletedTasks: 'Aún no hay tareas completadas',
    failedToCompleteTask: 'Error al completar la tarea',

    schedules: 'Calendarios',
    manageSchedulesAndAssignments: 'Gestiona calendarios e inspecciones',
    upcoming: 'Próximos',
    location: 'Ubicación',
    template: 'Plantilla',
    crew: 'Equipo',
    newSchedule: 'Nuevo calendario',

    qcTaskAssign: 'Asignar tareas QC',
    assignTasksToCrew: 'Asignar tareas a los miembros del equipo',
    schedule: 'Calendario',
    selectSchedule: 'Seleccionar calendario',
    selectCrew: 'Seleccionar equipo',
    dueDate: 'Fecha de vencimiento',
    assign: 'Asignar',
    assignTasks: 'Asignar tareas',

    signOut: 'Cerrar sesión',
    loading: 'Cargando…',
    save: 'Guardar',
    cancel: 'Cancelar',
    back: 'Atrás',
    next: 'Siguiente',
    today: 'Hoy',
  },
} as const;

export type AppTranslationKey = keyof (typeof appTranslations)['en'];

export function getAppT(locale: Locale) {
  const t = appTranslations[locale];
  return (key: AppTranslationKey): string => t[key];
}
