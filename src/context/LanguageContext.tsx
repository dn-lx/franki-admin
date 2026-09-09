import React, { createContext, useContext, useMemo, useState } from 'react';

export type Language = 'de' | 'en';

type Dictionary = Record<string, { de: string; en: string }>;

const dictionary: Dictionary = {
  home: { de: 'Übersicht', en: 'Overview' },
  frankiflow: { de: 'FrankiFlow', en: 'FrankiFlow' },
  frankiholz: { de: 'FrankiHolz', en: 'FrankiHolz' },
  settings: { de: 'Einstellungen', en: 'Settings' },
  refresh: { de: 'Aktualisieren', en: 'Refresh' },
  save: { de: 'Speichern', en: 'Save' },
  cancel: { de: 'Abbrechen', en: 'Cancel' },
  close: { de: 'Schließen', en: 'Close' },
  edit: { de: 'Bearbeiten', en: 'Edit' },
  delete: { de: 'Löschen', en: 'Delete' },
  search: { de: 'Suchen', en: 'Search' },
  new: { de: 'Neu', en: 'New' },
  loading: { de: 'Wird geladen …', en: 'Loading …' },
  noData: { de: 'Noch keine Daten.', en: 'No data yet.' },
  signOut: { de: 'Abmelden', en: 'Sign out' },
  bookings: { de: 'Buchungen', en: 'Bookings' },
  calendar: { de: 'Kalender', en: 'Calendar' },
  rooms: { de: 'Zimmer', en: 'Rooms' },
  pricing: { de: 'Preise', en: 'Pricing' },
  integrations: { de: 'Integrationen', en: 'Integrations' },
  quotes: { de: 'Anfragen', en: 'Quotes' },
  payments: { de: 'Zahlungen', en: 'Payments' },
  jobs: { de: 'Aufträge', en: 'Jobs' },
  clients: { de: 'Kunden', en: 'Clients' },
  employees: { de: 'Mitarbeiter', en: 'Employees' },
  website: { de: 'Webseite', en: 'Website' },
  active: { de: 'Aktiv', en: 'Active' },
  inactive: { de: 'Inaktiv', en: 'Inactive' },
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (value: Language) => void;
  t: (key: keyof typeof dictionary | string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('de');
  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t: (key) => dictionary[key]?.[language] ?? String(key),
  }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
}
