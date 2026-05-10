import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { replaceLocaleInPathname } from '../../i18n/localePaths';

const LANGUAGES = [
    { code: 'en', labelKey: 'header.langEnglish' },
    { code: 'ar', labelKey: 'header.langArabic' },
];

/** Same panel classes as theme mode submenu in Header.jsx */
const THEME_STYLE_SUBMENU_CLASS =
    'menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-title-gray-700 menu-icon-gray-500 menu-active-bg menu-state-color fw-semibold py-4 fs-base w-150px';

/**
 * @param {{ variant?: 'navbar' | 'userMenu' }} props
 */
export default function LanguageSwitcher({ variant = 'navbar' }) {
    const { i18n, t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (window.KTMenu) {
            window.KTMenu.createInstances();
        }
    }, [i18n.language, variant]);

    const resolved =
        LANGUAGES.find((l) => (i18n.language || 'en').toLowerCase().startsWith(l.code)) || LANGUAGES[0];

    const submenu = (
        <div className={THEME_STYLE_SUBMENU_CLASS} data-kt-menu="true" data-kt-element="language-menu">
            {LANGUAGES.map(({ code, labelKey }) => {
                const active = (i18n.language || 'en').toLowerCase().startsWith(code);
                return (
                    <div key={code} className="menu-item px-3 my-0">
                        <a
                            href="#"
                            className={`menu-link px-3 py-2 ${active ? 'active' : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                void i18n.changeLanguage(code);
                                const { pathname, search, hash } = location;
                                if (/^\/(en|ar)(\/|$)/.test(pathname)) {
                                    const next = `${replaceLocaleInPathname(pathname, code)}${search}${hash}`;
                                    navigate(next, { replace: true });
                                }
                            }}
                        >
                            <span className="menu-title">{t(labelKey)}</span>
                        </a>
                    </div>
                );
            })}
        </div>
    );

    if (variant === 'userMenu') {
        return (
            <div
                className="menu-item px-5"
                data-kt-menu-trigger="{default:'click', lg: 'hover'}"
                data-kt-menu-placement="left-start"
                data-kt-menu-flip="true"
            >
                <a
                    href="#"
                    className="menu-link px-5 py-3 d-flex align-items-center"
                    onClick={(e) => e.preventDefault()}
                >
                    <span className="menu-icon">
                        <i className="ki-duotone ki-abstract-26 fs-2">
                            <span className="path1" />
                            <span className="path2" />
                        </i>
                    </span>
                    <span className="menu-title flex-grow-1">{t('header.language')}</span>
                    <span className="menu-arrow"></span>
                </a>
                {submenu}
            </div>
        );
    }

    return (
        <div className="app-navbar-item ms-1 ms-md-4">
            <a
                href="#"
                className="btn btn-icon btn-custom btn-icon-muted btn-active-light btn-active-color-primary w-40px h-35px"
                data-kt-menu-trigger="{default:'click', lg: 'hover'}"
                data-kt-menu-attach="parent"
                data-kt-menu-placement="bottom-start"
                title={t('header.language')}
                onClick={(e) => e.preventDefault()}
            >
                <span className="fw-bold fs-7 text-gray-800">{resolved.code.toUpperCase()}</span>
            </a>
            {submenu}
        </div>
    );
}
