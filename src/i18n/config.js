import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enApp from '../locales/en/app.json';
import arApp from '../locales/ar/app.json';
import { applyMetronicRtlStylesheets, applyDocumentDirection } from './rtlStylesheets';

const resources = {
    en: { translation: enApp },
    ar: { translation: arApp },
};

function applyDocumentLanguage(lng) {
    const code = (lng || 'en').split('-')[0];
    const rtl = code === 'ar';
    const dir = rtl ? 'rtl' : 'ltr';

    applyDocumentDirection(dir);
    document.documentElement.lang = code;
    document.body.classList.toggle('app-i18n-rtl', rtl);

    applyMetronicRtlStylesheets(rtl);

    requestAnimationFrame(() => {
        try {
            if (window.KTDrawer) {
                window.KTDrawer.init();
            }
            if (window.KTMenu) {
                window.KTMenu.createInstances();
            }
        } catch {
            /* ignore if bundles not loaded yet */
        }
    });
}

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: { escapeValue: false },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
        },
    });

applyDocumentLanguage(i18n.language);
i18n.on('languageChanged', applyDocumentLanguage);

export default i18n;
