import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { releaseRegistrationForLogin } from '../../../../utils/registrationAuth';

const CompletionStep = ({ onRegisterAnother, variant = 'merchant' }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const v = variant === 'partner' ? 'partner' : 'merchant';

    const handleRegisterAnother = () => {
        if (typeof onRegisterAnother === 'function') {
            onRegisterAnother();
        }
    };

    const handleGoToLogin = (e) => {
        e.preventDefault();
        releaseRegistrationForLogin();
        navigate('/login', { replace: true });
    };

    return (
        <div className="w-100 mw-600px mx-auto">
            <div className="card-body text-center p-5 p-lg-10">
                <div className="mb-5">
                    <i className="fas fa-check-circle text-success fs-3x"></i>
                </div>

                <p className="text-muted mb-5">{t(`auth.completion.${v}.submitted`)}</p>

                <div className="notice d-flex bg-light-primary rounded border-primary border border-dashed p-4 p-lg-6 mb-5">
                    <div className="d-flex flex-stack flex-grow-1">
                        <div className="fw-bold">
                            <h4 className="text-gray-900 fw-bolder">{t(`auth.completion.${v}.welcomeTitle`)}</h4>
                            <div className="fs-6 text-gray-700">{t(`auth.completion.${v}.welcomeBody`)}</div>
                        </div>
                    </div>
                </div>

                <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                    <button type="button" className="btn btn-primary w-100" onClick={handleGoToLogin}>
                        {t('auth.completion.goToLogin')}
                    </button>
                    <button type="button" className="btn btn-light w-100" onClick={handleRegisterAnother}>
                        {t('auth.completion.registerAnother')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompletionStep;
