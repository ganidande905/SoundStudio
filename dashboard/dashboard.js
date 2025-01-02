document.addEventListener('DOMContentLoaded', () => {
    const studioSelect = document.getElementById('studio-select');
    const sessionTableBody = document.querySelector('#session-table tbody');
    const historyTableBody = document.querySelector('#history-table tbody');
    const equipmentSelect = document.getElementById('equipment-select');
    const assignEquipmentButton = document.getElementById('assign-equipment-button');
    const invoiceTableBody = document.querySelector('#invoice-table tbody');
    const invoiceModal = document.getElementById('invoice-modal');
    const invoiceDetails = document.getElementById('invoice-details');
    const closeInvoiceModal = document.getElementById('close-invoice-modal');
    const staffTableBody = document.querySelector('#staff-table tbody');


    // Fetch and Display Staff
    async function fetchStaff() {
        try {
            const response = await fetch('/api/staff');
            const staff = await response.json();

            staffTableBody.innerHTML = '';

            staff.forEach(member => {
                const row = document.createElement('tr');

                row.innerHTML = `
                    <td>${member.staff_id}</td>
                    <td>${member.name}</td>
                    <td>${member.role || 'N/A'}</td>
                    <td>${member.staff_hours || 'N/A'}</td>
                    <td>${member.manager_id || 'N/A'}</td>
                `;

                staffTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    }

    // Fetch staff on page load
    fetchStaff();
    async function fetchInvoices() {
        try {
            const response = await fetch('/api/client/history'); // Reuse client history API to get invoices
            const history = await response.json();

            invoiceTableBody.innerHTML = '';

            history.forEach(item => {
                if (item.invoice_id) {
                    const row = document.createElement('tr');

                    row.innerHTML = `
                        <td>${item.invoice_id}</td>
                        <td>${item.session_id}</td>
                        <td>${item.total_billing}</td>
                        <td>${item.payment_status}</td>
                        <td>
                            <button class="view-invoice-btn" data-id="${item.invoice_id}">View</button>
                        </td>
                    `;

                    invoiceTableBody.appendChild(row);
                }
            });
        } catch (error) {
            console.error('Error fetching invoices:', error);
        }
    }

    // Handle Viewing Invoice Details
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('view-invoice-btn')) {
            const invoiceId = e.target.dataset.id;

            try {
                const response = await fetch(`/api/invoice/${invoiceId}`);
                const invoice = await response.json();

                if (response.ok) {
                    invoiceDetails.textContent = `
                        Invoice ID: ${invoice.invoice_id}, 
                        Session ID: ${invoice.session_id}, 
                        Amount: ${invoice.amount}, 
                        Payment Status: ${invoice.payment_status}`;
                    invoiceModal.style.display = 'block';
                } else {
                    alert('Invoice not found.');
                }
            } catch (error) {
                console.error('Error fetching invoice details:', error);
                alert('Unable to fetch invoice details.');
            }
        }
    });

    // Close Invoice Modal
    closeInvoiceModal.addEventListener('click', () => {
        invoiceModal.style.display = 'none';
    });

    // Fetch invoices on page load
    fetchInvoices();
    // Fetch Studios
    async function fetchStudios() {
        try {
            const response = await fetch('/api/studios');
            const studios = await response.json();

            studioSelect.innerHTML = '<option value="" disabled selected>Select a studio</option>';
            studios.forEach(studio => {
                const option = document.createElement('option');
                option.value = studio.studio_id;
                option.textContent = `${studio.name} - ${studio.city}`;
                studioSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching studios:', error);
        }
    }

    // Fetch Sessions for a Studio
    async function fetchSessions(studioId) {
        try {
            const response = await fetch(`/api/sessions/${studioId}`);
            const sessions = await response.json();

            sessionTableBody.innerHTML = '';
            sessions.forEach(session => {
                const row = document.createElement('tr');

                const actionButton = session.is_booked
                    ? `<button class="pay-record-btn" data-id="${session.session_id}">Pay and Record</button>`
                    : `<button class="book-btn" data-id="${session.session_id}">Book</button>`;

                row.innerHTML = `
                    <td>${session.session_id}</td>
                    <td>${session.date}</td>
                    <td>${session.time}</td>
                    <td>${session.total_billing}</td>
                    <td>${actionButton}</td>
                `;

                sessionTableBody.appendChild(row);
            });

            document.getElementById('session-section').style.display = sessions.length > 0 ? 'block' : 'none';
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
    }

    // Fetch Equipment
    async function fetchEquipment() {
        try {
            const response = await fetch('/api/equipment');
            const equipment = await response.json();

            equipmentSelect.innerHTML = '';
            equipment.forEach(item => {
                const option = document.createElement('option');
                option.value = item.equipment_id;
                option.textContent = `${item.name} - ₹${item.total_billing}`;
                equipmentSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching equipment:', error);
        }
    }

    // Assign Equipment to a Session
    assignEquipmentButton.addEventListener('click', async () => {
        const selectedEquipment = Array.from(equipmentSelect.selectedOptions).map(option => option.value);
        const sessionId = sessionTableBody.querySelector('.book-btn')?.dataset.id;

        if (!selectedEquipment.length || !sessionId) {
            alert('Please select equipment and a booked session.');
            return;
        }

        try {
            const response = await fetch('/api/assign-equipment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId, equipment_ids: selectedEquipment }),
            });

            if (response.ok) {
                alert('Equipment assigned successfully!');
            } else {
                alert('Error assigning equipment.');
            }
        } catch (error) {
            console.error('Error assigning equipment:', error);
        }
    });

    // Handle Booking
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('book-btn')) {
            const sessionId = e.target.dataset.id;

            try {
                const response = await fetch('/api/book-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: sessionId }),
                });

                const data = await response.json();

                if (response.ok) {
                    alert(data.message);
                    fetchSessions(studioSelect.value);
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error('Error booking session:', error);
                alert('Something went wrong. Please try again later.');
            }
        }
    });

    // Handle Pay and Record
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('pay-record-btn')) {
            const sessionId = e.target.dataset.id;
            window.location.href = `/dashboard/payment-record.html?session_id=${sessionId}`;
        }
    });

    // Fetch Studios and Equipment on Page Load
    fetchStudios();
    fetchEquipment();

    // Event Listener for Studio Selection
    studioSelect.addEventListener('change', () => {
        const studioId = studioSelect.value;
        if (studioId) {
            fetchSessions(studioId);
        }
    });

    // Logout
    document.getElementById('logout-button').addEventListener('click', async () => {
        try {
            const response = await fetch('/logout', { method: 'POST' });

            if (response.ok) {
                window.location.href = '/login';
            } else {
                alert('Error logging out.');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            alert('Something went wrong.');
        }
    });
    // fetchSessionNotes
    async function fetchSessionNotes() {
        try {
            const response = await fetch('/api/session-notes');
            const sessionNotes = await response.json();
    
            if (sessionNotes.message) {
                alert(sessionNotes.message);
                return;
            }
    
            const sessionNotesTableBody = document.querySelector('#session-notes-table tbody');
            sessionNotesTableBody.innerHTML = '';
    
            sessionNotes.forEach(note => {
                const row = document.createElement('tr');
    
                row.innerHTML = `
                    <td>${note.note_id}</td>
                    <td>${note.studio_name}</td>
                    <td>${new Date(note.date).toLocaleDateString()}</td>
                    <td>
                        ${note.audio_file 
                            ? `<audio controls><source src="${note.audio_file}" type="audio/mpeg">Your browser does not support the audio element.</audio>` 
                            : 'No audio available'}
                    </td>
                `;
    
                sessionNotesTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching session notes:', error);
        }
    }
    
    // Fetch and Render Client History
    async function fetchClientHistory() {
        try {
            const response = await fetch('/api/client/history');
            const history = await response.json();
    
            if (Array.isArray(history)) {
                historyTableBody.innerHTML = '';
                history.forEach(item => {
                    const isPaid = item.payment_status === 'Paid';
                    const actionButton = isPaid
                        ? `<span>Paid</span>`
                        : `<button class="pay-record-btn" data-id="${item.session_id}">Pay and Record</button>`;
    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${item.session_id}</td>
                        <td>${item.date}</td>
                        <td>${item.time}</td>
                        <td>${item.studio_name}</td>
                        <td>${item.total_billing}</td>
                        <td>${actionButton}</td>
                    `;
    
                    historyTableBody.appendChild(row);
                });
            } else {
                console.error('Invalid history data:', history);
                alert('Failed to fetch client history.');
            }
        } catch (error) {
            console.error('Failed to fetch client history.', error);
            alert('Something went wrong while fetching client history.');
        }
    }
    

});
