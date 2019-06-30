import { Db, MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Missing env MONGODB_URI');
}

let client: MongoClient = null;

export const db = (dbName: string) => {
  if (client.isConnected) {
    // client connected, quick return
    return client.db(dbName);
  }
  return null;
};

export const connect = () => {
  if (client && !client.isConnected) {
    // client discard
    client = null;
  }

  if (client === null) {
    // client init
    client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true });
  }

  return new Promise<Db>((resolve, reject) => {
    client.connect(err => {
      if (err) {
        client = null;
        console.error('[mongo] client err', err);
        return reject(err);
      }

      // connected
      resolve();
    });
  });
};
