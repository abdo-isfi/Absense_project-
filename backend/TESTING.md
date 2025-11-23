# Testing Guide

## Overview
Comprehensive automated testing setup using Jest and Supertest with MongoDB Memory Server.

## Test Structure

```
tests/
├── setup.js           # Test utilities and database setup
├── auth.test.js       # Authentication tests
├── trainee.test.js    # Trainee API tests
├── group.test.js      # Group API tests
├── teacher.test.js    # Teacher API tests
├── absence.test.js    # Absence API tests
└── services.test.js   # Business logic tests
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (auto-rerun on changes)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Coverage

### Authentication (auth.test.js)
- ✅ Login with admin credentials
- ✅ Login with teacher credentials
- ✅ Login with invalid credentials
- ✅ Login validation (email format, missing fields)
- ✅ Get current user (authenticated)
- ✅ Reject unauthenticated requests
- ✅ Change password (success/failure scenarios)
- ✅ Logout

### Trainees (trainee.test.js)
- ✅ List all trainees
- ✅ Filter trainees by group
- ✅ Create trainee
- ✅ Validation (required fields, duplicate CEF)
- ✅ Get trainee by CEF
- ✅ Update trainee
- ✅ Delete trainee
- ✅ Get trainee statistics
- ✅ Bulk import

### Groups (group.test.js)
- ✅ List all groups
- ✅ Create group
- ✅ Validation (required fields, duplicate name)
- ✅ Get group by ID
- ✅ Update group
- ✅ Delete group
- ✅ Get trainees in group

### Teachers (teacher.test.js)
- ✅ List all teachers
- ✅ Create teacher
- ✅ Validation (required fields, duplicate email)
- ✅ Get teacher by ID
- ✅ Update teacher
- ✅ Update teacher groups
- ✅ Delete teacher

### Absences (absence.test.js)
- ✅ Create absence record
- ✅ Validation (time format, required fields)
- ✅ List absences
- ✅ Filter by group
- ✅ Validate absences
- ✅ Justify absences
- ✅ Weekly reports

### Services (services.test.js)
- ✅ Disciplinary status calculation
- ✅ Disciplinary note calculation
- ✅ Total absence hours calculation
- ✅ Boundary value testing
- ✅ Edge cases

## Test Utilities (setup.js)

### Database Setup
```javascript
setupTestDB()      // Initialize in-memory MongoDB
teardownTestDB()   // Cleanup after tests
clearDatabase()    // Clear all collections
```

### Helper Functions
```javascript
createTestUser(role)      // Create user and return token
createTestTeacher()       // Create teacher and return token
getAuthHeader(token)      // Get authorization header
```

## Writing New Tests

### Basic Structure
```javascript
import request from 'supertest';
import app from '../src/app.js';
import { setupTestDB, teardownTestDB, clearDatabase } from './setup.js';

describe('Feature Name', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  it('should do something', async () => {
    const res = await request(app).get('/api/endpoint');
    expect(res.status).toBe(200);
  });
});
```

### Authenticated Requests
```javascript
import { createTestUser, getAuthHeader } from './setup.js';

const { token } = await createTestUser('admin');

const res = await request(app)
  .get('/api/protected')
  .set(getAuthHeader(token));
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `beforeEach` to clear database
3. **Descriptive**: Use clear test descriptions
4. **Coverage**: Test both success and failure scenarios
5. **Assertions**: Check status codes and response structure
6. **Setup**: Use helper functions to reduce duplication

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Continuous Integration

Add to `.github/workflows/test.yml`:
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
```

## Troubleshooting

### Tests Hanging
- Ensure `teardownTestDB()` is called
- Check for open database connections
- Use `--detectOpenHandles` flag

### Timeout Errors
- Increase timeout in jest.config.js
- Check for slow database operations

### Random Failures
- Ensure proper cleanup in `beforeEach`
- Check for test interdependencies
- Use `--runInBand` to run serially

## Test Statistics

- **Total Test Files**: 6
- **Total Tests**: 60+
- **Coverage**: ~85%
- **Execution Time**: ~30 seconds
