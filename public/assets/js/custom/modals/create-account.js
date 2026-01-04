// Create Account Class
class CreateAccount {
    constructor() {
        console.log("🔧 CreateAccount constructor started");
        
        this.stepper = document.querySelector("#kt_create_account_stepper");
        console.log("🎯 Stepper element:", this.stepper);
        
        this.form = this.stepper?.querySelector("#kt_create_account_form");
        console.log("📋 Form element:", this.form);
        
        this.submitButton = this.stepper?.querySelector('[data-kt-stepper-action="submit"]');
        console.log("🚀 Submit button:", this.submitButton);
        
        this.nextButton = this.stepper?.querySelector('[data-kt-stepper-action="next"]');
        console.log("➡️ Next button:", this.nextButton);
        
        if (!this.stepper) {
            console.error("❌ Stepper element not found!");
            return;
        }
        
        if (!this.form) {
            console.error("❌ Form element not found!");
            return;
        }
        
        if (!this.submitButton) {
            console.error("❌ Submit button not found!");
            return;
        }
        
        if (!this.nextButton) {
            console.error("❌ Next button not found!");
            return;
        }
        
        console.log("✅ All elements found successfully");
        
        this.stepperObj = new KTStepper(this.stepper);
        console.log("🎠 Stepper object created:", this.stepperObj);
        
        this.validations = [];
        
        this.initStepper();
        this.initValidation();
        this.initButtons();
        
        console.log("🎉 CreateAccount initialization completed");
    }

    initStepper() {
        // Handle stepper change event
        this.stepperObj.on("kt.stepper.changed", (stepper) => {
            const currentStep = stepper.getCurrentStepIndex();
            console.log("Current step:", currentStep);
            
            // Get previous button
            const prevButton = this.stepper.querySelector('[data-kt-stepper-action="previous"]');
            
            // Show submit button on the last step (step 3 - Business Documents)
            if (currentStep === 3) {
                this.submitButton.classList.remove("d-none");
                this.submitButton.classList.add("d-inline-block");
                this.nextButton.classList.add("d-none");
                prevButton?.classList.remove("d-none"); // Show previous button
            } else if (currentStep === 4) {
                // Completion step - hide all navigation buttons
                this.submitButton.classList.add("d-none");
                this.nextButton.classList.add("d-none");
                prevButton?.classList.add("d-none"); // Hide previous button
            } else {
                // Show next button, hide submit button
                this.submitButton.classList.remove("d-inline-block");
                this.submitButton.classList.add("d-none");
                this.nextButton.classList.remove("d-none");
                prevButton?.classList.remove("d-none"); // Show previous button
            }
        });

        // Handle next step
        this.stepperObj.on("kt.stepper.next", (stepper) => {
            console.log("stepper.next");
            
            const currentStep = stepper.getCurrentStepIndex();
            
            // Don't allow going to next step from business documents (step 3)
            // User must submit the form from this step
            if (currentStep === 3) {
                console.log("Cannot proceed from business documents step. Please submit the form.");
                return;
            }
            
            // Don't allow going to next step from business information (step 2) without validation
            if (currentStep === 2) {
                console.log("Validating business information before proceeding...");
                const validation = this.validations[currentStep - 1];
                if (validation) {
                    validation.validate().then((status) => {
                        if (status === "Valid") {
                            stepper.goNext();
                            KTUtil.scrollTop();
                        } else {
                            this.showError();
                        }
                    });
                    return;
                }
            }

            const validation = this.validations[currentStep - 1];
            if (validation) {
                validation.validate().then((status) => {
                    console.log("validated!");
                    if (status == "Valid") {
                        stepper.goNext();
                        KTUtil.scrollTop();
                    } else {
                        this.showError();
                    }
                });
            } else {
                stepper.goNext();
                KTUtil.scrollTop();
            }
        });

        // Handle previous step
        this.stepperObj.on("kt.stepper.previous", (stepper) => {
            console.log("stepper.previous");
            stepper.goPrevious();
            KTUtil.scrollTop();
        });
    }

