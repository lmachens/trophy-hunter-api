import { Db, MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI || !process.env.MONGODB_DB) {
  throw new Error('Missing env MONGODB_URI or MONGODB_DB');
}

const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true });

export function getMongoDb() {
  if (client && client.isConnected) {
    // client connected, quick return
    return client.db(process.env.MONGODB_DB);
  }
  throw new Error('Database is not connected');
}

export function connect() {
  return new Promise<Db>((resolve, reject) => {
    client.connect(err => {
      if (err) {
        console.error('[mongo] client err', err);
        return reject(err);
      }

      // connected
      resolve();
    });
  });
}

export function collection<model>(collectionName: string) {
  return getMongoDb().collection<model>(collectionName);
}
