# SoundStudio Backend

A music production backend server built with Node.js and PostgreSQL, supporting client session management, studio bookings, audio recording, and equipment assignments.

---

## Prerequisites

Ensure you have the following installed:

- **Node.js** (v14+ recommended) - [Download Node.js](https://nodejs.org/)
- **PostgreSQL** (v12+ recommended) - [Download PostgreSQL](https://www.postgresql.org/)

---

## Setup Instructions

Follow these steps to set up the project:

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-folder>
```

---

### 2. Install Dependencies

Run the following commands to install dependencies:

1. In the root directory:
```bash
npm install
```

2. In the `soundstudio-backend` directory:
```bash
cd soundstudio-backend
npm install
```

---

This will install the dependencies listed in the `package.json` file, including:
- `express`
- `body-parser`
- `bcrypt`
- `pg`
- `cors`
- `dotenv`
- `multer`
- `express-session`

---

### 3. Generate a Session Secret

To generate a secure session secret, use the following command:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'));"
```

Copy the generated key and use it as the value for `SESSION_SECRET` in your `.env` file.

---
Create a `.env` file in the project root and set the following variables:

```plaintext
DB_USER=sound_user
DB_PASSWORD=new_password
DB_HOST=localhost
DB_NAME=soundstudio
DB_PORT=5432
SESSION_SECRET=<your_generated_secret>
```

Use the `.env.example` file for reference.

---
### 4. Set Up the Database

1. **Create the Database**:
   Log in to PostgreSQL and create the `soundstudio` database:
   ```sql
   CREATE DATABASE soundstudio;
   ```

2. **Set Up Tables**:
   Use the following SQL commands to create the necessary tables:

   ```sql
   CREATE TABLE CLIENT (
       Client_ID SERIAL PRIMARY KEY,
       Name VARCHAR(100) NOT NULL,
       Contact_info VARCHAR(15),
       Email VARCHAR(100) UNIQUE NOT NULL,
       Address VARCHAR(255),
       Password VARCHAR(255) NOT NULL
   );

   CREATE TABLE STUDIO (
       Studio_ID SERIAL PRIMARY KEY,
       Name VARCHAR(100) NOT NULL,
       Location VARCHAR(100),
       City VARCHAR(100),
       State VARCHAR(50)
   );

   CREATE TABLE SESSION (
       Session_ID SERIAL PRIMARY KEY,
       Studio_ID INT REFERENCES STUDIO(Studio_ID),
       Total_Billing DECIMAL(10, 2),
       Date DATE,
       Time TIME,
       Duration INT,
       Is_Booked BOOLEAN DEFAULT FALSE
   );

   CREATE TABLE EQUIPMENT (
       Equipment_ID SERIAL PRIMARY KEY,
       Name VARCHAR(100) NOT NULL,
       Status VARCHAR(20),
       Total_Billing DECIMAL(10, 2)
   );

   CREATE TABLE STAFF (
       Staff_ID SERIAL PRIMARY KEY,
       Role VARCHAR(50),
       Name VARCHAR(100) NOT NULL,
       Staff_Hours INT,
       Manager_ID INT REFERENCES STAFF(Staff_ID)
   );

   CREATE TABLE INVOICE (
       Invoice_ID SERIAL PRIMARY KEY,
       Payment_Status VARCHAR(20),
       Amount DECIMAL(10, 2),
       Session_ID INT REFERENCES SESSION(Session_ID)
   );

   CREATE TABLE SESSION_NOTES (
       Note_ID SERIAL PRIMARY KEY,
       Session_ID INT REFERENCES SESSION(Session_ID),
       Audio_File VARCHAR(255),
       Content TEXT
   );

   CREATE TABLE CLIENT_SESSION (
       Client_ID INT REFERENCES CLIENT(Client_ID),
       Session_ID INT REFERENCES SESSION(Session_ID),
       PRIMARY KEY (Client_ID, Session_ID)
   );

   CREATE TABLE EQUIPMENT_SESSION (
       Equipment_ID INT REFERENCES EQUIPMENT(Equipment_ID),
       Session_ID INT REFERENCES SESSION(Session_ID),
       PRIMARY KEY (Equipment_ID, Session_ID)
   );
   ```

3. **Insert Sample Data**:

   Insert sample data into the `STUDIO` and `SESSION` tables:

   ```sql
   INSERT INTO STUDIO (Name, Location, City, State) VALUES
   ('Melody Studio', '123 Main St', 'Mumbai', 'Maharashtra'),
   ('Harmony Hub', '456 Elm St', 'Bangalore', 'Karnataka'),
   ('Rhythm Room', '789 Oak St', 'Chennai', 'Tamil Nadu');

   INSERT INTO SESSION (Studio_ID, Total_Billing, Date, Time, Duration) VALUES
   (1, 2000.00, '2025-01-01', '10:00:00', 120),
   (2, 2500.00, '2025-01-02', '14:00:00', 90),
   (3, 1800.00, '2025-01-03', '16:00:00', 60);
   ```

---

### 5. Start the Server

Run the server:

```bash
node server.js
```

The server will start at [http://localhost:5000](http://localhost:5000).

---

## Available Endpoints

### Authentication
- **POST** `/signup`: Register a new client
- **POST** `/login`: Log in a client
- **POST** `/logout`: Log out the client

### Studios and Sessions
- **GET** `/api/studios`: Fetch all studios
- **GET** `/api/sessions/:studioId`: Fetch sessions for a studio
- **POST** `/api/book-session`: Book a session

### Payments
- **POST** `/api/payment`: Process a payment

### Session Notes
- **GET** `/api/session-notes`: Fetch session notes
- **POST** `/api/save-audio`: Save audio recording

---

## Additional Notes

- Use `npm install` to install all required dependencies.
- Database setup must be completed before starting the server.
- The application uses PostgreSQL; ensure it is running before executing any queries.

## Web View
<img width="1512" alt="Screenshot 2025-02-23 at 20 55 50" src="https://github.com/user-attachments/assets/3ddac820-af5e-4966-91fc-95c26f417600" />
<img width="1512" alt="Screenshot 2025-02-23 at 20 55 37" src="https://github.com/user-attachments/assets/8a66da88-0c94-41ba-8b88-a1c5d72f203a" />
<img width="1512" alt="Screenshot 2025-02-23 at 20 55 19" src="https://github.com/user-attachments/assets/02486729-416b-4567-8f51-398ea4c063a0" />