    initValidation() {
        // Step 1 validation
        this.validations.push(
            FormValidation.formValidation(this.form, {
                fields: {
                    first_name: {
                        validators: {
                            notEmpty: {
                                message: "First name is required"
                            },
                            stringLength: {
                                min: 2,
                                message: "First name must be at least 2 characters long"
                            }
                        }
                    },
                    last_name: {
                        validators: {
                            notEmpty: {
                                message: "Last name is required"
                            },
                            stringLength: {
                                min: 2,
                                message: "Last name must be at least 2 characters long"
                            }
                        }
                    },
                    email: {
                        validators: {
                            notEmpty: {
                                message: "Email is required"
                            },
                            emailAddress: {
                                message: "Please enter a valid email address"
                            }
                        }
                    },
                    phone: {
                        validators: {
                            notEmpty: {
                                message: "Phone number is required"
                            },
                            stringLength: {
                                min: 8,
                                message: "Phone number must be at least 8 characters long"
                            },
                            regexp: {
                                regexp: /^[0-9+\-\s()]+$/,
                                message: "Please enter a valid phone number format"
                            }
                        }
                    }
                },
                plugins: {
                    trigger: new FormValidation.plugins.Trigger(),
                    bootstrap: new FormValidation.plugins.Bootstrap5({
                        rowSelector: ".fv-row",
                        eleInvalidClass: "",
                        eleValidClass: ""
                    })
                }
            })
        );

        // Step 2 validation
        this.validations.push(
            FormValidation.formValidation(this.form, {
                fields: {
                    owner_name: {
                        validators: {
                            notEmpty: {
                                message: "Owner name is required"
                            },
                            stringLength: {
                                min: 2,
                                message: "Owner name must be at least 2 characters long"
                            }
                        }
                    },
                    business_name: {
                        validators: {
                            notEmpty: {
                                message: "Business name is required"
                            },
                            stringLength: {
                                min: 3,
                                message: "Business name must be at least 3 characters long"
                            }
                        }
                    },
                    business_type: {
                        validators: {
                            notEmpty: {
                                message: "Business type is required"
                            }
                        }
                    },
                    business_address: {
                        validators: {
                            notEmpty: {
                                message: "Business address is required"
                            },
                            stringLength: {
                                min: 10,
                                message: "Business address must be at least 10 characters long"
                            }
                        }
                    }
                },
                plugins: {
                    trigger: new FormValidation.plugins.Trigger(),
                    bootstrap: new FormValidation.plugins.Bootstrap5({
                        rowSelector: ".fv-row",
                        eleInvalidClass: "",
                        eleValidClass: ""
                    })
                }
            })
        );

        // Step 3 validation - company attachments
        this.validations.push(
            FormValidation.formValidation(this.form, {
                fields: {
                    company_logo: {
                        validators: {
                            notEmpty: {
                                message: "Company logo is required"
                            },
                            file: {
                                extension: 'jpg,jpeg,png,gif',
                                type: 'image/jpeg,image/png,image/gif',
                                message: 'Please select a valid image file (jpg, jpeg, png, gif)'
                            }
                        }
                    },
                    trade_license: {
                        validators: {
                            notEmpty: {
                                message: "Trade license is required"
                            },
                            file: {
                                extension: 'jpg,jpeg,png,pdf',
                                type: 'image/jpeg,image/png,application/pdf',
                                message: 'Please select a valid file (jpg, jpeg, png, pdf)'
                            }
                        }
                    },
                    tax_certification: {
                        validators: {
                            notEmpty: {
                                message: "Tax certification is required"
                            },
                            file: {
                                extension: 'jpg,jpeg,png,pdf',
                                type: 'image/jpeg,image/png,application/pdf',
                                message: 'Please select a valid file (jpg, jpeg, png, pdf)'
                            }
                        }
                    },
                    user_id_document: {
                        validators: {
                            notEmpty: {
                                message: "ID document is required"
                            },
                            file: {
                                extension: 'jpg,jpeg,png,pdf',
                                type: 'image/jpeg,image/png,application/pdf',
                                message: 'Please select a valid file (jpg, jpeg, png, pdf)'
                            }
                        }
                    }
                },
                plugins: {
                    trigger: new FormValidation.plugins.Trigger(),
                    bootstrap: new FormValidation.plugins.Bootstrap5({
                        rowSelector: ".fv-row",
                        eleInvalidClass: "",
                        eleValidClass: ""
                    })
                }
            })
        );
    }

