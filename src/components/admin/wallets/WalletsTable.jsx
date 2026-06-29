import { useTranslation } from 'react-i18next';
import WalletTableRow from './WalletTableRow';

const WalletsTable = ({
    wallets,
    onSuspend,
    onActivate,
    onDelete,
    pagination,
    onPageChange,
    onPerPageChange,
    isFetching,
}) => {
    const { t } = useTranslation();

    const generatePageNumbers = () => {
        const pages = [];
        const maxPages = pagination.last_page || 1;
        const currentPage = pagination.current_page || 1;

        let startPage = Math.max(1, currentPage - 3);
        let endPage = Math.min(maxPages, currentPage + 3);

        if (endPage - startPage < 6) {
            if (startPage === 1) {
                endPage = Math.min(maxPages, startPage + 6);
            } else if (endPage === maxPages) {
                startPage = Math.max(1, endPage - 6);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return pages;
    };

    const currentPage = pagination.current_page || 1;
    const perPage = pagination.per_page || 15;

    return (
        <>
            <div
                className="table-responsive"
                style={{ opacity: isFetching ? 0.7 : 1, transition: 'opacity 0.2s' }}
            >
                <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                    <thead>
                        <tr className="fw-bold text-muted">
                            <th className="min-w-50px">#</th>
                            <th className="min-w-150px">{t('admin.wallets.walletId')}</th>
                            <th className="min-w-100px">{t('admin.wallets.walletType')}</th>
                            <th className="min-w-180px">{t('admin.wallets.owner')}</th>
                            <th className="min-w-120px">{t('admin.wallets.merchant')}</th>
                            <th className="min-w-120px text-end">{t('admin.wallets.balance')}</th>
                            <th className="min-w-80px">{t('common.status')}</th>
                            <th className="min-w-100px">{t('common.createdAt')}</th>
                            <th className="min-w-100px text-end">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {wallets.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="text-center py-10">
                                    <span className="text-muted fs-5">{t('admin.wallets.noWalletsFound')}</span>
                                </td>
                            </tr>
                        ) : (
                            wallets.map((wallet, index) => (
                                <WalletTableRow
                                    key={wallet.id}
                                    wallet={wallet}
                                    rowNumber={(currentPage - 1) * perPage + index + 1}
                                    onSuspend={onSuspend}
                                    onActivate={onActivate}
                                    onDelete={onDelete}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination.total > 0 && (
                <div className="d-flex flex-stack flex-wrap pt-5">
                    <div className="d-flex align-items-center">
                        <select
                            className="form-select form-select-sm form-select-solid w-75px me-3"
                            value={perPage}
                            onChange={(e) => onPerPageChange(Number(e.target.value))}
                        >
                            <option value="10">10</option>
                            <option value="15">15</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                        </select>
                        <span className="text-muted fs-7">
                            {t('common.showingEntries', {
                                from: (currentPage - 1) * perPage + 1,
                                to: Math.min(currentPage * perPage, pagination.total),
                                total: pagination.total,
                            })}
                        </span>
                    </div>
                    <ul className="pagination">
                        <li className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
                            <button type="button" className="page-link" onClick={() => onPageChange(currentPage - 1)}>
                                {t('common.previous')}
                            </button>
                        </li>
                        {generatePageNumbers().map((page) => (
                            <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                                <button type="button" className="page-link" onClick={() => onPageChange(page)}>
                                    {page}
                                </button>
                            </li>
                        ))}
                        <li className={`page-item ${currentPage >= pagination.last_page ? 'disabled' : ''}`}>
                            <button type="button" className="page-link" onClick={() => onPageChange(currentPage + 1)}>
                                {t('common.next')}
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </>
    );
};

export default WalletsTable;
