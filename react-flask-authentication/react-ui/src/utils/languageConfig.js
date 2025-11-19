/**
 * Central definition of available UI languages.
 * These codes must match the keys configured in i18n (see src/i18n.js).
 */

export const AVAILABLE_LANGUAGES = [
  {
    code: 'en',
    label: 'English',
    shortLabel: 'EN',
    flag: ''
  },
  {
    code: 'bg',
    label: 'Bulgarian',
    shortLabel: 'BG',
    flag: ''
  }
];

export const DEFAULT_ENABLED_LANGUAGES = AVAILABLE_LANGUAGES.map((lang) => lang.code);

