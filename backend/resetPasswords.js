import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';
import Teacher from './src/models/Teacher.js';

dotenv.config();

const resetPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ofppt-absence');
    console.log('✅ Connected to MongoDB\n');

    // Reset all user passwords
    const users = await User.find({});
    for (const user of users) {
      const newPassword = user.role === 'admin' ? 'admin123' : 'sg1234';
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
      console.log(`✅ Reset password for ${user.email} (${user.role})`);
    }

    // Reset all teacher passwords
    const teachers = await Teacher.find({});
    for (const teacher of teachers) {
      const salt = await bcrypt.genSalt(10);
      teacher.password = await bcrypt.hash('teacher123', salt);
      teacher.mustChangePassword = false;
      await teacher.save();
      console.log(`✅ Reset password for ${teacher.email} (teacher)`);
    }

    console.log('\n📋 Updated Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (users.length > 0) {
      users.forEach(user => {
        const pwd = user.role === 'admin' ? 'admin123' : 'sg1234';
        console.log(`\n${user.role.toUpperCase()}:`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: ${pwd}`);
      });
    }

    if (teachers.length > 0) {
      teachers.forEach(teacher => {
        console.log(`\nTEACHER:`);
        console.log(`   Email: ${teacher.email}`);
        console.log(`   Password: teacher123`);
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

resetPasswords();
