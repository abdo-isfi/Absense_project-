import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';
import Teacher from '../src/models/Teacher.js';
import jwtConfig from '../src/config/jwt.js';

let mongoServer;

// Setup in-memory MongoDB before all tests
export const setupTestDB = async () => {
  // Disconnect any existing connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
};

// Cleanup after all tests
export const teardownTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
};

// Clear all collections before each test
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

// Create test user and return token
export const createTestUser = async (role = 'admin') => {
  const user = await User.create({
    name: 'Test User',
    email: `test-${role}@example.com`,
    password: 'password123',
    role: role,
  });

  const token = jwt.sign({ id: user._id }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });

  return { user, token };
};

// Create test teacher and return token
export const createTestTeacher = async () => {
  const teacher = await Teacher.create({
    firstName: 'Test',
    lastName: 'Teacher',
    email: 'teacher@example.com',
    matricule: 'MAT123',
    password: 'password123',
    mustChangePassword: false,
    isActive: true,
  });

  const token = jwt.sign({ id: teacher._id }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });

  return { teacher, token };
};

// Helper to make authenticated requests
export const getAuthHeader = (token) => {
  return { Authorization: `Bearer ${token}` };
};
