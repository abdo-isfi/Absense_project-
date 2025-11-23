# OFPPT Absence Management System - Express.js Backend

Complete Express.js backend converted from Laravel, with MongoDB database.

## Features

✅ **Authentication** - JWT-based auth with multi-role support (Admin, SG, Teacher)  
✅ **User Management** - Users and teachers with role-based access  
✅ **Trainee Management** - CRUD operations, Excel/CSV import, statistics  
✅ **Group Management** - Manage classes/groups  
✅ **Absence Tracking** - Complete absence recording and management  
✅ **Validation & Justification** - Multi-step absence validation workflow  
✅ **Disciplinary Scoring** - Automatic calculation of disciplinary notes  
✅ **Weekly Reports** - Generate weekly absence reports by group  
✅ **File Uploads** - Excel/CSV import, schedule uploads  

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Excel/CSV**: xlsx, csv-parser
- **Validation**: express-validator
- **Date Handling**: moment.js

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.js  # MongoDB connection
│   │   ├── jwt.js       # JWT configuration
│   │   └── multer.js    # File upload config
│   ├── models/          # Mongoose models
│   │   ├── User.js
│   │   ├── Teacher.js
│   │   ├── Trainee.js
│   │   ├── Group.js
│   │   ├── AbsenceRecord.js
│   │   ├── TraineeAbsence.js
│   │   └── Dropout.js
│   ├── controllers/     # Route controllers
│   │   ├── authController.js
│   │   ├── traineeController.js
│   │   ├── groupController.js
│   │   ├── teacherController.js
│   │   └── absenceController.js
│   ├── middleware/      # Custom middleware
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validate.js
│   ├── routes/          # API routes
│   │   ├── auth.routes.js
│   │   ├── trainee.routes.js
│   │   ├── group.routes.js
│   │   ├── teacher.routes.js
│   │   └── absence.routes.js
│   ├── services/        # Business logic
│   │   ├── absenceCalculator.js
│   │   └── excelImporter.js
│   ├── utils/           # Utility functions
│   │   └── response.js
│   └── app.js           # Express app setup
├── server.js            # Entry point
├── package.json
├── .env.example
└── README.md
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ofppt_absences
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=xlsx,xls,csv,pdf,jpg,jpeg,png
```

### 3. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# On Linux/Mac
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Run the Server

**Development mode** (with auto-restart):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (admin/sg/teacher)
- `POST /api/auth/logout` - Logout
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user

### Trainees
- `GET /api/trainees` - List all trainees
- `GET /api/trainees/with-stats` - List with statistics
- `POST /api/trainees` - Create trainee
- `GET /api/trainees/:cef` - Get trainee by CEF
- `PUT /api/trainees/:cef` - Update trainee
- `DELETE /api/trainees/:cef` - Delete trainee
- `DELETE /api/trainees/delete-all` - Delete all
- `GET /api/trainees/:cef/absences` - Get trainee absences
- `GET /api/trainees/:cef/statistics` - Get statistics
- `POST /api/trainees/bulk-import` - Bulk import JSON
- `POST /api/trainees/import` - Import Excel/CSV

### Groups
- `GET /api/groups` - List all groups
- `POST /api/groups` - Create group
- `GET /api/groups/:id` - Get group
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group
- `GET /api/groups/:group/trainees` - Get group trainees
- `GET /api/groups/:group/absences` - Get group absences
- `GET /api/groups/:group/weekly-report` - Weekly report

### Teachers
- `GET /api/teachers` - List all teachers
- `POST /api/teachers` - Create teacher
- `GET /api/teachers/:id` - Get teacher
- `PUT /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher
- `POST /api/teachers/:id/schedule` - Upload schedule

### Absences
- `GET /api/absences` - List absence records
- `POST /api/absences` - Create absence record
- `GET /api/absences/:id` - Get absence record
- `PUT /api/absences/:id` - Update absence record
- `DELETE /api/absences/:id` - Delete absence record
- `POST /api/absences/validate` - Validate absences
- `POST /api/absences/validate-displayed` - Validate displayed
- `POST /api/absences/justify` - Justify absences
- `PATCH /api/absences/:id/billet-entree` - Mark billet entrée
- `PATCH /api/trainee-absences/:id` - Update trainee absence
- `PATCH /api/trainee-absences/:id/update-column` - Update column
- `GET /api/trainee-absences-with-trainee` - Get all with trainee

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment (development/production) | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/ofppt_absences |
| `JWT_SECRET` | Secret key for JWT | - |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `UPLOAD_DIR` | Upload directory path | uploads |
| `MAX_FILE_SIZE` | Max file size in bytes | 5242880 (5MB) |
| `ALLOWED_FILE_TYPES` | Allowed file extensions | xlsx,xls,csv,pdf,jpg,jpeg,png |

## Business Logic

### Absence Hours Calculation
- **Present**: 0 hours
- **Late**: 1 hour (fixed)
- **Absent**: Calculated from time range (end_time - start_time)

### Disciplinary Note Calculation
```
absenceDeduction = floor(absenceHours / 2.5) * 0.5
latenessDeduction = floor(lateCount / 4) * 1
finalNote = max(0, 20 - absenceDeduction - latenessDeduction)
```

### Disciplinary Status Levels
- **40+ hours**: EXCL DEF (CD) - Red
- **35-39 hours**: EXCL TEMP (CD) - Orange
- **30-34 hours**: SUSP 2J (CD) - Orange
- **25-29 hours**: BLÂME (CD) - Brown
- **20-24 hours**: 2ème MISE (CD) - Purple
- **15-19 hours**: 1er MISE (CD) - Light Purple
- **10-14 hours**: 2ème AVERT (SC) - Dark Blue
- **5-9 hours**: 1er AVERT (SC) - Blue
- **0-4 hours**: NORMAL - Green

## Excel/CSV Import Format

The import expects a specific format:
- **Row 4** (index 3): Header row
- **Row 5+** (index 4+): Data rows

### Required Columns
- `CEF` - Student ID (required)
- `Nom` - Last name (required)
- `Prénom` - First name (required)
- `Groupe` - Group/class name (required)
- `Téléphone` - Phone number (optional)

Headers are case-insensitive and support variations (e.g., "prenom", "prénom", "Prénom").

## Testing

Test the API:

```bash
# Test server status
curl http://localhost:5000/api/test

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

## Migration from Laravel

This backend is a complete conversion from the Laravel OFPPT project with:
- ✅ All models converted to Mongoose schemas
- ✅ All controllers and methods implemented
- ✅ All routes mapped identically
- ✅ Business logic preserved (absence calculations, disciplinary scoring)
- ✅ File upload functionality maintained
- ✅ Authentication converted from Sanctum to JWT
- ✅ Same API response formats

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start
```

## License

ISC
