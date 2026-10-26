/**
 * API smoke test for a running backend (dev SMS mode: codes are returned as devCode).
 *   API_URL=http://localhost:3007/graphql node e2e/api-smoke.mjs
 * Creates two throwaway members and removes everything it created at the end (needs MONGO_URL for cleanup,
 * default mongodb://localhost:27017/nestar; skipped when the mongodb driver is not installed).
 */
const API = process.env.API_URL ?? 'http://localhost:3007/graphql';
let failed = 0;
const created = { members: [] };

const gql = async (query, token, variables) => {
	const response = await fetch(API, {
		method: 'POST',
		headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
		body: JSON.stringify({ query, variables }),
	});
	return response.json();
};
const check = (name, ok, extra = '') => {
	if (!ok) failed++;
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? `  (${extra})` : ''}`);
};
const error = (result) => result.errors?.[0]?.message ?? '';

const signup = async (prefix, type = 'USER') => {
	const phone = `99899${String(Date.now()).slice(-7)}`;
	const nick = `${prefix}${String(Date.now()).slice(-6)}`;
	const code = (await gql(`mutation{requestPhoneCode(input:{phone:"${phone}",purpose:SIGNUP}){devCode}}`)).data?.requestPhoneCode?.devCode;
	const result = await gql(
		`mutation($i:MemberInput!){signup(input:$i){_id accessToken refreshToken}}`,
		null,
		{ i: { memberNick: nick, memberPassword: '12345', memberPhone: phone, verificationCode: code, memberType: type } },
	);
	const member = result.data?.signup;
	if (member) created.members.push(member._id);
	return { ...member, nick, phone };
};

const run = async () => {
	// sign-up needs a valid SMS code
	const wrongCode = await gql(
		`mutation($i:MemberInput!){signup(input:$i){_id}}`,
		null,
		{ i: { memberNick: `zz${Date.now() % 1e5}`, memberPassword: '12345', memberPhone: '998990000001', verificationCode: '000000' } },
	);
	check('signup rejects a wrong code', /wrong or expired/.test(error(wrongCode)));
	const seller = await signup('e2es');
	const buyer = await signup('e2eb');
	check('signup with SMS code', !!seller.accessToken && !!seller.refreshToken);

	// login brute-force limit
	let last;
	for (let i = 0; i < 6; i++) last = await gql(`mutation{login(input:{memberNick:"${buyer.nick}",memberPassword:"wrong1"}){_id}}`);
	check('login is rate limited', /Too many attempts/.test(error(last)));

	// refresh token rotation
	const refreshed = await gql(`mutation($t:String!){refreshSession(refreshToken:$t){accessToken refreshToken}}`, null, { t: seller.refreshToken });
	check('refresh session', !!refreshed.data?.refreshSession?.accessToken);
	check('old refresh token is revoked', /expired/.test(error(await gql(`mutation($t:String!){refreshSession(refreshToken:$t){accessToken}}`, null, { t: seller.refreshToken }))));
	const token = refreshed.data.refreshSession.accessToken;

	// moderation: first listing of a new seller waits for approval
	const car = await gql(
		`mutation{createProperty(input:{propertyType:SEDAN,carCountry:SOUTH_KOREA,propertyAddress:"Seoul",propertyTitle:"E2E Sonata",propertyPrice:15000,carBrand:HYUNDAI,carModel:"Sonata",carYear:2021,carMileage:40000,carFuel:PETROL,carTransmission:AUTOMATIC,carAccidentHistory:NONE,propertyImages:["uploads/property/x.webp"]}){_id propertyStatus}}`,
		token,
	);
	const carId = car.data?.createProperty?._id;
	check('new seller listing is PENDING', car.data?.createProperty?.propertyStatus === 'PENDING', error(car));
	check('pending listing is hidden from public', /No data/.test(error(await gql(`{getProperty(propertyId:"${carId}"){_id}}`))));

	// search text with regex characters must not crash
	const special = await gql(`query($i:PropertiesInquiry!){getProperties(input:$i){metaCounter{total}}}`, null, {
		i: { page: 1, limit: 1, search: { text: '(' } },
	});
	check('search with "(" works', !error(special));
	const huge = await gql(`{getProperties(input:{page:1,limit:100000,search:{}}){metaCounter{total}}}`);
	check('page size is capped', !!error(huge));

	// private messages
	const sent = await gql(`mutation{sendMessage(input:{receiverId:"${seller._id}",propertyId:"${carId}",text:"Salom!"}){conversationId}}`, buyer.accessToken);
	check('buyer can message seller', !!sent.data?.sendMessage?.conversationId, error(sent));
	check('seller sees unread message', (await gql(`{getUnreadMessagesCount}`, token)).data?.getUnreadMessagesCount === 1);

	// report
	check('report listing', !error(await gql(`mutation{reportProperty(input:{propertyId:"${carId}",reportReason:SPAM}){_id}}`, buyer.accessToken)));
	check('exchange rate available', (await gql(`{getExchangeRate{usdToUzs}}`)).data?.getExchangeRate?.usdToUzs > 0);
};

const cleanup = async () => {
	try {
		const { MongoClient, ObjectId } = await import('mongodb');
		const client = await MongoClient.connect(process.env.MONGO_URL ?? 'mongodb://localhost:27017/nestar');
		const db = client.db();
		const ids = created.members.map((id) => new ObjectId(id));
		const cars = (await db.collection('properties').find({ memberId: { $in: ids } }).toArray()).map((car) => car._id);
		await Promise.all([
			db.collection('properties').deleteMany({ _id: { $in: cars } }),
			db.collection('reports').deleteMany({ $or: [{ memberId: { $in: ids } }, { propertyId: { $in: cars } }] }),
			db.collection('conversations').deleteMany({ participants: { $in: ids } }),
			db.collection('messages').deleteMany({ senderId: { $in: ids } }),
			db.collection('sessions').deleteMany({ memberId: { $in: ids } }),
			db.collection('notifications').deleteMany({ $or: [{ authorId: { $in: ids } }, { receiverId: { $in: ids } }] }),
			db.collection('members').deleteMany({ _id: { $in: ids } }),
		]);
		await client.close();
	} catch (err) {
		console.log(`(cleanup skipped: ${err.message})`);
	}
};

run()
	.catch((err) => {
		failed++;
		console.error(err);
	})
	.finally(async () => {
		await cleanup();
		console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
		process.exit(failed ? 1 : 0);
	});
