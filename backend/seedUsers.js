import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Teacher from './src/models/Teacher.js';

dotenv.config();

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ofppt-absence');
    console.log('✅ Connected to MongoDB');

    // Clear existing users (optional - comment out if you want to keep existing data)
    // await User.deleteMany({});
    // await Teacher.deleteMany({});
    // console.log('🗑️  Cleared existing users');

    // Create Admin User
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@ofppt.ma',
      password: 'admin123',
      role: 'admin',
    });
    console.log('✅ Created Admin:', admin.email);

    // Create SG User
    const sg = await User.create({
      name: 'SG User',
      email: 'sg@ofppt.ma',
      password: 'sg1234',
      role: 'sg',
    });
    console.log('✅ Created SG:', sg.email);

    // Create Teacher User
    const teacher = await Teacher.create({
      firstName: 'Mohamed',
      lastName: 'Alami',
      email: 'teacher@ofppt.ma',
      matricule: 'T001',
      password: 'teacher123',
      mustChangePassword: false,
      isActive: true,
    });
    console.log('✅ Created Teacher:', teacher.email);

    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Admin:');
    console.log('   Email: admin@ofppt.ma');
    console.log('   Password: admin123');
    console.log('');
    console.log('👥 SG (Student Group):');
    console.log('   Email: sg@ofppt.ma');
    console.log('   Password: sg1234');
    console.log('');
    console.log('👨‍🏫 Teacher:');
    console.log('   Email: teacher@ofppt.ma');
    console.log('   Password: teacher123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
    process.exit(1);
  }
};

seedUsers();
