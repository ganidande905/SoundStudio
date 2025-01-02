document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.querySelector('.submit-btn'),
        phone = document.querySelector('#phone'),
        password = document.querySelector('#user-password'),
        passwordConfirm = document.querySelector('#user-password-confirm'),
        email = document.querySelector('#mail'),
        address = document.querySelector('#address'),
        errorDisplayers = document.getElementsByClassName('error'),
        inputFields = document.querySelectorAll('input'),
        cardContainer = document.querySelector('.card-container'),
        outroOverlay = document.querySelector('.outro-overlay');

    // Validation Flags
    let validationStatus = Array(inputFields.length).fill(false);

    // Validation Function
    function onValidation(index, messageString, isValid) {
        const message = errorDisplayers[index];
        message.textContent = messageString;
        validationStatus[index] = isValid;
    }

    // Field Validation on Keyup and Blur
    inputFields.forEach((field, i) => {
        field.addEventListener('keyup', () => validateField(field, i));
        field.addEventListener('blur', () => validateField(field, i));
    });

    function validateField(field, i) {
        if (field.value.trim() !== '') {
            onValidation(i, '', true);
        } else {
            onValidation(i, '*This field is required', false);
        }
    }

    // Phone Number Validation
    phone.addEventListener('keyup', () => {
        const index = 3; // Ensure correct index for phone error
        const isValidPhone = /^\d{10}$/.test(phone.value.trim()); // Validate exactly 10 digits
        if (isValidPhone) {
            onValidation(index, '', true);
        } else {
            onValidation(index, '*Phone number must be exactly 10 digits', false);
        }
    });

    // Email Validation
    email.addEventListener('keyup', () => {
        const index = 2;
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
        if (isValidEmail) {
            onValidation(index, '', true);
        } else {
            onValidation(index, '*Please provide a valid email', false);
        }
    });

    // Password Validation
    password.addEventListener('keyup', () => {
        const index = 5;
        if (password.value.length >= 8) {
            onValidation(index, '', true);
        } else {
            onValidation(index, 'Password must have at least 8 characters', false);
        }
    });

    // Confirm Password Validation
    passwordConfirm.addEventListener('keyup', () => {
        const index = 6;
        if (password.value === passwordConfirm.value) {
            onValidation(index, '', true);
        } else {
            onValidation(index, '*Passwords do not match', false);
        }
    });

    // Address Validation
    address.addEventListener('keyup', () => {
        const index = 4; // Ensure correct index for address error
        if (address.value.trim() !== '') {
            onValidation(index, '', true);
        } else {
            onValidation(index, '*Address is required', false);
        }
    });

    // Form Submission
    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        // Check if all fields are valid
        if (validationStatus.every((status) => status)) {
            try {
                // Disable the button during submission
                submitBtn.disabled = true;

                const response = await fetch('http://localhost:5000/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        first_name: document.querySelector('#f-name').value.trim(),
                        last_name: document.querySelector('#l-name').value.trim(),
                        email: email.value.trim(),
                        phone: phone.value.trim(),
                        address: address.value.trim(),
                        password: password.value.trim(),
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    // Show Outro Overlay and Redirect
                    cardContainer.style.display = 'none';
                    outroOverlay.classList.remove('disabled');
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 1000);
                } else {
                    alert(data.message || 'Error during signup');
                }
            } catch (error) {
                console.error('Error during signup:', error);
                alert('Something went wrong. Please try again later.');
            } finally {
                submitBtn.disabled = false; // Re-enable the button
            }
        } else {
            // Highlight invalid fields
            inputFields.forEach((field, i) => {
                if (field.value.trim() === '') {
                    onValidation(i, '*This field is required', false);
                }
            });
            alert('Please correct the highlighted fields');
        }
    });

    // Smooth Redirection for Login
    const loginLink = document.getElementById('login-link');
    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.add('fade-out');
            setTimeout(() => {
                window.location.href = loginLink.href;
            }, 500);
        });
    }
});
