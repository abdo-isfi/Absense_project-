import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Teacher from './src/models/Teacher.js';

dotenv.config();

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ofppt-absence');
    console.log('✅ Connected to MongoDB\n');

    // Check existing users
    const users = await User.find({}).select('+password');
    const teachers = await Teacher.find({}).select('+password');

    console.log('📋 Existing Users in Database:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (users.length > 0) {
      console.log('👤 Admin/SG Users:');
      users.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
      });
      console.log('');
    } else {
      console.log('   No Admin/SG users found\n');
    }

    if (teachers.length > 0) {
      console.log('👨‍🏫 Teachers:');
      teachers.forEach(teacher => {
        console.log(`   - ${teacher.firstName} ${teacher.lastName} (${teacher.email})`);
      });
      console.log('');
    } else {
      console.log('   No teachers found\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 To test the dashboards, you can:');
    console.log('   1. Use existing credentials if you know them');
    console.log('   2. Run: node resetPasswords.js (to reset all passwords)');
    console.log('   3. Create new users via the admin panel\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkUsers();
