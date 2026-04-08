import React, { useMemo } from 'react';
import useAdminFilterOptions from '../../hooks/useAdminFilterOptions';
import SearchableDropdown from './SearchableDropdown';

const ContentProviderCountryFilterFields = ({
    contentProviderValue,
    countryValue,
    onContentProviderChange,
    onCountryChange,
    contentProviderLabel = 'Content Provider',
    countryLabel = 'Country',
    contentProviderPlaceholder = 'Select content provider',
    countryPlaceholder = 'Select country',
    disableContentProvider = false,
    disableCountry = false,
    requireContentProvider = false,
    requireCountry = false,
    showFlags = true,
    contentProviderHelper,
    countryHelper,
    contentProviderNameResolver,
    countryNameResolver,
    contentProviderWrapperClassName = 'col-md-3',
    countryWrapperClassName = 'col-md-3',
    contentProviderOptionsOverride,
    countryOptionsOverride,
    contentProviderLoadingOverride,
    countryLoadingOverride,
    autoLoadOptions = true,
    onContentProviderOpen,
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

    // Use merchantOptions from the hook (they're actually content providers in the API)
    const contentProvidersList = contentProviderOptionsOverride ?? merchantOptions;
    const countriesList = countryOptionsOverride ?? countryOptions;

    const contentProviderLoading = contentProviderLoadingOverride ?? (hasRequested && loading);
    const countryLoading = countryLoadingOverride ?? (hasRequested && loading);

    const ensureOptionsLoaded = () => {
        if (!hasLoaded) {
            setHasRequested(true);
            loadReferenceData();
        } else {
            setHasRequested(true);
        }
    };

    const handleContentProviderOpen = () => {
        if (!autoLoadOptions) {
            ensureOptionsLoaded();
        }
        onContentProviderOpen?.();
    };

    const handleCountryOpen = () => {
        if (!autoLoadOptions) {
            ensureOptionsLoaded();
        }
        onCountryOpen?.();
    };

    const selectedContentProviderOption = useMemo(
        () => {
            if (!contentProviderValue) return null;

            const normalizedValue = String(contentProviderValue);

            let option = contentProvidersList.find((entry) => String(entry.value) === normalizedValue) || null;

            if (!option) {
                option = getMerchantOption(contentProviderValue);
            }

            if (option) {
                return option;
            }

            if (contentProviderNameResolver) {
                return {
                    value: normalizedValue,
                    label: contentProviderNameResolver(contentProviderValue),
                };
            }

            return null;
        },
        [contentProviderNameResolver, contentProviderValue, contentProvidersList, getMerchantOption]
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
            <div className={contentProviderWrapperClassName}>
                <SearchableDropdown
                    label={contentProviderLabel}
                    placeholder={contentProviderPlaceholder}
                    options={contentProvidersList}
                    selected={selectedContentProviderOption}
                    onSelect={(option) => onContentProviderChange?.(option?.id ?? option?.value)}
                    onClear={() => onContentProviderChange?.('')}
                    required={requireContentProvider}
                    disabled={disableContentProvider}
                    loading={contentProviderLoading}
                    searchPlaceholder="Search content providers..."
                    helperText={contentProviderHelper}
                    onOpen={handleContentProviderOpen}
                    showClear={!requireContentProvider}
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

export default ContentProviderCountryFilterFields;

