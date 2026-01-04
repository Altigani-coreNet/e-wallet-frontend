import React from 'react';
import { Link } from 'react-router-dom';
import { getTranslatedText } from '../../../utils/helpers';

const InfoRow = ({ label, value, fallback = 'N/A' }) => (
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
            <div className="card-toolbar">
                {action}
            </div>
            
        </div>
        <div className="card-body p-9">{children}</div>
    </div>
);

const renderStatusBadge = (status) => {
    const isActive = status === true || status === 1 || status === '1' || status === 'active';

    return (
        <span className={`badge badge-light-${isActive ? 'success' : 'danger'}`}>
            {isActive ? 'Active' : 'Inactive'}
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
    if (!user) {
        return null;
    }

    const merchant = user.merchant || null;
    const branch = user.branch || null;

    return (
        <div className="row g-5 g-xl-8">
            <div className="col-xl-12">
                <SectionCard
                    title="Basic Information"
                    action={
                        canEdit && editUrl ? (
                            <Link to={editUrl} className="btn btn-primary btn-sm">
                                Edit User
                            </Link>
                        ) : null
                    }
                >
                    <InfoRow label="Full Name" value={user.name} />
                    <InfoRow label="Email" value={user.email} />
                    <InfoRow label="Phone" value={user.phone} />
                    <InfoRow label="Status" value={renderStatusBadge(user.status)} />
                    <InfoRow label="Created At" value={formatDateTime(user.created_at)} />
                    {user.updated_at && <InfoRow label="Last Updated" value={formatDateTime(user.updated_at)} />}
                </SectionCard>
            </div>

            {showMerchantDetails && (
                <div className="col-xl-12">
                    <SectionCard
                        title="Merchant Details"
                        action={
                            merchant && (merchantLink || merchant.id)
                                ? (
                                      <a
                                          href={merchantLink || `/admin/merchants/${merchant.id}`}
                                          className="btn btn-sm btn-light-primary"
                                      >
                                          View Merchant
                                      </a>
                                  )
                                : null
                        }
                    >
                        {merchant ? (
                            <>
                                <InfoRow
                                    label="Merchant Name"
                                    value={getTranslatedText(merchant.business_name) || getTranslatedText(merchant.name)}
                                />
                                <InfoRow label="Owner Name" value={merchant.owner_name} />
                                <InfoRow label="Email" value={merchant.email} />
                                <InfoRow label="Phone" value={merchant.phone} />
                                <InfoRow label="Business Type" value={merchant.business_type_display_name} />
                                <InfoRow label="Address" value={merchant.address} />
                                <InfoRow label="Merchant Code" value={merchant.merchant_code} />
                                <InfoRow label="Status" value={renderStatusBadge(merchant.is_active)} />
                            </>
                        ) : (
                            <div className="alert alert-warning d-flex align-items-center p-5 mb-0">
                                <i className="ki-duotone ki-information fs-2x text-warning me-4">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                <div className="d-flex flex-column">
                                    <h4 className="mb-1 text-warning">No Merchant Assigned</h4>
                                    <span>This user is not linked to a merchant yet.</span>
                                </div>
                            </div>
                        )}
                    </SectionCard>
                </div>
            )}

            {showBranchDetails && (
                <div className="col-xl-12">
                    <SectionCard
                        title="Branch Details"
                        action={
                            branch && (branchLink || branch.id) ? (
                                <Link
                                    to={branchLink || `/admin/branches/${branch.id}`}
                                    className="btn btn-sm btn-light-primary"
                                >
                                    View Branch
                                </Link>
                            ) : null
                        }
                    >
                        {branch ? (
                            <>
                                <InfoRow label="Branch Name" value={getTranslatedText(branch.name)} />
                                <InfoRow label="Address" value={branch.address} />
                                <InfoRow label="Status" value={renderStatusBadge(branch.is_active)} />
                            </>
                        ) : (
                            <div className="alert alert-info d-flex align-items-center p-5 mb-0">
                                <i className="ki-duotone ki-abstract-26 fs-2x text-info me-4">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                <div className="d-flex flex-column">
                                    <h4 className="mb-1 text-info">No Branch Assigned</h4>
                                    <span>This user is not linked to a specific branch.</span>
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

