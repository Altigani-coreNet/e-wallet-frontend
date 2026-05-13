import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTranslatedText } from '../../../utils/helpers';

const InfoRow = ({ label, value, fallback }) => (
    <div className="row mb-7">
        <label className="col-lg-4 fw-semibold text-muted">{label}</label>
        <div className="col-lg-8">
            <span className="fw-bold fs-6 text-gray-800">{value ?? fallback}</span>
        </div>
    </div>
);

const SectionCard = ({ title, action, children }) => (
    <div className="card mb-5 mb-xl-10">
        <div className="card-header cursor-pointer">
            <div className="card-title m-0">
                <h3 className="fw-bolder m-0">{title}</h3>
            </div>
            <div className="card-toolbar">{action}</div>
        </div>
        <div className="card-body p-9">{children}</div>
    </div>
);

const renderStatusBadge = (status, activeLabel, inactiveLabel) => {
    const isActive = status === true || status === 1 || status === '1' || status === 'active';

    return (
        <span className={`badge badge-light-${isActive ? 'success' : 'danger'}`}>
            {isActive ? activeLabel : inactiveLabel}
        </span>
    );
};

const formatDateTime = (value) => {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString();
};

const UserOverviewTab = ({
    user,
    canEdit = true,
    editUrl,
    showMerchantDetails = true,
    merchantLink,
    showBranchDetails = true,
    branchLink,
}) => {
    const { t } = useTranslation();
    const na = t('merchant.common.na');
    const activeLabel = t('merchant.common.active');
    const inactiveLabel = t('merchant.common.inactive');

    if (!user) {
        return null;
    }

    const merchant = user.merchant || null;
    const branch = user.branch || null;

    return (
        <div className="row g-5 g-xl-8">
            <div className="col-xl-12">
                <SectionCard
                    title={t('merchant.users.overviewTab.basicInformation')}
                    action={
                        canEdit && editUrl ? (
                            <Link to={editUrl} className="btn btn-primary btn-sm">
                                {t('merchant.users.overviewTab.editUser')}
                            </Link>
                        ) : null
                    }
                >
                    <InfoRow label={t('merchant.users.overviewTab.fullName')} value={user.name} fallback={na} />
                    <InfoRow label={t('merchant.users.overviewTab.email')} value={user.email} fallback={na} />
                    <InfoRow label={t('merchant.users.overviewTab.phone')} value={user.phone} fallback={na} />
                    <InfoRow
                        label={t('merchant.users.overviewTab.status')}
                        value={renderStatusBadge(user.status, activeLabel, inactiveLabel)}
                        fallback={na}
                    />
                    <InfoRow
                        label={t('merchant.users.overviewTab.createdAt')}
                        value={formatDateTime(user.created_at)}
                        fallback={na}
                    />
                    {user.updated_at && (
                        <InfoRow
                            label={t('merchant.users.overviewTab.lastUpdated')}
                            value={formatDateTime(user.updated_at)}
                            fallback={na}
                        />
                    )}
                </SectionCard>
            </div>

            {showMerchantDetails && (
                <div className="col-xl-12">
                    <SectionCard
                        title={t('merchant.users.overviewTab.merchantDetails')}
                        action={
                            merchant && (merchantLink || merchant.id) ? (
                                <a
                                    href={merchantLink || `/admin/merchants/${merchant.id}`}
                                    className="btn btn-sm btn-light-primary"
                                >
                                    {t('merchant.users.overviewTab.viewMerchant')}
                                </a>
                            ) : null
                        }
                    >
                        {merchant ? (
                            <>
                                <InfoRow
                                    label={t('merchant.users.overviewTab.merchantName')}
                                    value={getTranslatedText(merchant.business_name) || getTranslatedText(merchant.name)}
                                    fallback={na}
                                />
                                <InfoRow label={t('merchant.users.overviewTab.ownerName')} value={merchant.owner_name} fallback={na} />
                                <InfoRow label={t('merchant.users.overviewTab.email')} value={merchant.email} fallback={na} />
                                <InfoRow label={t('merchant.users.overviewTab.phone')} value={merchant.phone} fallback={na} />
                                <InfoRow
                                    label={t('merchant.users.overviewTab.businessType')}
                                    value={merchant.business_type_display_name}
                                    fallback={na}
                                />
                                <InfoRow label={t('merchant.users.overviewTab.address')} value={merchant.address} fallback={na} />
                                <InfoRow label={t('merchant.users.overviewTab.merchantCode')} value={merchant.merchant_code} fallback={na} />
                                <InfoRow
                                    label={t('merchant.users.overviewTab.status')}
                                    value={renderStatusBadge(merchant.is_active, activeLabel, inactiveLabel)}
                                    fallback={na}
                                />
                            </>
                        ) : (
                            <div className="alert alert-warning d-flex align-items-center p-5 mb-0">
                                <i className="ki-duotone ki-information fs-2x text-warning me-4">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                <div className="d-flex flex-column">
                                    <h4 className="mb-1 text-warning">{t('merchant.users.overviewTab.noMerchantTitle')}</h4>
                                    <span>{t('merchant.users.overviewTab.noMerchantHint')}</span>
                                </div>
                            </div>
                        )}
                    </SectionCard>
                </div>
            )}

            {showBranchDetails && (
                <div className="col-xl-12">
                    <SectionCard
                        title={t('merchant.users.overviewTab.branchDetails')}
                        action={
                            branch && (branchLink || branch.id) ? (
                                <Link to={branchLink || `/admin/branches/${branch.id}`} className="btn btn-sm btn-light-primary">
                                    {t('merchant.users.overviewTab.viewBranch')}
                                </Link>
                            ) : null
                        }
                    >
                        {branch ? (
                            <>
                                <InfoRow
                                    label={t('merchant.users.overviewTab.branchName')}
                                    value={getTranslatedText(branch.name)}
                                    fallback={na}
                                />
                                <InfoRow label={t('merchant.users.overviewTab.address')} value={branch.address} fallback={na} />
                                <InfoRow
                                    label={t('merchant.users.overviewTab.status')}
                                    value={renderStatusBadge(branch.is_active, activeLabel, inactiveLabel)}
                                    fallback={na}
                                />
                            </>
                        ) : (
                            <div className="alert alert-info d-flex align-items-center p-5 mb-0">
                                <i className="ki-duotone ki-abstract-26 fs-2x text-info me-4">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                <div className="d-flex flex-column">
                                    <h4 className="mb-1 text-info">{t('merchant.users.overviewTab.noBranchTitle')}</h4>
                                    <span>{t('merchant.users.overviewTab.noBranchHint')}</span>
                                </div>
                            </div>
                        )}
                    </SectionCard>
                </div>
            )}
        </div>
    );
};

export default UserOverviewTab;
