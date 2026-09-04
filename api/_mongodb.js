const { MongoClient } = require('mongodb');

let clientPromise;

async function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured.');
  if (!clientPromise) {
    const client = new MongoClient(uri);
    clientPromise = client.connect();
  }
  return clientPromise;
}

async function getDatabase() {
  const client = await getMongoClient();
  return client.db(process.env.MONGODB_DB || 'tutien');
}

module.exports = { getDatabase, getMongoClient };
