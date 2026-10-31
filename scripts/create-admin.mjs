/**
 * Creates the first admin (or promotes / resets an existing account). Sign-up never creates admins.
 *
 *   ADMIN_PASSWORD='…' node scripts/create-admin.mjs --nick boss --phone 998901234567 [--role SUPER|MODERATOR]
 *   docker compose exec -e ADMIN_PASSWORD='…' api node scripts/create-admin.mjs --nick boss --phone 998901234567
 *
 * The password comes from the environment, not the command line, so it does not land in the shell history.
 * Admin logins are confirmed with an SMS code to this phone, so it must be a real number the admin holds.
 * Uses MONGO_PROD when NODE_ENV=production, otherwise MONGO_DEV (the same as the API).
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const arg = (name) => {
	const index = process.argv.indexOf(`--${name}`);
	return index > -1 ? process.argv[index + 1] : undefined;
};
const fail = (message) => {
	console.error(`create-admin: ${message}`);
	process.exit(1);
};

const nick = arg('nick');
const phone = String(arg('phone') ?? '').replace(/\D/g, '');
const role = (arg('role') ?? 'SUPER').toUpperCase();
const password = process.env.ADMIN_PASSWORD ?? '';
const uri = process.env.NODE_ENV === 'production' ? process.env.MONGO_PROD : process.env.MONGO_DEV;

if (!nick || !/^[a-zA-Z0-9_.]{3,12}$/.test(nick)) fail('--nick: 3-12 latin letters, digits, "_" or "."');
if (!/^\d{10,15}$/.test(phone)) fail('--phone: full number with country code, e.g. 998901234567');
if (!['SUPER', 'MODERATOR'].includes(role)) fail('--role: SUPER or MODERATOR');
// the same rules as the site (apps/nestar-api/src/libs/password.ts), a little stricter for admins
if (password.length < 12 || !/[A-Za-z]/.test(password) || !/\d/.test(password) || password.toLowerCase().includes(nick.toLowerCase()))
	fail('ADMIN_PASSWORD: at least 12 characters with letters and digits, not containing the nickname');
if (!uri) fail('MONGO_PROD / MONGO_DEV is not set');

await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 }).catch((err) => fail(`cannot reach the database: ${err.message}`));
const members = mongoose.connection.collection('members');
const existing = await members.findOne({ $or: [{ memberNick: nick }, { memberPhone: phone }] });
if (existing && (existing.memberNick !== nick || existing.memberPhone !== phone)) {
	await mongoose.disconnect();
	fail('this nickname or phone already belongs to another account');
}
const now = new Date();
await members.updateOne(
	{ memberNick: nick },
	{
		$set: {
			memberType: 'ADMIN',
			memberAdminRole: role,
			memberStatus: 'ACTIVE',
			memberPhone: phone,
			memberPhoneVerified: true,
			memberPassword: await bcrypt.hash(password, 12),
			updatedAt: now,
		},
		$setOnInsert: {
			memberNick: nick,
			memberAuthType: 'PHONE',
			memberTrusted: true,
			memberProperties: 0,
			memberArticles: 0,
			memberFollowers: 0,
			memberFollowings: 0,
			memberLikes: 0,
			memberViews: 0,
			memberComments: 0,
			memberRank: 0,
			createdAt: now,
		},
	},
	{ upsert: true },
);
// a reset password ends every open session of that account
if (existing) await mongoose.connection.collection('sessions').deleteMany({ memberId: existing._id });
await mongoose.disconnect();
console.log(`create-admin: ${existing ? 'updated' : 'created'} ${role} admin "${nick}" (+${phone})`);
