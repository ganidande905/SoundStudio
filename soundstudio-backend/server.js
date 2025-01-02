
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const multer = require('multer');

const app = express();
const port = process.env.PORT || 5000; // Use port from .env or default to 5000

// Initialize multer to handle form-data
const upload = multer();
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
// Load .env file
// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use('/auth', express.static(path.join(__dirname, '../auth')));
app.use('/dashboard', express.static(path.join(__dirname, '../dashboard')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

app.use(
    session({
        
        secret: process.env.SESSION_SECRET, // Use the secret from your .env file
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false, // Set true if using HTTPS
        },
    })
);



// PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});
app.use(require('express-session')({
    secret: process.env.SESSION_SECRET||'fallback_secret',
    resave: false,
    saveUninitialized: false,
}));
// Route: Redirect root URL `/` to `/signup`
app.get('/', (req, res) => {
    res.redirect('/signup');
});

// Route: Serve Signup Page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../auth/signup/signup.html'));
});

// Route: Serve Login Page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../auth/login/login.html'));
});
// Route: Serve Dashboard Page
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../dashboard/dashboard.html'));
});
// Route: Serve Payment and Recording Page
app.get('/record', (req, res) => {
    res.sendFile(path.join(__dirname, '../dashboard/payment-record.html'));
});
// Route: Get Studios
app.get('/api/studios', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM STUDIO');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching studios:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route: Get Sessions for a Studio
app.get('/api/sessions/:studioId', async (req, res) => {
    const { studioId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM SESSION WHERE Studio_ID = $1', [studioId]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching sessions:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Payment Processing
app.post('/api/payment', async (req, res) => {
    const { session_id, payment_amount } = req.body;
    const client_id = req.session.clientId; // Fetch client_id from session

    if (!client_id) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    try {
        // Check if the session is booked by the client
        const checkQuery = `
            SELECT * FROM CLIENT_SESSION WHERE Client_ID = $1 AND Session_ID = $2;
        `;
        const checkResult = await pool.query(checkQuery, [client_id, session_id]);

        if (checkResult.rows.length === 0) {
            return res.status(403).json({ message: 'You have not booked this session.' });
        }

        // Process the payment 
        const invoiceQuery = `
            INSERT INTO INVOICE (Payment_Status, Amount, Session_ID)
            VALUES ('Paid', $1, $2)
            RETURNING *;
        `;
        const result = await pool.query(invoiceQuery, [payment_amount, session_id]);

        res.status(201).json({ message: 'Payment successful!', invoice: result.rows[0] });
    } catch (err) {
        console.error('Error processing payment:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// Save Audio Recording API
app.post('/api/save-audio', upload.single('audio'), async (req, res) => {
    const { session_id } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'No audio file uploaded' });
    }

    const audioFilePath = `/uploads/${req.file.filename}`; // Path to the uploaded file

    try {
        // Check if a record already exists for the session
        const checkQuery = 'SELECT * FROM SESSION_NOTES WHERE Session_ID = $1';
        const checkResult = await pool.query(checkQuery, [session_id]);

        if (checkResult.rows.length > 0) {
            return res.status(400).json({ message: 'An audio file already exists for this session.' });
        }

        // Insert the audio record
        const insertQuery = `
            INSERT INTO SESSION_NOTES (Session_ID, Audio_File)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const values = [session_id, audioFilePath];
        const result = await pool.query(insertQuery, values);

        res.status(201).json({ message: 'Audio saved successfully', note: result.rows[0] });
    } catch (err) {
        console.error('Error saving audio:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// Route: Get Equipment
app.get('/api/equipment', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM EQUIPMENT');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching equipment:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route: Get Staff
app.get('/api/staff', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM STAFF');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching staff:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});
app.post('/signup', async (req, res) => {
    const { first_name, last_name, email, phone, address, password } = req.body;

    if (!first_name || !last_name || !email || !phone || !address || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `
            INSERT INTO CLIENT (Name, Contact_info, Email, Address, Password)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const name = `${first_name} ${last_name}`;
        const values = [name, phone, email, address, hashedPassword];
        const result = await pool.query(query, values);

        res.status(201).json({ message: 'Client registered successfully', client: result.rows[0] });
    } catch (err) {
        console.error('Error during signup:', err);
        if (err.code === '23505') {
            res.status(400).json({ message: 'Email or phone already exists' });
        } else {
            res.status(500).json({ message: 'Server error' });
        }
    }
});

// Route: Login a user
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const query = 'SELECT * FROM CLIENT WHERE Email = $1';
        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found!' });
        }

        const client = result.rows[0];
        const validPassword = await bcrypt.compare(password, client.password);

        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials!' });
        }
        if (!req.session) {
            return res.status(500).json({ message: 'Session not initialized' });
        }
        // Store client ID in session
        req.session.clientId = client.client_id;
        req.session.clientName = client.name;

        res.status(200).json({
            message: 'Login successful!',
            clientId: client.client_id,
            name: client.name,
        });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});
app.get('/api/equipment', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM EQUIPMENT WHERE status = $1', ['Available']);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching equipment:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});
app.get('/api/staff/:sessionCost', async (req, res) => {
    const { sessionCost } = req.params;

    try {
        const query = `
            SELECT * FROM STAFF
            WHERE staff_hours <= $1
            ORDER BY staff_hours DESC
            LIMIT 1;
        `;
        const result = await pool.query(query, [sessionCost]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No staff available for this session cost.' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching staff:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});
app.post('/api/assign-equipment', async (req, res) => {
    const { session_id, equipment_ids } = req.body;

    if (!session_id || !equipment_ids || !equipment_ids.length) {
        return res.status(400).json({ message: 'Session ID and equipment IDs are required' });
    }

    try {
        const queries = equipment_ids.map(equipment_id =>
            pool.query(
                `INSERT INTO EQUIPMENT_SESSION (Session_ID, Equipment_ID) VALUES ($1, $2)`,
                [session_id, equipment_id]
            )
        );

        await Promise.all(queries);

        res.status(201).json({ message: 'Equipment assigned successfully!' });
    } catch (err) {
        console.error('Error assigning equipment:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route: Logout a user
app.post('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).json({ message: 'Error logging out' });
            }
            res.status(200).json({ message: 'Logged out successfully' });
        });
    } else {
        res.status(400).json({ message: 'No active session to log out from' });
    }
});


// Route: Get Client History
app.get('/api/client/history', async (req, res) => {
    const client_id = req.session.clientId; // Get the client ID from the session

    if (!client_id) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    try {
        const query = `
            SELECT 
                S.Session_ID, 
                S.Date, 
                S.Time, 
                S.Total_Billing, 
                ST.Name AS Studio_Name, 
                I.Invoice_ID, 
                I.Payment_Status
            FROM CLIENT_SESSION CS
            JOIN SESSION S ON CS.Session_ID = S.Session_ID
            JOIN STUDIO ST ON S.Studio_ID = ST.Studio_ID
            LEFT JOIN INVOICE I ON I.Session_ID = S.Session_ID
            WHERE CS.Client_ID = $1;
        `;
        const result = await pool.query(query, [client_id]);

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching client history:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});
app.get('/api/session-notes', async (req, res) => {
    const client_id = req.session.clientId; // Get client ID from the session

    if (!client_id) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    try {
        const query = `
            SELECT SN.Note_ID, SN.Audio_File, S.Session_ID, S.Date, ST.Name AS Studio_Name
            FROM SESSION_NOTES SN
            JOIN SESSION S ON SN.Session_ID = S.Session_ID
            JOIN STUDIO ST ON S.Studio_ID = ST.Studio_ID
            JOIN CLIENT_SESSION CS ON CS.Session_ID = S.Session_ID
            WHERE CS.Client_ID = $1;
        `;
        const result = await pool.query(query, [client_id]);

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching session notes:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.post('/api/book-session', async (req, res) => {
    const { session_id } = req.body;
    const client_id = req.session.clientId;

    if (!client_id) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    try {
        // Check if the session is already booked
        const checkQuery = `
            SELECT * FROM CLIENT_SESSION WHERE Session_ID = $1;
        `;
        const checkResult = await pool.query(checkQuery, [session_id]);

        if (checkResult.rows.length > 0) {
            return res.status(400).json({ message: 'Session is already booked.' });
        }

        // Link session to client and mark it as booked
        await pool.query(`
            INSERT INTO CLIENT_SESSION (Client_ID, Session_ID)
            VALUES ($1, $2);
        `, [client_id, session_id]);

        await pool.query(`
            UPDATE SESSION
            SET is_booked = TRUE
            WHERE Session_ID = $1;
        `, [session_id]);

        res.status(201).json({ message: 'Session booked successfully!' });
    } catch (err) {
        console.error('Error booking session:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// Route: Get Invoice Details
app.get('/api/invoice/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const query = 'SELECT * FROM INVOICE WHERE Invoice_ID = $1';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching invoice:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
