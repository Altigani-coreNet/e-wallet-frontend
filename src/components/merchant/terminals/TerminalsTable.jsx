import React from 'react';
import { useTranslation } from 'react-i18next';
import Pagination from '../../common/Pagination';
import TerminalTableRow from './TerminalTableRow';

const TerminalsTable = ({ 
    terminals,
    branches,
    selectedIds, 
    setSelectedIds, 
    pagination, 
    onPageChange, 
    onPerPageChange,
    onRefresh,
    loading,
    error 
}) => {
    const { t } = useTranslation();

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(terminals.map(terminal => terminal.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const isAllSelected = terminals.length > 0 && selectedIds.length === terminals.length;
    const isSomeSelected = selectedIds.length > 0 && selectedIds.length < terminals.length;

    return (
        <div className="table-responsive">
            <table className="table align-middle table-row-dashed fs-6 gy-5">
                <thead>
                    <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                        <th className="w-10px pe-2">
                            <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                                <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    checked={isAllSelected}
                                    ref={input => {
                                        if (input) {
                                            input.indeterminate = isSomeSelected;
                                        }
                                    }}
                                    onChange={handleSelectAll}
                                />
                            </div>
                        </th>
                        <th className="min-w-125px">{t('merchant.terminalsIndex.colName')}</th>
                        <th className="min-w-125px">{t('merchant.terminalsIndex.colTerminalId')}</th>
                        <th className="min-w-125px">{t('merchant.terminalsIndex.colBranch')}</th>
                        <th className="min-w-100px">{t('merchant.terminalsIndex.colModel')}</th>
                        <th className="min-w-100px">{t('merchant.terminalsIndex.colManufacturer')}</th>
                        <th className="min-w-100px">{t('merchant.terminalsIndex.colStatus')}</th>
                        <th className="text-end min-w-100px">{t('merchant.terminalsIndex.colActions')}</th>
                    </tr>
                </thead>
                <tbody className="fw-semibold text-gray-600">
                    {loading ? (
                        <tr>
                            <td colSpan="8" className="text-center py-10">
                                <div className="spinner-border spinner-border-sm text-primary" role="status">
                                    <span className="visually-hidden">{t('merchant.common.loading')}</span>
                                </div>
                                <div className="text-gray-500 mt-2">{t('merchant.terminalsIndex.loadingTerminals')}</div>
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td colSpan="8" className="text-center py-10">
                                <div className="alert alert-danger d-inline-block">
                                    <i className="bi bi-exclamation-triangle me-2"></i>
                                    {error}
                                </div>
                                <div className="mt-3">
                                    <button 
                                        className="btn btn-sm btn-primary"
                                        onClick={onRefresh}
                                    >
                                        <i className="bi bi-arrow-clockwise me-1"></i>
                                        {t('merchant.common.retry')}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ) : terminals.length === 0 ? (
                        <tr>
                            <td colSpan="8" className="text-center py-10">
                                <div className="text-gray-500">{t('merchant.terminalsIndex.noTerminalsFound')}</div>
                            </td>
                        </tr>
                    ) : (
                        terminals.map(terminal => (
                            <TerminalTableRow
                                key={terminal.id}
                                terminal={terminal}
                                branch={branches[terminal.branch_id]}
                                isSelected={selectedIds.includes(terminal.id)}
                                onSelect={() => handleSelectRow(terminal.id)}
                                onRefresh={onRefresh}
                            />
                        ))
                    )}
                </tbody>
            </table>

            {terminals.length > 0 && (
                <Pagination
                    currentPage={pagination.current_page}
                    lastPage={pagination.last_page}
                    perPage={pagination.per_page}
                    total={pagination.total}
                    onPageChange={onPageChange}
                    onPerPageChange={onPerPageChange}
                />
            )}
        </div>
    );
};

export default TerminalsTable;
