// Loads seed/data.json into MongoDB and copies its pictures into the API's uploads/ folder.
// Run from the repo root: node seed/load.mjs   (uses MONGO_DEV from .env)
// Safe to run again: documents are upserted by _id, nothing else in the database is touched.
import 'dotenv/config';
import { readFile, cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const url = process.env.MONGO_DEV;
if (!url) throw new Error('MONGO_DEV is not set (.env)');

const { EJSON } = mongoose.mongo.BSON;
const data = EJSON.parse(await readFile(path.join(ROOT, 'data.json'), 'utf8'));

await cp(path.join(ROOT, 'uploads'), path.join(ROOT, '..', 'uploads'), { recursive: true });

await mongoose.connect(url);
const db = mongoose.connection.db;
for (const collection of ['members', 'properties', 'boardArticles']) {
	const docs = data[collection];
	const result = await db.collection(collection).bulkWrite(
		docs.map((doc) => ({ replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true } })),
	);
	console.log(`${collection}: ${result.upsertedCount} added, ${result.modifiedCount} updated`);
}
await mongoose.disconnect();
