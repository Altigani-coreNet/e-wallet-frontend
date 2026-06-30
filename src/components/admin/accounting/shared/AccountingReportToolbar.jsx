import React from 'react';
import { useTranslation } from 'react-i18next';

const AccountingReportToolbar = ({
    onExport,
    exporting = false,
    onPrint,
    onExpandCollapseAll,
    expandAll,
    expandAllLabel,
    collapseAllLabel,
    exportLabel,
    printLabel,
    isBalanced,
}) => {
    const { t } = useTranslation();

    return (
        <>
            {onExpandCollapseAll ? (
                <button
                    type="button"
                    className="btn btn-sm btn-flex btn-light fw-bold me-2"
                    onClick={onExpandCollapseAll}
                >
                    <i className="ki-duotone ki-category fs-3">
                        <span className="path1" />
                        <span className="path2" />
                        <span className="path3" />
                        <span className="path4" />
                    </i>
                    <span className="d-none d-md-inline ms-1">
                        {expandAll ? collapseAllLabel : expandAllLabel}
                    </span>
                </button>
            ) : null}

            {onPrint ? (
                <button
                    type="button"
                    className="btn btn-sm btn-flex btn-light fw-bold me-2"
                    onClick={onPrint}
                >
                    <i className="ki-duotone ki-printer fs-3">
                        <span className="path1" />
                        <span className="path2" />
                        <span className="path3" />
                    </i>
                    <span className="d-none d-md-inline ms-1">{printLabel || t('admin.accounting.profitLoss.print')}</span>
                </button>
            ) : null}

            {onExport ? (
                <button
                    type="button"
                    className="btn btn-sm fw-bold btn-success me-2"
                    onClick={onExport}
                    disabled={exporting}
                >
                    <i className="ki-duotone ki-exit-up fs-3">
                        <span className="path1" />
                        <span className="path2" />
                    </i>
                    <span className="d-none d-md-inline ms-1">
                        {exporting ? t('common.loading') : (exportLabel || t('common.export'))}
                    </span>
                </button>
            ) : null}

            {isBalanced !== undefined && isBalanced !== null ? (
                <span
                    className={`badge align-self-center ${
                        isBalanced ? 'badge-light-success' : 'badge-light-danger'
                    }`}
                >
                    {isBalanced
                        ? t('admin.accounting.systemBalanced')
                        : t('admin.accounting.systemUnbalanced')}
                </span>
            ) : null}
        </>
    );
};

export default AccountingReportToolbar;
