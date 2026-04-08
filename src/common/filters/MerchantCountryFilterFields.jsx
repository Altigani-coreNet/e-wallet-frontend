import React, { useMemo } from 'react';
import useAdminFilterOptions from '../../hooks/useAdminFilterOptions';
import SearchableDropdown from './SearchableDropdown';

const MerchantCountryFilterFields = ({
    merchantValue,
    countryValue,
    onMerchantChange,
    onCountryChange,
    merchantLabel = 'Merchant',
    countryLabel = 'Country',
    merchantPlaceholder = 'Select merchant',
    countryPlaceholder = 'Select country',
    disableMerchant = false,
    disableCountry = false,
    requireMerchant = false,
    requireCountry = false,
    showFlags = true,
    merchantHelper,
    countryHelper,
    merchantNameResolver,
    countryNameResolver,
    merchantWrapperClassName = 'col-md-3',
    countryWrapperClassName = 'col-md-3',
    merchantOptionsOverride,
    countryOptionsOverride,
    merchantLoadingOverride,
    countryLoadingOverride,
    autoLoadOptions = true,
    onMerchantOpen,
    onCountryOpen,
}) => {
    const [hasRequested, setHasRequested] = React.useState(autoLoadOptions);

    const {
        merchantOptions,
        countryOptions,
        loading,
        loadReferenceData,
        hasLoaded,
        resolveCountryName,
        getCountryOption,
        getMerchantOption,
    } = useAdminFilterOptions({ autoLoad: autoLoadOptions });

    const merchantsList = merchantOptionsOverride ?? merchantOptions;
    const countriesList = countryOptionsOverride ?? countryOptions;

    const merchantLoading = merchantLoadingOverride ?? (hasRequested && loading);
    const countryLoading = countryLoadingOverride ?? (hasRequested && loading);

    const ensureOptionsLoaded = () => {
        if (!hasLoaded) {
            setHasRequested(true);
            loadReferenceData();
        } else {
            setHasRequested(true);
        }
    };

    const handleMerchantOpen = () => {
        if (!autoLoadOptions) {
            ensureOptionsLoaded();
        }
        onMerchantOpen?.();
    };

    const handleCountryOpen = () => {
        if (!autoLoadOptions) {
            ensureOptionsLoaded();
        }
        onCountryOpen?.();
    };

    const selectedMerchantOption = useMemo(
        () => {
            if (!merchantValue) return null;

            const normalizedValue = String(merchantValue);

            let option = merchantsList.find((entry) => String(entry.value) === normalizedValue) || null;

            if (!option) {
                option = getMerchantOption(merchantValue);
            }

            if (option) {
                return option;
            }

            if (merchantNameResolver) {
                return {
                    value: normalizedValue,
                    label: merchantNameResolver(merchantValue),
                };
            }

            return null;
        },
        [merchantNameResolver, merchantValue, merchantsList, getMerchantOption]
    );

    const selectedCountryOption = useMemo(
        () => {
            if (!countryValue) return null;

            const normalizedValue = String(countryValue);

            let option = countriesList.find((entry) => String(entry.value) === normalizedValue) || null;

            if (!option) {
                option = getCountryOption(countryValue);
            }

            if (option) {
                return option;
            }

            if (countryNameResolver) {
                return {
                    value: normalizedValue,
                    label: countryNameResolver(countryValue),
                };
            }

            return null;
        },
        [countryNameResolver, countryValue, countriesList, getCountryOption]
    );

    const renderCountrySelected = (option) => {
        if (!showFlags) {
            return <span className="text-gray-800">{option.label}</span>;
        }

        const code = option?.raw?.code || option?.code;
        const description = option.label || resolveCountryName(option.value);
        return (
            <div className="d-flex align-items-center">
                {code && (
                    <img
                        src={`/flags/${String(code).toLowerCase() || 'placeholder'}.png`}
                        alt={description}
                        className="me-3"
                        style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                        onError={(event) => { event.target.style.display = 'none'; }}
                    />
                )}
                <span className="text-gray-800">{description}</span>
            </div>
        );
    };

    const renderCountryOption = (option) => {
        if (!showFlags) {
            return <div className="text-gray-800">{option.label}</div>;
        }

        const code = option?.raw?.code || option?.code;
        return (
            <div className="d-flex align-items-center">
                {code && (
                    <img
                        src={`/flags/${String(code).toLowerCase() || 'placeholder'}.png`}
                        alt={option.label}
                        className="me-3"
                        style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                        onError={(event) => { event.target.style.display = 'none'; }}
                    />
                )}
                <div className="text-gray-800">{option.label}</div>
            </div>
        );
    };

    return (
        <>
            <div className={merchantWrapperClassName}>
                <SearchableDropdown
                    label={merchantLabel}
                    placeholder={merchantPlaceholder}
                    options={merchantsList}
                    selected={selectedMerchantOption}
                    onSelect={(option) => onMerchantChange?.(option?.id ?? option?.value)}
                    onClear={() => onMerchantChange?.('')}
                    required={requireMerchant}
                    disabled={disableMerchant}
                    loading={merchantLoading}
                    searchPlaceholder="Search merchants..."
                    helperText={merchantHelper}
                    onOpen={handleMerchantOpen}
                    showClear={!requireMerchant}
                />
            </div>
            <div className={countryWrapperClassName}>
                <SearchableDropdown
                    label={countryLabel}
                    placeholder={countryPlaceholder}
                    options={countriesList}
                    selected={selectedCountryOption}
                    onSelect={(option) => onCountryChange?.(option?.id ?? option?.value)}
                    onClear={() => onCountryChange?.('')}
                    required={requireCountry}
                    disabled={disableCountry}
                    loading={countryLoading}
                    searchPlaceholder="Search countries..."
                    helperText={countryHelper}
                    onOpen={handleCountryOpen}
                    renderOption={renderCountryOption}
                    renderSelected={renderCountrySelected}
                    showClear={!requireCountry}
                />
            </div>
        </>
    );
};

export default MerchantCountryFilterFields;

