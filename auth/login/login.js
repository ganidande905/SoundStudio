document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.querySelector('.submit-btn'),
        password = document.querySelector('#user-password'),
        email = document.querySelector('#mail'),
        errorDisplayers = document.getElementsByClassName('error'),
        inputFields = document.querySelectorAll('input'),
        cardContainer = document.querySelector('.card-container'),
        outroOverlay = document.querySelector('.outro-overlay');

    // Validation Function
    function validateField(input, errorDisplay, validationFn, errorMessage) {
        if (validationFn(input.value.trim())) {
            errorDisplay.textContent = '';
            return true;
        } else {
            errorDisplay.textContent = errorMessage;
            return false;
        }
    }

    // Field Validation on Keyup
    email.addEventListener('keyup', () => {
        validateField(
            email,
            errorDisplayers[0],
            (value) => value.includes('@') && value.includes('.com'),
            '*Please provide a valid email'
        );
    });

    password.addEventListener('keyup', () => {
        validateField(
            password,
            errorDisplayers[1],
            (value) => value.length >= 8,
            'Password requires a minimum of 8 characters'
        );
    });

    // Form Submission Logic
    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const isEmailValid = validateField(
            email,
            errorDisplayers[0],
            (value) => value.includes('@') && value.includes('.com'),
            '*Please provide a valid email'
        );

        const isPasswordValid = validateField(
            password,
            errorDisplayers[1],
            (value) => value.length >= 8,
            'Password requires a minimum of 8 characters'
        );

        // Proceed if all fields are valid
        if (isEmailValid && isPasswordValid) {
            try {
                // Backend API Call for Login
                const response = await fetch('http://localhost:5000/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: email.value.trim(),
                        password: password.value.trim(),
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    // Show Outro Overlay and Redirect
                    cardContainer.style.display = 'none';
                    outroOverlay.classList.remove('disabled');
                    setTimeout(() => {
                        window.location.href = 'dashboard';
                    }, 1000);
                } else {
                    alert(data.message || 'Invalid login credentials');
                }
            } catch (error) {
                console.error('Error logging in:', error);
                alert('Something went wrong. Please try again later.');
            }
        } else {
            alert('Please correct the highlighted fields');
        }
    });

    // Smooth Redirection for Signup
    const signupLink = document.getElementById('signup-link');
    if (signupLink) {
        signupLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.add('fade-out');
            setTimeout(() => {
                window.location.href = signupLink.href;
            }, 500);
        });
    }
});
