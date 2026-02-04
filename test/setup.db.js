import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongo;

export async function connectTestDB() {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
}

export async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

export async function closeTestDB() {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
}
