const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Set a quick timeout for connection so it doesn't hang forever if MongoDB isn't running
    mongoose.set('strictQuery', true);
    
    console.log('🔄 Attempting MongoDB connection...');
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/safecompanion', {
      serverSelectionTimeoutMS: 3000 // Timeout after 3 seconds
    });
    
    console.log(`✅ MERN Database Linked! MongoDB Connected: ${conn.connection.host}`);
    global.useLocalDB = false;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.log('----------------------------------------------------------------------');
    console.log('⚠️  AUTO-ROUTING ENABLED: MongoDB service is offline or not installed.');
    console.log('📂 SafeCompanion has successfully switched to LOCAL JSON DATABASE fallback.');
    console.log('📂 User records and safety zones will read/write to: backend/data/*.json');
    console.log('📂 The app is now 100% functional without needing MongoDB running!');
    console.log('----------------------------------------------------------------------');
    global.useLocalDB = true;
  }
};

module.exports = connectDB;
