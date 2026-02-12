/**
 * Survey and common UI strings. Supports major US languages; fallback to English for untranslated locales.
 */
export type Locale =
  | 'en'
  | 'es'
  | 'pt'
  | 'it'
  | 'ru'
  | 'uk'
  | 'zh'
  | 'vi'
  | 'tl'
  | 'fr'
  | 'ar'
  | 'ko';

/** Display names for the language switcher (language in its own language). */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  it: 'Italiano',
  ru: 'Русский',
  uk: 'Українська',
  zh: '中文',
  vi: 'Tiếng Việt',
  tl: 'Tagalog',
  fr: 'Français',
  ar: 'العربية',
  ko: '한국어',
};

/** Intl locale codes for date/number formatting. */
export const LOCALE_TO_INTL: Record<Locale, string> = {
  en: 'en-US',
  es: 'es',
  pt: 'pt',
  it: 'it',
  ru: 'ru',
  uk: 'uk',
  zh: 'zh-CN',
  vi: 'vi',
  tl: 'tl',
  fr: 'fr',
  ar: 'ar',
  ko: 'ko',
};

export function getIntlLocale(locale: Locale): string {
  return LOCALE_TO_INTL[locale] ?? 'en-US';
}

const enSurvey = {
    // Survey page
    pageTitle: 'Find your perfect plan',
    pageSubtitle: "Answer a few quick questions and we'll recommend the best plan for your business.",
    pricing: 'Pricing',
    findYourPlan: 'Find Your Plan',
    features: 'Features',
    contact: 'Contact',
    signIn: 'Sign In',
    getStarted: 'Get Started',

    // Organization type (first question)
    orgTypeQuestion: 'Is your organization employee-based or franchise-based?',
    employeeBased: 'Employee-based (we employ our cleaners directly)',
    franchiseBased: 'Franchise-based (we operate as or within a franchise)',

    // Franchise role (only if franchise-based)
    franchiseRoleQuestion: 'Within the franchise, are you the Area Franchisor or the Unit Franchisee?',
    areaFranchisor: 'Area Franchisor (I develop/support multiple franchise units)',
    unitFranchisee: 'Unit Franchisee (I operate a single franchise location)',

    // Existing questions
    focusQuestion: 'What do you need JANIBEAR for?',
    focusSalesOnly: 'Strictly sales (leads, proposals, outreach)',
    focusSalesQc: 'Sales plus QC and ops (playbooks, deal QA, consistency)',

    scaleQuestion: 'What scale fits your business?',
    scaleSmall: 'One rep / one pipeline—I need someone selling now',
    scaleLarge: 'Team / multiple pipelines—we need throughput',

    // Wizard UI
    back: 'Back',
    next: 'Next',
    getRecommendation: 'Get Recommendation',
    weRecommend: 'We Recommend',
    basedOnAnswers: 'Based on your answers, the',
    planPerfectForYou: 'plan is perfect for you!',
    viewPlan: 'View',
    plan: 'Plan',
    viewAllPricing: 'Want to see all plans?',
    viewAllPricingLink: 'View all pricing',

    // Plan names
    planCub: 'Cub',
    planBlackBear: 'Black Bear',
    planGrizzly: 'Grizzly',
    planKodiak: 'Kodiak',
  };

export const surveyTranslations = {
  en: enSurvey,
  es: {
    pageTitle: 'Encuentra tu plan ideal',
    pageSubtitle: 'Responde unas preguntas y te recomendaremos el mejor plan para tu negocio.',
    pricing: 'Precios',
    findYourPlan: 'Encuentra tu plan',
    features: 'Características',
    contact: 'Contacto',
    signIn: 'Iniciar sesión',
    getStarted: 'Comenzar',

    orgTypeQuestion: '¿Su organización es por empleados o por franquicias?',
    employeeBased: 'Por empleados (contratamos a nuestros limpiadores directamente)',
    franchiseBased: 'Por franquicias (operamos como o dentro de una franquicia)',

    franchiseRoleQuestion: 'Dentro de la franquicia, ¿es usted el Franquiciador de Área o el Franquiciado de Unidad?',
    areaFranchisor: 'Franquiciador de Área (desarrollo/apoyo múltiples unidades)',
    unitFranchisee: 'Franquiciado de Unidad (opero una sola ubicación)',

    focusQuestion: '¿Para qué necesita JANIBEAR?',
    focusSalesOnly: 'Solo ventas (prospectos, propuestas, outreach)',
    focusSalesQc: 'Ventas más QC y operaciones (playbooks, QA de tratos, consistencia)',

    scaleQuestion: '¿Qué escala se ajusta a su negocio?',
    scaleSmall: 'Un representante / un pipeline—necesito ventas ya',
    scaleLarge: 'Equipo / múltiples pipelines—necesitamos volumen',

    back: 'Atrás',
    next: 'Siguiente',
    getRecommendation: 'Obtener recomendación',
    weRecommend: 'Te recomendamos',
    basedOnAnswers: 'Según tus respuestas, el plan',
    planPerfectForYou: 'es ideal para ti.',
    viewPlan: 'Ver plan',
    plan: 'Plan',
    viewAllPricing: '¿Quieres ver todos los planes?',
    viewAllPricingLink: 'Ver todos los precios',

    planCub: 'Cub',
    planBlackBear: 'Black Bear',
    planGrizzly: 'Grizzly',
    planKodiak: 'Kodiak',
  },
  // Fallback to English for now; replace with localized strings as needed
  pt: enSurvey,
  it: enSurvey,
  ru: enSurvey,
  uk: enSurvey,
  zh: enSurvey,
  vi: enSurvey,
  tl: enSurvey,
  fr: enSurvey,
  ar: enSurvey,
  ko: enSurvey,
} as const;

export type SurveyTranslationKey = keyof (typeof surveyTranslations)['en'];

export function getSurveyT(locale: Locale) {
  const t = surveyTranslations[locale] ?? surveyTranslations.en;
  return (key: SurveyTranslationKey): string => t[key];
}
