# FindIt — Lost and Found Platform

Web-based lost-and-found platform for reporting, browsing, and managing lost and found items.

## Structure

* `frontend/` — React client.
* `backend/` — Node.js and Express API.
* `database/` — MongoDB models and database configuration.
* `docs/` — Project documentation.

## Run application locally

### Backend

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file and configure the required environment variables:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

4. Start the backend:

```bash
npm start
```

The backend will run on `http://localhost:5000`.

### Frontend

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The frontend will be available at the URL shown in the terminal.

## Features

* User registration and login.
* Report lost items.
* Report found items.
* Browse and search item reports.
* View item details.
* Manage reported items.

## Technology Stack

* React
* Node.js
* Express.js
* MongoDB
* JavaScript

## Future Improvements

* Intelligent matching between lost and found items.
* Image-based matching.
* Location-based matching.
* Notifications for potential matches.
* In-app communication.
