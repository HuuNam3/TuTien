const { MongoClient } = require('mongodb');

let clientPromise;
const mongoConnectionOptions = {
  serverSelectionTimeoutMS: 7000,
  connectTimeoutMS: 7000,
};

async function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured.');
  if (!clientPromise) {
    const client = new MongoClient(uri, mongoConnectionOptions);
    clientPromise = client.connect().catch((error) => {
      clientPromise = null;
      client.close().catch(() => {});
      throw error;
    });
  }
  return clientPromise;
}

async function getDatabase() {
  const client = await getMongoClient();
  return client.db(process.env.MONGODB_DB || 'tutien');
}

function resetMongoClient() {
  clientPromise = null;
}

module.exports = { getDatabase, getMongoClient, resetMongoClient };
