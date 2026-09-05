const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async (uri = config.mongoUri) => {
  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection Failed: ${error.message}`);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('[Database] MongoDB Disconnected');
  } catch (error) {
    console.error(`[Database Error] Disconnection Failed: ${error.message}`);
  }
};

/**
 * Checks if current MongoDB connection supports multi-document transactions (replica set).
 */
const isReplicaSet = () => {
  try {
    const replSet = mongoose.connection?.client?.topology?.description?.type;
    return replSet && replSet !== 'Single';
  } catch {
    return false;
  }
};

/**
 * Executes an operation inside a MongoDB transaction if replica set supports it,
 * otherwise executes directly for standalone instances.
 */
const withTransaction = async (operation) => {
  if (!isReplicaSet()) {
    return await operation(null);
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await operation(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  withTransaction
};
