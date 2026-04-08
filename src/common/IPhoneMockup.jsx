import React from 'react';
import { IPhoneMockup as DeviceIPhoneMockup } from 'react-device-mockup';

/**
 * Wrapper so the rest of the app can keep using `IPhoneMockup`.
 * Forwards `frameColor` and related props to `react-device-mockup`.
 * `hideNavBar` frees the bottom inset so app footers (Cancel / Process) stay visible inside the screen.
 */
const IPhoneMockup = ({
    screenWidth = 320,
    frameColor = '#000000',
    hideNavBar = true,
    // React Router / UI props that must not reach a DOM node via react-device-mockup
    isActive: _isActive,
    isPending: _isPending,
    isTransitioning: _isTransitioning,
    children,
    ...rest
}) => {
    return (
        <DeviceIPhoneMockup
            screenWidth={screenWidth}
            frameColor={frameColor}
            hideNavBar={hideNavBar}
            {...rest}
        >
            <div
                className="bg-white"
                style={{
                    height: '100%',
                    minHeight: 0,
                    width: '100%',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {children}
            </div>
        </DeviceIPhoneMockup>
    );
};

export default IPhoneMockup;
