/**
 * API smoke test for a running backend (dev SMS mode: codes are returned as devCode).
 *   API_URL=http://localhost:3007/graphql node e2e/api-smoke.mjs
 * Creates two throwaway members and removes everything it created at the end (needs MONGO_URL for cleanup,
 * default mongodb://localhost:27017/nestar; skipped when the mongodb driver is not installed).
 */
const API = process.env.API_URL ?? 'http://localhost:3007/graphql';
let failed = 0;
const created = { members: [] };

const gql = async (query, token, variables) => (await gqlWithCookie(query, token, variables)).json;

/** the refresh token travels only as the httpOnly `ma_refresh` cookie */
const gqlWithCookie = async (query, token, variables, cookie) => {
	const response = await fetch(API, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			...(token ? { authorization: `Bearer ${token}` } : {}),
			...(cookie ? { cookie } : {}),
		},
		body: JSON.stringify({ query, variables }),
	});
	const setCookie = response.headers.getSetCookie?.() ?? [];
	const refresh = setCookie.find((item) => item.startsWith('ma_refresh='));
	return { json: await response.json(), cookie: refresh ? refresh.split(';')[0] : undefined, setCookie };
};
const claims = (jwt) => JSON.parse(Buffer.from(String(jwt).split('.')[1] ?? '', 'base64url').toString() || '{}');
const check = (name, ok, extra = '') => {
	if (!ok) failed++;
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? `  (${extra})` : ''}`);
};
const error = (result) => result.errors?.[0]?.message ?? '';

const signup = async (prefix, type = 'USER') => {
	const phone = `99899${String(Date.now()).slice(-7)}`;
	const nick = `${prefix}${String(Date.now()).slice(-6)}`;
	const code = (await gql(`mutation{requestPhoneCode(input:{phone:"${phone}",purpose:SIGNUP}){devCode}}`)).data?.requestPhoneCode?.devCode;
	const { json: result, cookie, setCookie } = await gqlWithCookie(
		`mutation($i:MemberInput!){signup(input:$i){_id accessToken refreshToken}}`,
		null,
		{ i: { memberNick: nick, memberPassword: '12345', memberPhone: phone, verificationCode: code, memberType: type } },
	);
	const member = result.data?.signup;
	if (member) created.members.push(member._id);
	return { ...member, nick, phone, cookie, setCookie };
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
	check('signup with SMS code', !!seller.accessToken && !!seller.cookie);
	check('refresh token only in an httpOnly cookie', !seller.refreshToken && /HttpOnly/i.test(seller.setCookie.join(';')));
	check('access token carries no phone', !!claims(seller.accessToken)._id && !claims(seller.accessToken).memberPhone);
	check('getMe returns the profile', (await gql(`{getMe{memberPhone}}`, seller.accessToken)).data?.getMe?.memberPhone === seller.phone);

	// a member cannot give themselves admin rights or badges
	await gql(`mutation{updateMember(input:{_id:"${buyer._id}",memberAdminRole:SUPER,memberDealerVerified:true,memberDesc:"hi"}){_id}}`, buyer.accessToken);
	const buyerMe = (await gql(`{getMe{memberAdminRole memberDealerVerified memberDesc}}`, buyer.accessToken)).data?.getMe;
	check('updateMember ignores admin role and badges', buyerMe?.memberDesc === 'hi' && !buyerMe?.memberAdminRole && !buyerMe?.memberDealerVerified);
	const foreignAvatar = await gql(`mutation{updateMember(input:{_id:"${buyer._id}",memberImage:"uploads/property/someone-else.webp"}){_id}}`, buyer.accessToken);
	check('avatar must be an own upload', !!error(foreignAvatar));

	// login does not reveal whether an account exists
	const noUser = error(await gql(`mutation{login(input:{memberNick:"nobody${Date.now() % 1e6}",memberPassword:"wrong1"}){_id}}`));
	const badPass = error(await gql(`mutation{login(input:{memberNick:"${seller.nick}",memberPassword:"wrong1"}){_id}}`));
	check('same login error for unknown user and wrong password', noUser === badPass && /Wrong nickname/.test(noUser), noUser);

	// very deep queries are rejected
	const normal = await gql(`{getProperties(input:{page:1,limit:1,search:{}}){list{memberData{_id} meLiked{memberId}}}}`);
	check('normal nesting works', !error(normal), error(normal));
	const tooDeep = await gql(`{${'a{'.repeat(12)}b${'}'.repeat(12)}}`);
	check('too deep query is rejected', (tooDeep.errors ?? []).some((item) => /too deep/.test(item.message)));

	// login brute-force limit
	let last;
	for (let i = 0; i < 6; i++) last = await gql(`mutation{login(input:{memberNick:"${buyer.nick}",memberPassword:"wrong1"}){_id}}`);
	check('login is rate limited', /Too many attempts/.test(error(last)));

	// refresh token rotation (cookie)
	const refreshed = await gqlWithCookie(`mutation{refreshSession{accessToken refreshToken}}`, null, undefined, seller.cookie);
	check('refresh session', !!refreshed.json.data?.refreshSession?.accessToken && !!refreshed.cookie && refreshed.cookie !== seller.cookie);
	check('old refresh token is revoked', /expired/.test(error((await gqlWithCookie(`mutation{refreshSession{accessToken}}`, null, undefined, seller.cookie)).json)));
	const token = refreshed.json.data.refreshSession.accessToken;

	// moderation: first listing of a new seller waits for approval
	const car = await gql(
		`mutation{createProperty(input:{propertyType:SEDAN,carCountry:SOUTH_KOREA,propertyAddress:"Seoul",propertyTitle:"E2E Sonata",propertyPrice:15000,carBrand:HYUNDAI,carModel:"Sonata",carYear:2021,carMileage:40000,carFuel:PETROL,carTransmission:AUTOMATIC,carAccidentHistory:NONE,propertyImages:["uploads/property/x1.webp","uploads/property/x2.webp","uploads/property/x3.webp"]}){_id propertyStatus}}`,
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
	const sent = await gql(`mutation{sendMessage(input:{receiverId:"${seller._id}",propertyId:"${carId}",text:"Salom!",image:"https://evil.example/pixel.gif"}){conversationId image}}`, buyer.accessToken);
	check('buyer can message seller', !!sent.data?.sendMessage?.conversationId, error(sent));
	check('outside image URLs are dropped from messages', !sent.data?.sendMessage?.image);
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