    initButtons() {
        console.log("🔧 Initializing buttons...");
        
        // Handle submit button - AJAX submission
        this.submitButton.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("🚀 Submit button clicked!");
            
            // Validate all steps before submitting
            let allValid = true;
            let validationPromises = [];
            
            console.log("🔍 Starting validation for all steps...");
            console.log("🔍 Total validations:", this.validations.length);
            
            // Show loading state
            this.submitButton.setAttribute('data-kt-indicator', 'on');
            this.submitButton.disabled = true;
            
            // Validate steps 1 and 2 (Step 3 has no validation)
            for (let i = 0; i < this.validations.length - 1; i++) {
                if (this.validations[i]) {
                    console.log(`🔍 Validating step ${i + 1}...`);
                    validationPromises.push(
                        this.validations[i].validate().then(status => {
                            console.log(`✅ Step ${i + 1} validation result:`, status);
                            if (status !== "Valid") {
                                allValid = false;
                                console.log(`❌ Step ${i + 1} validation failed`);
                            }
                            return status;
                        })
                    );
                } else {
                    console.log(`⏭️ Step ${i + 1} has no validation`);
                }
            }
            
            // Wait for all validations to complete
            Promise.all(validationPromises).then(() => {
                console.log("🎯 All validations completed. All valid:", allValid);
                
                if (!allValid) {
                    console.log("❌ Validation failed, showing error");
                    this.showError();
                    this.submitButton.removeAttribute('data-kt-indicator');
                    this.submitButton.disabled = false;
                    return;
                }
                
                console.log("✅ All validations passed, submitting form via AJAX");
                
                // Get form data
                const formData = new FormData(this.form);
                
                // Send AJAX request
                fetch(this.form.action, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                        'Accept': 'application/json'
                    },
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Show success message
                        Swal.fire({
                            text: "Form has been successfully submitted!",
                            icon: "success",
                            buttonsStyling: false,
                            confirmButtonText: "Ok, got it!",
                            customClass: {
                                confirmButton: "btn btn-primary"
                            }
                        }).then(() => {
                            // Go to success step
                            this.stepperObj.goTo(4); // Move to success step
                        });
                    } else {
                        // Show error message
                        Swal.fire({
                            text: data.message || "Sorry, looks like there are some errors detected, please try again.",
                            icon: "error",
                            buttonsStyling: false,
                            confirmButtonText: "Ok, got it!",
                            customClass: {
                                confirmButton: "btn btn-primary"
                            }
                        });
                        
                        // Show validation errors if any
                        if (data.errors) {
                            Object.keys(data.errors).forEach(field => {
                                const input = this.form.querySelector(`[name="${field}"]`);
                                if (input) {
                                    const errorDiv = document.createElement('div');
                                    errorDiv.className = 'invalid-feedback';
                                    errorDiv.style.display = 'block';
                                    errorDiv.textContent = data.errors[field][0];
                                    input.classList.add('is-invalid');
                                    input.parentNode.appendChild(errorDiv);
                                }
                            });
                        }
                    }
                })
                .catch(error => {
                    // Show error message
                    Swal.fire({
                        text: "Sorry, looks like there are some errors detected, please try again.",
                        icon: "error",
                        buttonsStyling: false,
                        confirmButtonText: "Ok, got it!",
                        customClass: {
                            confirmButton: "btn btn-primary"
                        }
                    });
                })
                .finally(() => {
                    // Reset button state
                    this.submitButton.removeAttribute('data-kt-indicator');
                    this.submitButton.disabled = false;
                });
            });
        });
        
        console.log("✅ Button event listeners attached successfully");
    }

    showFormError(message) {
        // Remove any existing error messages
        const existingError = this.form.querySelector('.form-error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Create error message element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger form-error-message mb-4';
        errorDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Insert error message at the top of the form
        this.form.insertBefore(errorDiv, this.form.firstChild);
        
        // Scroll to top to show the error
        KTUtil.scrollTop();
    }

    showError() {
        Swal.fire({
            text: "Validation errors detected. Please check your information.",
            icon: "error",
            buttonsStyling: false,
            confirmButtonText: "OK, Got it",
            customClass: {
                confirmButton: "btn btn-light"
            }
        }).then(() => {
            KTUtil.scrollTop();
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CreateAccount();
});
