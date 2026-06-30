import { useState } from 'react';
import { fmtMoney } from '../../../../services/adminAccountingService';

export const subTypeKey = (sectionKey, subTypeName, index) => `${sectionKey}::${subTypeName}::${index}`;

export const ChevronIcon = ({ expanded }) => (
    <i className={`ki-duotone ki-${expanded ? 'down' : 'right'} fs-4`}>
        <span className="path1" />
        <span className="path2" />
    </i>
);

export const AccountRow = ({ account, indent = 0 }) => (
    <div
        className="d-flex align-items-center justify-content-between py-2 border-bottom"
        style={{ paddingLeft: `${indent}px` }}
    >
        <div className="d-flex align-items-center gap-3 flex-grow-1">
            <span className="text-muted fs-8" style={{ minWidth: 48 }}>{account.code ?? '-'}</span>
            <span className="text-gray-700 fw-semibold">{account.name}</span>
        </div>
        <span className="text-gray-800 fw-semibold text-end">{fmtMoney(account.balance)}</span>
    </div>
);

export const ReportHeaderRow = ({ accountLabel, amountLabel }) => (
    <div className="py-2 border-top border-bottom d-flex align-items-center justify-content-between text-gray-500 fw-bold fs-7 text-uppercase">
        <span className="flex-grow-1">{accountLabel}</span>
        <span style={{ minWidth: 120 }} className="text-end">{amountLabel}</span>
    </div>
);

export const SubTypeBlock = ({
    subType,
    subTypeId,
    expanded,
    onToggle,
    totalLabelPrefix,
    indent = 32,
}) => (
    <div className="border-bottom">
        <div
            className="d-flex align-items-center justify-content-between py-2 cursor-pointer"
            style={{ paddingLeft: `${indent}px`, cursor: 'pointer' }}
            onClick={onToggle}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        >
            <div className="d-flex align-items-center gap-2">
                <ChevronIcon expanded={expanded} />
                <span className="fw-bold text-gray-800">{subType.sub_type_name}</span>
            </div>
            {!expanded ? (
                <span className="fw-bold text-gray-800 me-3">{fmtMoney(subType.subtotal)}</span>
            ) : null}
        </div>
        {expanded ? (
            <div className="pb-2">
                {(subType.accounts || []).map((account, idx) => (
                    <AccountRow
                        key={account.id ?? `${subTypeId}-${idx}`}
                        account={account}
                        indent={indent + 24}
                    />
                ))}
                <div
                    className="d-flex align-items-center justify-content-between py-2 border-top fw-bold text-gray-800"
                    style={{ paddingLeft: `${indent + 24}px`, paddingRight: 12 }}
                >
                    <span>{totalLabelPrefix} {subType.sub_type_name}</span>
                    <span>{fmtMoney(subType.subtotal)}</span>
                </div>
            </div>
        ) : null}
    </div>
);

export const SectionBlock = ({
    section,
    sectionKey,
    sectionExpanded,
    expandAll,
    expandedSubTypes,
    onToggleSection,
    onToggleSubType,
    totalLabelPrefix,
    showMasterHeader = false,
    masterExpanded,
    onToggleMaster,
    masterTotal,
    masterHeaderLabel,
}) => (
    <div className="py-2 account-main-inner">
        {showMasterHeader ? (
            <div
                className="d-flex align-items-center justify-content-between mb-3 cursor-pointer"
                style={{ cursor: 'pointer' }}
                onClick={onToggleMaster}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onToggleMaster()}
            >
                <div className="d-flex align-items-center gap-2">
                    <ChevronIcon expanded={masterExpanded} />
                    <p className="mb-0 fw-bold">{masterHeaderLabel}</p>
                </div>
                {!masterExpanded ? (
                    <p className="mb-0 fw-bold text-end">{fmtMoney(masterTotal)}</p>
                ) : null}
            </div>
        ) : null}

        <div
            className="d-flex align-items-center justify-content-between mb-2 cursor-pointer"
            style={{ cursor: 'pointer' }}
            onClick={() => onToggleSection(sectionKey)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onToggleSection(sectionKey)}
        >
            <div className="d-flex align-items-center gap-2">
                <ChevronIcon expanded={sectionExpanded} />
                <p className="mb-0 fw-bold ps-1">{section.name}</p>
            </div>
            {!sectionExpanded ? (
                <p className="mb-0 fw-bold text-end">{fmtMoney(section.total)}</p>
            ) : null}
        </div>

        {sectionExpanded ? (
            <div className="section-content">
                {(section.sub_types || []).map((subType, index) => {
                    const id = subTypeKey(sectionKey, subType.sub_type_name, index);
                    return (
                        <SubTypeBlock
                            key={id}
                            subType={subType}
                            subTypeId={id}
                            expanded={expandAll || expandedSubTypes[id] !== false}
                            onToggle={() => onToggleSubType(id)}
                            totalLabelPrefix={totalLabelPrefix}
                        />
                    );
                })}
                <div className="d-flex align-items-center justify-content-between py-2 border-top border-bottom fw-bold text-gray-900 mt-1">
                    <span>{totalLabelPrefix} {section.name}</span>
                    <span>{fmtMoney(section.total)}</span>
                </div>
            </div>
        ) : null}
    </div>
);

export const SummaryRow = ({ label, amount, highlight = false, large = false, dataTestId }) => (
    <div
        className={`d-flex align-items-center justify-content-between py-2 border-bottom fw-bold text-gray-900 ${
            large ? 'fs-5 py-3 border-top' : ''
        } ${highlight ? 'text-primary' : ''}`}
        data-testid={dataTestId}
        data-amount={amount}
    >
        <span>{label}</span>
        <span className={Number(amount) < 0 ? 'text-danger' : highlight ? 'text-primary' : ''}>
            {fmtMoney(amount)}
        </span>
    </div>
);

export const useReportExpandState = (sectionKeys = []) => {
    const [expandAll, setExpandAll] = useState(true);
    const [expandedSections, setExpandedSections] = useState({});
    const [expandedSubTypes, setExpandedSubTypes] = useState({});
    const [expandedMaster, setExpandedMaster] = useState(true);

    const isSectionExpanded = (sectionKey) => {
        if (expandAll) return true;
        return expandedSections[sectionKey] !== false;
    };

    const isMasterExpanded = expandAll || expandedMaster;

    const handleExpandCollapseAll = (shouldExpand) => {
        setExpandAll(shouldExpand);
        if (shouldExpand) {
            setExpandedSections({});
            setExpandedSubTypes({});
            setExpandedMaster(true);
        } else {
            const collapsed = {};
            sectionKeys.forEach((key) => {
                collapsed[key] = false;
            });
            setExpandedSections(collapsed);
            setExpandedSubTypes({});
            setExpandedMaster(false);
        }
    };

    const handleToggleSection = (sectionKey) => {
        setExpandAll(false);
        setExpandedSections((prev) => ({
            ...prev,
            [sectionKey]: prev[sectionKey] === false,
        }));
    };

    const handleToggleSubType = (id) => {
        setExpandAll(false);
        setExpandedSubTypes((prev) => ({
            ...prev,
            [id]: prev[id] === false,
        }));
    };

    const handleToggleMaster = () => {
        setExpandAll(false);
        setExpandedMaster((prev) => !prev);
    };

    return {
        expandAll,
        expandedSections,
        expandedSubTypes,
        expandedMaster,
        isSectionExpanded,
        isMasterExpanded,
        handleExpandCollapseAll,
        handleToggleSection,
        handleToggleSubType,
        handleToggleMaster,
    };
};
