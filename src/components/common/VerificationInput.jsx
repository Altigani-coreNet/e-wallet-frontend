import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

const VerificationInput = forwardRef(({ length = 6, onComplete }, ref) => {
    const [code, setCode] = React.useState(new Array(length).fill(''));
    const inputs = useRef([]);

    // Expose reset function to parent
    useImperativeHandle(ref, () => ({
        resetInputs: () => {
            setCode(new Array(length).fill(''));
            // Clear all input values
            inputs.current.forEach(input => {
                if (input) {
                    input.value = '';
                }
            });
            // Focus first input
            if (inputs.current[0]) {
                inputs.current[0].focus();
            }
        }
    }));

    useEffect(() => {
        // Focus first input on mount
        if (inputs.current[0]) {
            inputs.current[0].focus();
        }
    }, []);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return;

        const newCode = [...code];
        newCode[index] = element.value;
        setCode(newCode);

        // Move to next input if value is entered
        if (element.value && index < length - 1) {
            inputs.current[index + 1].focus();
        }

        // Submit if all fields are filled
        const joinedCode = newCode.join('');
        if (joinedCode.length === length) {
            onComplete(joinedCode);
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace') {
            const newCode = [...code];
            newCode[index] = '';
            setCode(newCode);

            // Move to previous input on backspace
            if (index > 0) {
                inputs.current[index - 1].focus();
            }
            e.preventDefault();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        
        if (/^\d+$/.test(pastedText)) {
            const digits = pastedText.split('').slice(0, length);
            const newCode = [...code];
            
            digits.forEach((digit, i) => {
                if (i < length) {
                    newCode[i] = digit;
                    if (inputs.current[i]) {
                        inputs.current[i].value = digit;
                    }
                }
            });
            
            setCode(newCode);

            // Focus next empty input or last input
            const nextEmptyIndex = digits.length < length ? digits.length : length - 1;
            if (inputs.current[nextEmptyIndex]) {
                inputs.current[nextEmptyIndex].focus();
            }

            // Submit if all fields are filled
            if (digits.length >= length) {
                onComplete(newCode.join(''));
            }
        }
    };

    return (
        <div className="w-100 mx-auto" style={{ overflow: 'hidden' }}>
            <div
                className="d-flex flex-nowrap justify-content-center opt_container verification-otp-ltr"
                dir="ltr"
            >
                {code.map((digit, idx) => (
                    <input
                        key={idx}
                        type="tel"
                        pattern="\d*"
                        maxLength="1"
                        ref={el => inputs.current[idx] = el}
                        value={digit}
                        className="form-control form-control-solid text-center border-primary border-hover mx-1"
                        style={{
                            width:      'clamp(42px, 10vw, 52px)',
                            height:     'clamp(42px, 10vw, 52px)',
                            fontSize:   'clamp(17px, 3.8vw, 21px)',
                            fontWeight: '700',
                            padding:    0,
                            flexShrink: 0,
                            boxSizing:  'border-box',
                        }}
                        onChange={e => handleChange(e.target, idx)}
                        onKeyDown={e => handleKeyDown(e, idx)}
                        onPaste={handlePaste}
                        inputMode="numeric"
                        dir="ltr"
                        autoComplete="one-time-code"
                    />
                ))}
            </div>
        </div>
    );
});

export default VerificationInput;

