const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const connectTestDB = async () => {
  try {
    await mongoose.connect(process.env.TEST_MONGO_URI);
  } catch (error) {
    console.error('Test DB Connection Error:', error);
  }
};

const generateTestToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const clearTestCollections = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
};

module.exports = {
  connectTestDB,
  generateTestToken,
  clearTestCollections
};
