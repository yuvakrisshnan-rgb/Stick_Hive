import { MongoClient, type Db, type Collection } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "stickhive";

if (!uri && process.env.NODE_ENV !== "production") {
  // Do not throw during build; routes/services throw a clearer error when used.
  console.warn("MONGODB_URI is not set. Auth endpoints will be unavailable until configured.");
}

let clientPromise: Promise<MongoClient> | undefined;

function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (!clientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 5,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 5000,
    });

    clientPromise = client.connect().then(async (connectedClient) => {
      const db = connectedClient.db(dbName);
      await Promise.all([
        db.collection("users").createIndex({ email: 1 }, { unique: true }),
        db.collection("otp_challenges").createIndex({ email: 1 }, { unique: true }),
        db.collection("otp_challenges").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        db.collection("sessions").createIndex({ tokenHash: 1 }, { unique: true }),
        db.collection("sessions").createIndex({ userId: 1 }),
        db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        db.collection("wishlists").createIndex({ userId: 1 }, { unique: true }),
        db.collection("orders").createIndex({ userId: 1, createdAt: -1 }),
        db.collection("orders").createIndex({ orderId: 1 }, { unique: true }),
        db.collection("orders").createIndex({ stripeSessionId: 1 }, { sparse: true }),
      ]);
      return connectedClient;
    });
  }

  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(dbName);
}

export async function getCollection<T extends object>(name: string): Promise<Collection<T>> {
  return (await getDb()).collection<T>(name);
}

