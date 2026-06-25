import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getCustomerGroups } from '../../../services/customersService';

const CustomerForm = ({ customer, onSubmit, loading, errors = {} }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company_name: '',
        customer_group_id: '',
        tax_no: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        deposit: '',
        expense: ''
    });

    const [customerGroups, setCustomerGroups] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(false);

    // Load customer data if editing
    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name || '',
                email: customer.email || '',
                phone: customer.phone || customer.phone_number || '',
                company_name: customer.company_name || '',
                customer_group_id: customer.customer_group_id || '',
                tax_no: customer.tax_no || '',
                address: customer.address || '',
                city: customer.city || '',
                state: customer.state || '',
                postal_code: customer.postal_code || customer.zip || '',
                country: customer.country || '',
                deposit: customer.deposit || '',
                expense: customer.expense || ''
            });
        }
    }, [customer]);

    // Fetch customer groups
    useEffect(() => {
        const fetchCustomerGroups = async () => {
            setLoadingGroups(true);
            try {
                const response = await getCustomerGroups();
                if (response.success) {
                    setCustomerGroups(Array.isArray(response.data) ? response.data : []);
                }
            } catch (error) {
                console.error('Error fetching customer groups:', error);
            } finally {
                setLoadingGroups(false);
            }
        };

        fetchCustomerGroups();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="form">
            <div className="card-body">
                <div className="row g-5">
                    {/* Basic Information */}
                    <div className="col-12">
                        <h3 className="mb-5">{t('customers.basicInformation')}</h3>
                    </div>

                    {/* Name - Required */}
                    <div className="col-md-6">
                        <label className="form-label required fw-bold fs-6">{t('customers.customerName')}</label>
                        <input
                            type="text"
                            name="name"
                            className={`form-control form-control-solid ${errors.name ? 'is-invalid' : ''}`}
                            placeholder={t('customers.enterCustomerName')}
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                        {errors.name && (
                            <div className="invalid-feedback d-block">{errors.name[0]}</div>
                        )}
                    </div>

                    {/* Email - Required */}
                    <div className="col-md-6">
                        <label className="form-label required fw-bold fs-6">{t('common.email')}</label>
                        <input
                            type="email"
                            name="email"
                            className={`form-control form-control-solid ${errors.email ? 'is-invalid' : ''}`}
                            placeholder={t('customers.enterEmailAddress')}
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        {errors.email && (
                            <div className="invalid-feedback d-block">{errors.email[0]}</div>
                        )}
                    </div>

                    {/* Phone */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold fs-6">{t('customers.phoneNumber')}</label>
                        <input
                            type="text"
                            name="phone"
                            className={`form-control form-control-solid ${errors.phone ? 'is-invalid' : ''}`}
                            placeholder={t('customers.enterPhoneNumber')}
                            value={formData.phone}
                            onChange={handleChange}
                        />
                        {errors.phone && (
                            <div className="invalid-feedback d-block">{errors.phone[0]}</div>
                        )}
                    </div>

                    {/* Company Name */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold fs-6">{t('customers.companyName')}</label>
                        <input
                            type="text"
                            name="company_name"
                            className={`form-control form-control-solid ${errors.company_name ? 'is-invalid' : ''}`}
                            placeholder={t('customers.enterCompanyName')}
                            value={formData.company_name}
                            onChange={handleChange}
                        />
                        {errors.company_name && (
                            <div className="invalid-feedback d-block">{errors.company_name[0]}</div>
                        )}
                    </div>

                    {/* Customer Group */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold fs-6">{t('customers.customerGroup')}</label>
                        <select
                            name="customer_group_id"
                            className={`form-select form-select-solid ${errors.customer_group_id ? 'is-invalid' : ''}`}
                            value={formData.customer_group_id}
                            onChange={handleChange}
                            disabled={loadingGroups}
                        >
                            <option value="">{t('customers.selectCustomerGroupOptional')}</option>
                            {customerGroups.map((group) => (
                                <option key={group.id} value={group.id}>
                                    {group.name}
                                </option>
                            ))}
                        </select>
                        {errors.customer_group_id && (
                            <div className="invalid-feedback d-block">{errors.customer_group_id[0]}</div>
                        )}
                    </div>

                    {/* Tax Number */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold fs-6">{t('customers.taxNumber')}</label>
                        <input
                            type="text"
                            name="tax_no"
                            className={`form-control form-control-solid ${errors.tax_no ? 'is-invalid' : ''}`}
                            placeholder={t('customers.enterTaxNumber')}
                            value={formData.tax_no}
                            onChange={handleChange}
                        />
                        {errors.tax_no && (
                            <div className="invalid-feedback d-block">{errors.tax_no[0]}</div>
                        )}
                    </div>

                    {/* Address Information */}
                    <div className="col-12">
                        <h3 className="mb-5 mt-5">{t('customers.addressInformation')}</h3>
                    </div>

                    {/* Address */}
                    <div className="col-12">
                        <label className="form-label fw-bold fs-6">{t('customers.streetAddress')}</label>
                        <input
                            type="text"
                            name="address"
                            className={`form-control form-control-solid ${errors.address ? 'is-invalid' : ''}`}
                            placeholder={t('customers.enterStreetAddress')}
                            value={formData.address}
                            onChange={handleChange}
                        />
                        {errors.address && (
                            <div className="invalid-feedback d-block">{errors.address[0]}</div>
                        )}
                    </div>

                    {/* City */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold fs-6">{t('common.city')}</label>
                        <input
                            type="text"
                            name="city"
                            className={`form-control form-control-solid ${errors.city ? 'is-invalid' : ''}`}
                            placeholder={t('customers.enterCity')}
                            value={formData.city}
                            onChange={handleChange}
                        />
                        {errors.city && (
                            <div className="invalid-feedback d-block">{errors.city[0]}</div>
                        )}
                    </div>

                    {/* State */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold fs-6">{t('customers.stateProvince')}</label>
                        <input
                            type="text"
                            name="state"
                            className={`form-control form-control-solid ${errors.state ? 'is-invalid' : ''}`}
                            placeholder={t('customers.enterStateProvince')}
                            value={formData.state}
                            onChange={handleChange}
                        />
                        {errors.state && (
                            <div className="invalid-feedback d-block">{errors.state[0]}</div>
                        )}
                    </div>

                    {/* Postal Code */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold fs-6">{t('common.postalCode')}</label>
                        <input
                            type="text"
                            name="postal_code"
                            className={`form-control form-control-solid ${errors.postal_code ? 'is-invalid' : ''}`}
                            placeholder={t('customers.enterPostalCode')}
                            value={formData.postal_code}
                            onChange={handleChange}
                        />
                        {errors.postal_code && (
                            <div className="invalid-feedback d-block">{errors.postal_code[0]}</div>
                        )}
                    </div>

                    {/* Country */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold fs-6">{t('common.country')}</label>
                        <input
                            type="text"
                            name="country"
                            className={`form-control form-control-solid ${errors.country ? 'is-invalid' : ''}`}
                            placeholder={t('customers.enterCountry')}
                            value={formData.country}
                            onChange={handleChange}
                        />
                        {errors.country && (
                            <div className="invalid-feedback d-block">{errors.country[0]}</div>
                        )}
                    </div>

                    {/* Financial Information */}
                    <div className="col-12">
                        <h3 className="mb-5 mt-5">{t('customers.financialInformation')}</h3>
                    </div>

                    {/* Deposit */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold fs-6">{t('customers.depositAmount')}</label>
                        <input
                            type="number"
                            step="0.01"
                            name="deposit"
                            className={`form-control form-control-solid ${errors.deposit ? 'is-invalid' : ''}`}
                            placeholder="0.00"
                            value={formData.deposit}
                            onChange={handleChange}
                        />
                        {errors.deposit && (
                            <div className="invalid-feedback d-block">{errors.deposit[0]}</div>
                        )}
                    </div>

                    {/* Expense */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold fs-6">{t('customers.expenseAmount')}</label>
                        <input
                            type="number"
                            step="0.01"
                            name="expense"
                            className={`form-control form-control-solid ${errors.expense ? 'is-invalid' : ''}`}
                            placeholder="0.00"
                            value={formData.expense}
                            onChange={handleChange}
                        />
                        {errors.expense && (
                            <div className="invalid-feedback d-block">{errors.expense[0]}</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="card-footer d-flex justify-content-end py-6 px-9">
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm align-middle me-2"></span>
                            {t('customers.saving')}
                        </>
                    ) : (
                        <>
                            <i className="ki-duotone ki-check fs-3 me-1">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            {t('customers.saveCustomer')}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default CustomerForm;

