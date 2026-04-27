import React, { useState } from 'react';

const ProfileHeader = ({ user, merchant, profileCompletion, merchantCompletion, activeTab, onTabChange }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        const classes = {
            'pending': 'badge-light-warning',
            'approved': 'badge-light-success',
            'rejected': 'badge-light-danger',
            'suspended': 'badge-light-danger',
            'viewed': 'badge-light-info',
            'requesting_updated': 'badge-light-warning',
        };
        return classes[status] || 'badge-light-warning';
    };

    // Get status label
    const getStatusLabel = (status) => {
        const labels = {
            'pending': 'Pending',
            'approved': 'Approved',
            'rejected': 'Rejected',
            'suspended': 'Suspended',
            'viewed': 'Viewed',
            'requesting_updated': 'Requesting Updated',
        };
        return labels[status] || status;
    };

    return (
        <div className="card mb-5 mb-xl-10">
            <div className="card-body pt-9 pb-0">
                {/* Details */}
                <div className="d-flex flex-wrap flex-sm-nowrap mb-3">
                    {/* Pic */}
                    <div className="me-7 mb-4">
                        <div className="symbol symbol-100px symbol-lg-160px symbol-fixed position-relative">
                            {user?.profile_image || merchant?.logo_url ? (
                                <img src={user?.profile_image || merchant?.logo_url} alt="User Logo" className="rounded" />
                            ) : (
                                <div className="symbol-label fs-3 bg-light-primary text-primary">
                                    {user?.user_name
                                        ? user.user_name.substring(0, 2).toUpperCase()
                                        : 'NA'}
                                </div>
                            )}
                            <div className="position-absolute translate-middle bottom-0 start-100 mb-6 bg-success rounded-circle border border-4 border-white h-20px w-20px"></div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-grow-1">
                        {/* Title */}
                        <div className="d-flex justify-content-between align-items-start flex-wrap mb-2">
                            {/* User */}
                            <div className="d-flex flex-column">
                                {/* Name */}
                                <div className="d-flex align-items-center mb-2">
                                    <a href="#" className="text-gray-900 text-hover-primary fs-2 fw-bolder me-1">
                                        {user?.user_name || 'N/A'}
                                    </a>
                                    <a href="#">
                                        <span className="svg-icon svg-icon-1 svg-icon-primary">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24">
                                                <path d="M10.0813 3.7242C10.8849 2.16438 13.1151 2.16438 13.9187 3.7242V3.7242C14.4016 4.66147 15.4909 5.1127 16.4951 4.79139V4.79139C18.1663 4.25668 19.7433 5.83365 19.2086 7.50485V7.50485C18.8873 8.50905 19.3385 9.59842 20.2758 10.0813V10.0813C21.8356 10.8849 21.8356 13.1151 20.2758 13.9187V13.9187C19.3385 14.4016 18.8873 15.491 19.2086 16.4951V16.4951C19.7433 18.1663 18.1663 19.7433 16.4951 19.2086V19.2086C15.491 18.8873 14.4016 19.3385 13.9187 20.2758V20.2758C13.1151 21.8356 10.8849 21.8356 10.0813 20.2758V20.2758C9.59842 19.3385 8.50905 18.8873 7.50485 19.2086V19.2086C5.83365 19.7433 4.25668 18.1663 4.79139 16.4951V16.4951C5.1127 15.491 4.66147 14.4016 3.7242 13.9187V13.9187C2.16438 13.1151 2.16438 10.8849 3.7242 10.0813V10.0813C4.66147 9.59842 5.1127 8.50905 4.79139 7.50485V7.50485C4.25668 5.83365 5.83365 4.25668 7.50485 4.79139V4.79139C8.50905 5.1127 9.59842 4.66147 10.0813 3.7242V3.7242Z" fill="#00A3FF" />
                                                <path className="permanent" d="M14.8563 9.1903C15.0606 8.94984 15.3771 8.9385 15.6175 9.14289C15.858 9.34728 15.8229 9.66433 15.6185 9.9048L11.863 14.6558C11.6554 14.9001 11.2876 14.9258 11.048 14.7128L8.47656 12.4271C8.24068 12.2174 8.21944 11.8563 8.42911 11.6204C8.63877 11.3845 8.99996 11.3633 9.23583 11.5729L11.3706 13.4705L14.8563 9.1903Z" fill="white" />
                                            </svg>
                                        </span>
                                    </a>
                                </div>

                                {/* Info */}
                                <div className="d-flex flex-wrap fw-bold fs-6 mb-4 pe-2">
                                    {user?.address && (
                                        <a href="#" className="d-flex align-items-center text-gray-400 text-hover-primary me-5 mb-2">
                                            <span className="svg-icon svg-icon-4 me-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                    <path opacity="0.3" d="M18.0624 15.3453L13.1624 20.7453C12.5624 21.4453 11.5624 21.4453 10.9624 20.7453L6.06242 15.3453C4.56242 13.6453 3.76242 11.4453 4.06242 8.94534C4.56242 5.34534 7.46242 2.44534 11.0624 2.04534C15.8624 1.54534 19.9624 5.24534 19.9624 9.94534C20.0624 12.0453 19.2624 13.9453 18.0624 15.3453Z" fill="black" />
                                                    <path d="M12.0624 13.0453C13.7193 13.0453 15.0624 11.7022 15.0624 10.0453C15.0624 8.38849 13.7193 7.04535 12.0624 7.04535C10.4056 7.04535 9.06241 8.38849 9.06241 10.0453C9.06241 11.7022 10.4056 13.0453 12.0624 13.0453Z" fill="black" />
                                                </svg>
                                            </span>
                                            {user.address}
                                        </a>
                                    )}

                                    <a href="#" className="d-flex align-items-center text-gray-400 text-hover-primary mb-2">
                                        <span className="svg-icon svg-icon-4 me-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                <path opacity="0.3" d="M21 19H3C2.4 19 2 18.6 2 18V6C2 5.4 2.4 5 3 5H21C21.6 5 22 5.4 22 6V18C22 18.6 21.6 19 21 19Z" fill="black" />
                                                <path d="M21 5H2.99999C2.69999 5 2.49999 5.10005 2.29999 5.30005L11.2 13.3C11.7 13.7 12.4 13.7 12.8 13.3L21.7 5.30005C21.5 5.10005 21.3 5 21 5Z" fill="black" />
                                            </svg>
                                        </span>
                                        {user?.email || 'N/A'}
                                    </a>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="d-flex my-4">
                                <div className="me-0">
                                    <button className="btn btn-sm btn-icon btn-bg-light btn-active-color-primary" data-kt-menu-trigger="click" data-kt-menu-placement="bottom-end">
                                        <i className="bi bi-three-dots fs-3"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="d-flex flex-wrap flex-stack">
                            {/* Wrapper */}
                            <div className="d-flex flex-column flex-grow-1 pe-8">
                                {/* Stats */}
                                <div className="d-flex flex-wrap">
                                    {/* Stat - Branches */}
                                    <div className="border border-gray-300 border-dashed rounded min-w-100px py-3 px-4 me-6 mb-3">
                                        <div className="d-flex align-items-center">
                                            <span className="svg-icon svg-icon-success svg-icon-2x">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                    <path opacity="0.3" d="M20 15H4C2.9 15 2 14.1 2 13V7C2 6.4 2.4 6 3 6H21C21.6 6 22 6.4 22 7V13C22 14.1 21.1 15 20 15ZM13 12H11C10.5 12 10 12.4 10 13V16C10 16.5 10.4 17 11 17H13C13.6 17 14 16.6 14 16V13C14 12.4 13.6 12 13 12Z" fill="black" />
                                                    <path d="M14 6V5H10V6H8V5C8 3.9 8.9 3 10 3H14C15.1 3 16 3.9 16 5V6H14ZM20 15H14V16C14 16.6 13.5 17 13 17H11C10.5 17 10 16.6 10 16V15H4C3.6 15 3.3 14.9 3 14.7V18C3 19.1 3.9 20 5 20H19C20.1 20 21 19.1 21 18V14.7C20.7 14.9 20.4 15 20 15Z" fill="black" />
                                                </svg>
                                            </span>
                                            <div className="fs-2 fw-bolder counted">
                                                {merchantCompletion?.branches_count || merchant?.branches_count || 0}
                                            </div>
                                        </div>
                                        <div className="fw-bold fs-6 text-gray-400">Branches</div>
                                    </div>

                                    {/* Stat - Terminals */}
                                    <div className="border border-gray-300 border-dashed rounded min-w-100px py-3 px-4 me-6 mb-3">
                                        <div className="d-flex align-items-center">
                                            <span className="svg-icon svg-icon-primary svg-icon-2x">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24">
                                                    <path d="M8,3 L8,3.5 C8,4.32842712 8.67157288,5 9.5,5 L14.5,5 C15.3284271,5 16,4.32842712 16,3.5 L16,3 L18,3 C19.1045695,3 20,3.8954305 20,5 L20,21 C20,22.1045695 19.1045695,23 18,23 L6,23 C4.8954305,23 4,22.1045695 4,21 L4,5 C4,3.8954305 4.8954305,3 6,3 L8,3 Z" fill="#000000" opacity="0.3" />
                                                    <path d="M11,2 C11,1.44771525 11.4477153,1 12,1 C12.5522847,1 13,1.44771525 13,2 L14.5,2 C14.7761424,2 15,2.22385763 15,2.5 L15,3.5 C15,3.77614237 14.7761424,4 14.5,4 L9.5,4 C9.22385763,4 9,3.77614237 9,3.5 L9,2.5 C9,2.22385763 9.22385763,2 9.5,2 L11,2 Z" fill="#000000" />
                                                    <rect fill="#000000" opacity="0.3" x="7" y="10" width="5" height="2" rx="1" />
                                                    <rect fill="#000000" opacity="0.3" x="7" y="14" width="9" height="2" rx="1" />
                                                </svg>
                                            </span>
                                            <div className="fs-2 fw-bolder counted">
                                                {merchantCompletion?.terminals_count || 0}
                                            </div>
                                        </div>
                                        <div className="fw-bold fs-6 text-gray-400">Terminals</div>
                                    </div>

                                    {/* Stat - Users */}
                                    <div className="border border-gray-300 border-dashed rounded min-w-100px py-3 px-4 me-6 mb-3">
                                        <div className="d-flex align-items-center">
                                            <span className="svg-icon svg-icon-dark svg-icon-2x mx-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none">
                                                    <path opacity="0.3" d="M20.5543 4.37824L12.1798 2.02473C12.0626 1.99176 11.9376 1.99176 11.8203 2.02473L3.44572 4.37824C3.18118 4.45258 3 4.6807 3 4.93945V13.569C3 14.6914 3.48509 15.8404 4.4417 16.984C5.17231 17.8575 6.18314 18.7345 7.446 19.5909C9.56752 21.0295 11.6566 21.912 11.7445 21.9488C11.8258 21.9829 11.9129 22 12.0001 22C12.0872 22 12.1744 21.983 12.2557 21.9488C12.3435 21.912 14.4326 21.0295 16.5541 19.5909C17.8169 18.7345 18.8277 17.8575 19.5584 16.984C20.515 15.8404 21 14.6914 21 13.569V4.93945C21 4.6807 20.8189 4.45258 20.5543 4.37824Z" fill="currentColor"/>
                                                    <path d="M10.5606 11.3042L9.57283 10.3018C9.28174 10.0065 8.80522 10.0065 8.51412 10.3018C8.22897 10.5912 8.22897 11.0559 8.51412 11.3452L10.4182 13.2773C10.8099 13.6747 11.451 13.6747 11.8427 13.2773L15.4859 9.58051C15.771 9.29117 15.771 8.82648 15.4859 8.53714C15.1948 8.24176 14.7183 8.24176 14.4272 8.53714L11.7002 11.3042C11.3869 11.6221 10.874 11.6221 10.5606 11.3042Z" fill="currentColor"/>
                                                </svg>
                                            </span>
                                            <div className="fs-2 fw-bolder counted">
                                                {merchantCompletion?.users_count || 1}
                                            </div>
                                        </div>
                                        <div className="fw-bold fs-6 text-gray-400">Users</div>
                                    </div>

                                    {/* Stat - Transactions */}
                                    <div className="border border-gray-300 border-dashed rounded min-w-100px py-3 px-4 me-6 mb-3">
                                        <div className="d-flex align-items-center">
                                            <span className="svg-icon svg-icon-danger svg-icon-2x">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none">
                                                    <path opacity="0.3" d="M21 19H3C2.4 19 2 18.6 2 18V6C2 5.4 2.4 5 3 5H21C21.6 5 22 5.4 22 6V18C22 18.6 21.6 19 21 19Z" fill="currentColor"/>
                                                    <path d="M21 5H2.99999C2.69999 5 2.49999 5.10005 2.29999 5.30005L11.2 13.3C11.7 13.7 12.4 13.7 12.8 13.3L21.7 5.30005C21.5 5.10005 21.3 5 21 5Z" fill="currentColor"/>
                                                    <path d="M14 14.5C13.7 14.3 13.5 14 13.5 13.7C13.5 13.3 13.8 13 14.2 13H16.8C17.2 13 17.5 13.3 17.5 13.7C17.5 14 17.3 14.3 17 14.5L14 16.5V14.5Z" fill="currentColor"/>
                                                    <path d="M10 14.5C10.3 14.3 10.5 14 10.5 13.7C10.5 13.3 10.2 13 9.8 13H7.2C6.8 13 6.5 13.3 6.5 13.7C6.5 14 6.7 14.3 7 14.5L10 16.5V14.5Z" fill="currentColor"/>
                                                </svg>
                                            </span>
                                            <div className="fs-2 fw-bolder counted">
                                                {merchant?.transactions_count || 0}
                                            </div>
                                        </div>
                                        <div className="fw-bold fs-6 text-gray-400">Transactions</div>
                                    </div>
                                </div>
                            </div>

                            {/* Progress */}
                            <div className="d-flex align-items-center w-200px w-sm-300px flex-column mt-3">
                                <div 
                                    className="d-flex justify-content-between w-100 mt-auto mb-2" 
                                    onMouseEnter={() => setShowTooltip(true)}
                                    onMouseLeave={() => setShowTooltip(false)}
                                    style={{ cursor: 'pointer', position: 'relative' }}
                                >
                                    <span className="fw-bold fs-6 text-gray-400">Profile Completion</span>
                                    <span className="fw-bolder fs-6">{merchantCompletion?.completion || 0}%</span>
                                    
                                    {/* Tooltip */}
                                    {showTooltip && merchantCompletion?.missing && merchantCompletion.missing.length > 0 && (
                                        <div 
                                            className="tooltip bs-tooltip-top show" 
                                            style={{ 
                                                position: 'absolute', 
                                                top: '-120px', 
                                                left: '50%', 
                                                transform: 'translateX(-50%)',
                                                zIndex: 1080
                                            }}
                                        >
                                            <div className="tooltip-arrow" style={{ left: '50%' }}></div>
                                            <div className="tooltip-inner bg-dark text-start" style={{ maxWidth: '300px' }}>
                                                <p className="fw-bold mb-2">Complete Your Profile</p>
                                                {merchantCompletion.missing.map((message, index) => (
                                                    <div key={index} className="d-flex align-items-center mb-2">
                                                        <span className="bullet bullet-dot bg-danger me-2"></span>
                                                        <span>{message}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="h-5px mx-3 w-100 bg-light mb-3">
                                    <div 
                                        className="bg-success rounded h-5px" 
                                        role="progressbar" 
                                        style={{ width: `${merchantCompletion?.completion || 0}%` }}
                                        aria-valuenow={merchantCompletion?.completion || 0}
                                        aria-valuemin="0" 
                                        aria-valuemax="100"
                                    ></div>
                                </div>
                                
                                <div className="text-center w-100">
                                    <button 
                                        type="button" 
                                        className={`btn btn-sm ${getStatusBadgeClass(merchant?.status || 'pending')} px-9 py-4`}
                                    >
                                        <span className="indicator-label">
                                            {getStatusLabel(merchant?.status || 'pending')}
                                        </span>
                                        {(merchant?.status === 'pending' || merchant?.status === 'viewed') && (
                                            <span className="indicator-progress">
                                                <span className="spinner-border spinner-border-sm align-middle ms-2"></span>
                                            </span>
                                        )}
                                    </button>
                                    
                                    {merchant?.status === 'rejected' && merchant?.rejection_reason && (
                                        <div className="mt-2">
                                            <span className="text-danger fs-8" title={merchant.rejection_reason}>
                                                <i className="bi bi-info-circle me-1"></i>
                                                {merchant.rejection_reason.length > 30 
                                                    ? merchant.rejection_reason.substring(0, 30) + '...' 
                                                    : merchant.rejection_reason}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navs */}
                <ul className="nav nav-stretch nav-line-tabs nav-line-tabs-2x border-nav-line-tabs mb-5 fs-6">
                    <li className="nav-item mt-2">
                        <a 
                            className={`nav-link text-active-primary ms-0 me-10 py-5 ${activeTab === 'overview' ? 'active' : ''}`}
                            href="#"
                            onClick={(e) => { e.preventDefault(); onTabChange('overview'); }}
                        >
                            Merchant Profile
                        </a>
                    </li>
                    <li className="nav-item mt-2">
                        <a 
                            className={`nav-link text-active-primary ms-0 me-10 py-5 ${activeTab === 'info' ? 'active' : ''}`}
                            href="#"
                            onClick={(e) => { e.preventDefault(); onTabChange('info'); }}
                        >
                            User Info
                        </a>
                    </li>
                    <li className="nav-item mt-2">
                        <a 
                            className={`nav-link text-active-primary ms-0 me-10 py-5 ${activeTab === 'events' ? 'active' : ''}`}
                            href="#"
                            onClick={(e) => { e.preventDefault(); onTabChange('events'); }}
                        >
                            Activity Events
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default ProfileHeader;

