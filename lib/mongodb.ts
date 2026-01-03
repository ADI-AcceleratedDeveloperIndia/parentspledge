import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

async function getMongoClient(): Promise<MongoClient> {
  if (!process.env.MONGODB_URI) {
    throw new Error('Please add your Mongo URI to .env.local');
  }

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      const client = new MongoClient(process.env.MONGODB_URI, {
        maxPoolSize: 10, // Maximum number of connections in the pool
        minPoolSize: 2, // Minimum number of connections
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        serverSelectionTimeoutMS: 5000, // Timeout for server selection
        socketTimeoutMS: 45000, // Timeout for socket operations
      });
      globalWithMongo._mongoClientPromise = client.connect();
    }
    return globalWithMongo._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    if (!clientPromise) {
      client = new MongoClient(process.env.MONGODB_URI, {
        maxPoolSize: 50, // Higher pool size for production (Vercel serverless)
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        retryReads: true,
      });
      clientPromise = client.connect();
    }
    return clientPromise;
  }
}

export async function getDatabase(): Promise<Db> {
  const client = await getMongoClient();
  return client.db('parentspledge');
}

export default getMongoClient;
