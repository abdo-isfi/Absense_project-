# MERN Stack Project

Full-stack JavaScript application using MongoDB, Express, React, and Node.js.

## Project Structure

```
.
├── backend/          # Node.js/Express API server
│   ├── src/
│   │   ├── config/   # Database and other configurations
│   │   ├── models/   # Mongoose models
│   │   ├── controllers/  # Route controllers
│   │   └── routes/   # API routes
│   ├── server.js     # Entry point
│   └── package.json
│
└── frontend/         # React application (Vite)
    ├── src/
    ├── public/
    └── package.json
```

## Getting Started

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your MongoDB connection string

5. Start development server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server

## Development

- Backend runs on port 5000
- Frontend runs on port 5173
- Make sure MongoDB is running before starting the backend
