import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { PUBLIC_ENDPOINTS, AUTH_ENDPOINTS } from '../../utils/constants';
import useAuthStore from '../../stores/authStore';
import { toast } from 'react-toastify';

const MerchantPlans = () => {
  const { t } = useTranslation();
  const { merchant, fetchProfile } = useAuthStore.getState();
  const currentPlanId = merchant?.plan?.id || merchant?.plan_id || null;
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await axios.get(PUBLIC_ENDPOINTS.PLANS);
        const data = response.data?.data ?? response.data ?? [];
        setPlans(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load plans:', error);
        toast.error(t('merchant.plans.loadFailed'));
      } finally {
        setLoading(false);
      }
    };
    loadPlans();
  }, [t]);

  const handleUpgrade = async (planId) => {
    if (!planId) return;
    setUpgrading(true);
    try {
      await axios.post(
        AUTH_ENDPOINTS.MERCHANT_PLAN_UPGRADE,
        { plan_id: planId },
        { headers: { Authorization: `Bearer ${useAuthStore.getState().token}` } }
      );
      toast.success(t('merchant.plans.upgradeSuccess'));
      await useAuthStore.getState().fetchProfile?.();
    } catch (error) {
      console.error('Upgrade failed:', error);
      const message = error.response?.data?.message || t('merchant.plans.upgradeFailed');
      toast.error(message);
    } finally {
      setUpgrading(false);
    }
  };

  const formatPrice = (price) => Number(price ?? 0).toFixed(2);
  const planTypeLabel = (plan) => {
    const typeValue = typeof plan.plan_type === 'object' && plan.plan_type !== null
      ? plan.plan_type.value
      : plan.plan_type;
    if (!typeValue) return t('merchant.common.monthly');
    const normalized = String(typeValue);
    return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <span className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="text-center mb-10">
        <h3 className="fs-2hx text-dark fw-bold mb-5">{t('merchant.plans.heading')}</h3>
        <div className="fs-5 text-muted fw-semibold">
          {t('merchant.plans.subheading')}
        </div>
      </div>

      <div className="row row-cols-xxl-4 row-cols-lg-3 row-cols-md-2 g-4">
        {plans.map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          return (
            <div className="col" key={plan.id}>
              <div className={`h-100 d-flex flex-column rounded-3 bg-light bg-opacity-75 py-12 px-8 shadow-sm ${isCurrent ? 'border border-primary border-2' : ''}`}>
                <div className="mb-7 text-center">
                  <h1 className="text-gray-900 mb-5 fw-bolder">{plan.name}</h1>
                  <div className="text-gray-600 fw-semibold mb-5">{plan.description}</div>
                  <div className="text-center">
                    <span className="mb-2 text-primary">$</span>
                    <span className="fs-3x fw-bold text-primary">
                      {plan.has_discount && plan.current_price ? formatPrice(plan.current_price) : formatPrice(plan.price)}
                    </span>
                    <div className="fs-7 fw-semibold opacity-50">
                      / {planTypeLabel(plan)}
                    </div>
                  </div>
                </div>

                <div className="w-100 mb-8">
                  {Array.isArray(plan.features) && plan.features.length > 0 ? (
                    plan.features.map((feature) => (
                      <div className="d-flex align-items-center mb-4" key={`${plan.id}-feature-${feature.id || feature.name}`}>
                        <span className={`fw-semibold fs-6 ${feature.is_enabled ? 'text-gray-800' : 'text-gray-600'} flex-grow-1 pe-3`}>
                          {feature.name}
                        </span>
                        {feature.is_enabled ? (
                          <i className="ki-duotone ki-check-circle fs-1 text-success">
                            <span className="path1" />
                            <span className="path2" />
                          </i>
                        ) : (
                          <i className="ki-duotone ki-cross-circle fs-1 text-muted">
                            <span className="path1" />
                            <span className="path2" />
                          </i>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-muted">{t('merchant.plans.noFeatures')}</div>
                  )}
                </div>

                <button
                  type="button"
                  className={`btn btn-sm ${isCurrent ? 'btn-light' : 'btn-primary'} align-self-center mt-auto`}
                  disabled={isCurrent || upgrading}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {isCurrent ? t('merchant.plans.currentPlan') : (upgrading ? t('merchant.plans.upgrading') : t('merchant.plans.upgrade'))}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MerchantPlans;
