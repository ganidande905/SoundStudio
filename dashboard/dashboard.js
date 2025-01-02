document.addEventListener('DOMContentLoaded', () => {
    const studioSelect = document.getElementById('studio-select');
    const sessionTableBody = document.querySelector('#session-table tbody');
    const historyTableBody = document.querySelector('#history-table tbody');
    const equipmentSelect = document.getElementById('equipment-select');
    const assignEquipmentButton = document.getElementById('assign-equipment-button');

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
});
