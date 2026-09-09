import { getCollection } from "../db/mongodb";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "../auth/service";

export type WishlistDocument = {
  userId: import("mongodb").ObjectId;
  productIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated.");
  return user;
}

export async function getWishlist() {
  const user = await requireUser();
  const users = await getCollection<WishlistDocument>("wishlists");
  const doc = await users.findOne({ userId: new ObjectId(user.id) });
  return { productIds: doc?.productIds ?? [] };
}

export async function replaceWishlist(productIds: string[]) {
  const user = await requireUser();
  const now = new Date();
  const unique = [...new Set(productIds)].filter((id) => typeof id === "string" && id.length <= 200);
  const collection = await getCollection<WishlistDocument>("wishlists");
  await collection.updateOne(
    { userId: new ObjectId(user.id) },
    {
      $set: { productIds: unique, updatedAt: now },
      $setOnInsert: { userId: new ObjectId(user.id), createdAt: now },
    },
    { upsert: true },
  );
  return { productIds: unique };
}
