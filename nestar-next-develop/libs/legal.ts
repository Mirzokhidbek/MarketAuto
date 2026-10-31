import { SUPPORT_EMAIL, SUPPORT_PHONE } from './config';

/**
 * Terms of Use, Public Offer and Privacy Policy. Kept per language (not in common.json) because they are long.
 * Have them reviewed by a lawyer before the public launch and set the company details in .env
 * (NEXT_PUBLIC_LEGAL_NAME, NEXT_PUBLIC_LEGAL_INN, NEXT_PUBLIC_LEGAL_ADDRESS).
 */
type Section = { title: string; text: string[] };
export type LegalDoc = { title: string; updated: string; intro: string; sections: Section[] };

/** the company that operates the site, as it appears in the offer */
export const LEGAL_ENTITY = {
	name: process.env.NEXT_PUBLIC_LEGAL_NAME || 'CarPort',
	inn: process.env.NEXT_PUBLIC_LEGAL_INN || '',
	address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || '',
};

const details = (labels: { inn: string; address: string; phone: string; email: string }): string[] =>
	[
		LEGAL_ENTITY.name,
		LEGAL_ENTITY.inn && `${labels.inn}: ${LEGAL_ENTITY.inn}`,
		LEGAL_ENTITY.address && `${labels.address}: ${LEGAL_ENTITY.address}`,
		`${labels.phone}: ${SUPPORT_PHONE}`,
		`${labels.email}: ${SUPPORT_EMAIL}`,
	].filter((line): line is string => !!line);

const UPDATED = {
	uz: 'Oxirgi yangilanish: 2026-yil 31-oktyabr',
	ru: 'Последнее обновление: 31 октября 2026 г.',
	en: 'Last updated: 31 October 2026',
};

export const terms: Record<string, LegalDoc> = {
	uz: {
		title: 'Foydalanish shartlari',
		updated: UPDATED.uz,
		intro:
			'CarPort — avtomobil sotish eʼlonlari va chet eldan avtomobil olib kelish xarajatlarini hisoblash platformasi. Saytdan yoki mobil ilovadan foydalanish orqali siz ushbu shartlarga va Ommaviy ofertaga rozilik bildirasiz.',
		sections: [
			{
				title: '1. Platformaning roli',
				text: [
					'CarPort faqat eʼlonlarni joylash, qidirish va sotuvchi bilan bogʻlanish imkonini beradi. Biz avtomobil sotmaymiz, toʻlovlarni qabul qilmaymiz va bitim tomoni hisoblanmaymiz.',
					'Narx, toʻlov va topshirish shartlari xaridor va sotuvchi oʻrtasida toʻgʻridan-toʻgʻri kelishiladi.',
				],
			},
			{
				title: '2. Akkaunt',
				text: [
					'Roʻyxatdan oʻtishda telefon raqami SMS kod bilan yoki email manzili kod bilan tasdiqlanadi. Eʼlon joylash uchun tasdiqlangan telefon raqami majburiy.',
					'Bitta shaxs oʻz nomidan haqiqiy maʼlumotlar bilan akkaunt ochadi. Parol kamida 8 belgidan iborat boʻlishi, harf va raqam qatnashishi kerak.',
					'Parolingiz xavfsizligi uchun oʻzingiz javobgarsiz. Begona kirishni sezsangiz, Profil → Qurilmalar boʻlimida boshqa qurilmalardan chiqing va parolni oʻzgartiring.',
				],
			},
			{
				title: '3. Eʼlonlar',
				text: [
					'Eʼlonda faqat oʻzingizga tegishli yoki sotishga vakolatingiz bor avtomobil koʻrsatiladi. Yil, probeg, avariya tarixi, rastamojka va narx haqiqatga mos boʻlishi shart.',
					'Yangi sotuvchilarning birinchi eʼloni moderatsiyadan oʻtadi. Qoidalarga zid eʼlonlar ogohlantirishsiz oʻchirilishi mumkin.',
					'Bir avtomobilni bir necha marta joylash, boshqa birovning rasmlaridan foydalanish va reklama matnlari taqiqlanadi.',
				],
			},
			{
				title: '4. Import narxi hisobi',
				text: [
					'Chet eldagi avtomobil sahifasidagi «Oʻzbekistonga olib kelish narxi» — eʼlon maʼlumotlari, Markaziy bank kursi va platformadagi tarif asosida avtomatik hisoblangan taxminiy summa.',
					'U rasmiy bojxona hisob-kitobi emas. Aniq summa bojxona organlari tomonidan rasmiylashtirish vaqtida belgilanadi; xariddan oldin uni bojxona brokeri bilan tasdiqlang.',
				],
			},
			{
				title: '5. Taqiqlangan harakatlar',
				text: [
					'Firibgarlik, oldindan toʻlov soʻrash, soxta maʼlumot berish, haqorat, spam, boshqa akkauntlarga kirishga urinish va platforma ishiga xalaqit berish taqiqlanadi.',
					'Qoidabuzar akkauntlar bloklanadi; bloklangan foydalanuvchi eʼlon joylay olmaydi va xabar yubora olmaydi.',
				],
			},
			{
				title: '6. Javobgarlik',
				text: [
					'Avtomobilni sotib olishdan oldin uni va hujjatlarini shaxsan tekshiring, VIN raqamini solishtiring. Koʻrmagan avtomobilingiz uchun oldindan pul oʻtkazmang.',
					'CarPort foydalanuvchilar oʻrtasidagi bitimlar natijasi uchun javob bermaydi, lekin shikoyat qilingan eʼlonlarni tekshiradi.',
				],
			},
			{
				title: '7. Aloqa',
				text: [`Savollar va shikoyatlar: Yordam markazi → «Savol berish», ${SUPPORT_EMAIL}, ${SUPPORT_PHONE}.`],
			},
		],
	},
	ru: {
		title: 'Условия использования',
		updated: UPDATED.ru,
		intro:
			'CarPort — платформа объявлений о продаже автомобилей и расчёта стоимости ввоза автомобиля из-за рубежа. Пользуясь сайтом или мобильным приложением, вы соглашаетесь с этими условиями и Публичной офертой.',
		sections: [
			{
				title: '1. Роль платформы',
				text: [
					'CarPort только размещает объявления, помогает искать автомобили и связаться с продавцом. Мы не продаём автомобили, не принимаем платежи и не являемся стороной сделки.',
					'Цена, оплата и передача автомобиля согласуются напрямую между покупателем и продавцом.',
				],
			},
			{
				title: '2. Аккаунт',
				text: [
					'При регистрации номер телефона подтверждается SMS-кодом или email — кодом из письма. Для размещения объявлений нужен подтверждённый номер телефона.',
					'Аккаунт создаётся одним лицом с достоверными данными. Пароль — не менее 8 символов, буквы и цифры.',
					'Вы отвечаете за сохранность пароля. При подозрении на чужой вход выйдите на других устройствах (Профиль → Устройства) и смените пароль.',
				],
			},
			{
				title: '3. Объявления',
				text: [
					'Размещайте только свои автомобили или те, которые вы вправе продавать. Год, пробег, ДТП, растаможка и цена должны соответствовать действительности.',
					'Первое объявление нового продавца проходит модерацию. Объявления, нарушающие правила, могут быть удалены без предупреждения.',
					'Запрещены дубли, чужие фотографии и рекламные тексты.',
				],
			},
			{
				title: '4. Расчёт стоимости ввоза',
				text: [
					'«Стоимость ввоза в Узбекистан» на странице автомобиля из-за рубежа — ориентировочная сумма, рассчитанная автоматически по данным объявления, курсу ЦБ и тарифу платформы.',
					'Это не официальный таможенный расчёт. Точную сумму определяют таможенные органы при оформлении; перед покупкой уточните её у таможенного брокера.',
				],
			},
			{
				title: '5. Запрещено',
				text: [
					'Мошенничество, требование предоплаты, ложные сведения, оскорбления, спам, попытки входа в чужие аккаунты и вмешательство в работу платформы.',
					'Аккаунты нарушителей блокируются: заблокированный пользователь не может размещать объявления и писать сообщения.',
				],
			},
			{
				title: '6. Ответственность',
				text: [
					'Перед покупкой лично осмотрите автомобиль и документы, сверьте VIN. Не переводите деньги за автомобиль, который вы не видели.',
					'CarPort не отвечает за результат сделок между пользователями, но проверяет объявления, на которые пожаловались.',
				],
			},
			{
				title: '7. Связь',
				text: [`Вопросы и жалобы: Поддержка → «Задать вопрос», ${SUPPORT_EMAIL}, ${SUPPORT_PHONE}.`],
			},
		],
	},
	en: {
		title: 'Terms of Use',
		updated: UPDATED.en,
		intro:
			'CarPort is a marketplace for car sale listings with an estimate of the cost of importing a car from abroad. By using the website or the mobile app you agree to these terms and to the Public Offer.',
		sections: [
			{
				title: '1. Our role',
				text: [
					'CarPort only publishes listings, helps you search and contact sellers. We do not sell cars, take payments or act as a party to any deal.',
					'Price, payment and hand-over are agreed directly between the buyer and the seller.',
				],
			},
			{
				title: '2. Account',
				text: [
					'At sign-up you confirm a phone number with an SMS code or an email address with a code by email. Listing a car needs a confirmed phone number.',
					'One person opens one account with real information. Passwords have at least 8 characters with letters and digits.',
					'You are responsible for keeping your password safe. If you suspect someone else used your account, log out other devices (Profile → Devices) and change the password.',
				],
			},
			{
				title: '3. Listings',
				text: [
					'List only cars you own or are allowed to sell. Year, mileage, accident history, customs status and price must be true.',
					"A new seller's first listing is reviewed by our team. Listings that break the rules may be removed without notice.",
					"Duplicates, other people's photos and advertising texts are not allowed.",
				],
			},
			{
				title: '4. Import cost estimate',
				text: [
					'"Import cost to Uzbekistan" on the page of a car abroad is an estimate calculated automatically from the listing, the Central Bank rate and the platform tariff.',
					'It is not an official customs calculation. Customs set the exact amount at clearance; confirm it with a customs broker before you buy.',
				],
			},
			{
				title: '5. Not allowed',
				text: [
					'Fraud, asking for prepayment, false information, insults, spam, trying to get into other accounts and interfering with the platform.',
					'Accounts that break the rules are blocked; a blocked member cannot list cars or send messages.',
				],
			},
			{
				title: '6. Responsibility',
				text: [
					'Inspect the car and its documents in person and check the VIN before buying. Never send money for a car you have not seen.',
					'CarPort is not responsible for the outcome of deals between members, but reviews every reported listing.',
				],
			},
			{
				title: '7. Contact',
				text: [`Questions and complaints: Support Center → "Ask a question", ${SUPPORT_EMAIL}, ${SUPPORT_PHONE}.`],
			},
		],
	},
};

export const offer: Record<string, LegalDoc> = {
	uz: {
		title: 'Ommaviy oferta',
		updated: UPDATED.uz,
		intro: `Ushbu hujjat ${LEGAL_ENTITY.name} (keyingi oʻrinlarda — «Platforma») tomonidan CarPort sayti va mobil ilovasi xizmatlaridan foydalanish boʻyicha har qanday shaxsga qilingan ommaviy taklif (oferta) hisoblanadi.`,
		sections: [
			{
				title: '1. Umumiy qoidalar',
				text: [
					'Ushbu oferta Oʻzbekiston Respublikasi Fuqarolik kodeksining 367 va 369-moddalariga muvofiq ommaviy oferta hisoblanadi.',
					'Saytda yoki ilovada roʻyxatdan oʻtish, shuningdek xizmatlardan har qanday foydalanish ofertani toʻliq va soʻzsiz qabul qilish (aksept) hisoblanadi (Fuqarolik kodeksining 370-moddasi). Aksept qilingan paytdan Foydalanuvchi va Platforma oʻrtasida shartnoma tuzilgan hisoblanadi.',
					'Ofertaning ajralmas qismlari: Foydalanish shartlari va Maxfiylik siyosati.',
				],
			},
			{
				title: '2. Atamalar',
				text: [
					'Platforma — CarPort sayti, mobil ilovasi va ularning API xizmati.',
					'Foydalanuvchi — roʻyxatdan oʻtgan yoki xizmatlardan foydalanayotgan jismoniy yoki yuridik shaxs; Sotuvchi — eʼlon joylagan Foydalanuvchi; Xaridor — eʼlonlarni koʻrib, sotuvchi bilan bogʻlanayotgan Foydalanuvchi.',
					'Eʼlon — avtomobil sotish haqidagi maʼlumot, rasmlar va narx.',
				],
			},
			{
				title: '3. Shartnoma predmeti',
				text: [
					'Platforma Foydalanuvchiga quyidagi imkoniyatlarni beradi: eʼlon joylash va boshqarish, eʼlonlarni qidirish va saqlash, sotuvchiga xabar yozish, bildirishnomalar olish, avtomobilni Oʻzbekistonga olib kelish xarajatlarining taxminiy hisobini koʻrish.',
					'Hozirgi vaqtda xizmatlar bepul koʻrsatiladi. Pullik xizmatlar joriy etilsa, ularning narxi va shartlari oldindan eʼlon qilinadi va alohida tasdiqlanadi.',
				],
			},
			{
				title: '4. Tomonlarning huquq va majburiyatlari',
				text: [
					'Foydalanuvchi: haqiqiy maʼlumot beradi; faqat oʻziga tegishli yoki sotishga vakolati bor avtomobillarni joylaydi; Foydalanish shartlariga rioya qiladi; parolini sir saqlaydi.',
					'Platforma: xizmatlar ishlashini taʼminlashga harakat qiladi; shaxsga doir maʼlumotlarni qonunga muvofiq himoya qiladi; qoidalarga zid eʼlonlarni olib tashlash va qoidabuzar akkauntlarni bloklash huquqiga ega.',
					'Platforma texnik ishlar, yangilanishlar yoki oʻziga bogʻliq boʻlmagan sabablar (aloqa, elektr taʼminoti, uchinchi shaxs xizmatlari) tufayli xizmatlarni vaqtincha toʻxtatishi mumkin.',
				],
			},
			{
				title: '5. Javobgarlik',
				text: [
					'Platforma Foydalanuvchilar oʻrtasidagi bitimlar tomoni emas va ularning natijasi, avtomobil holati yoki eʼlondagi maʼlumotlarning toʻgʻriligi uchun javob bermaydi.',
					'Import narxi hisobi maʼlumot uchun beriladi va rasmiy bojxona hisob-kitobi oʻrnini bosmaydi.',
					'Tomonlarning javobgarligi Oʻzbekiston Respublikasi qonunchiligi bilan belgilanadi.',
				],
			},
			{
				title: '6. Shaxsga doir maʼlumotlar',
				text: [
					'Maʼlumotlar «Shaxsga doir maʼlumotlar toʻgʻrisida»gi Oʻzbekiston Respublikasi Qonuniga muvofiq Maxfiylik siyosatida koʻrsatilgan maqsadlarda qayta ishlanadi. Ofertani aksept qilib, Foydalanuvchi bunga rozilik beradi.',
				],
			},
			{
				title: '7. Nizolarni hal qilish',
				text: [
					'Nizolar avvalo muzokaralar yoʻli bilan hal qilinadi: shikoyatga 10 ish kuni ichida javob beriladi. Kelishuvga erishilmasa, nizo Oʻzbekiston Respublikasi sudlarida koʻrib chiqiladi.',
				],
			},
			{
				title: '8. Amal qilish muddati va oʻzgartirish',
				text: [
					'Oferta saytda eʼlon qilingan paytdan kuchga kiradi va bekor qilinguncha amal qiladi. Platforma ofertani oʻzgartirishi mumkin; yangi tahrir saytda eʼlon qilingan kundan kuchga kiradi.',
					'Foydalanuvchi istalgan vaqtda akkauntini oʻchirishni soʻrab, shartnomani bekor qilishi mumkin.',
				],
			},
			{
				title: '9. Rekvizitlar',
				text: details({ inn: 'STIR', address: 'Manzil', phone: 'Telefon', email: 'Email' }),
			},
		],
	},
	ru: {
		title: 'Публичная оферта',
		updated: UPDATED.ru,
		intro: `Настоящий документ является публичным предложением (офертой) ${LEGAL_ENTITY.name} (далее — «Платформа») любому лицу на использование сервисов сайта и мобильного приложения CarPort.`,
		sections: [
			{
				title: '1. Общие положения',
				text: [
					'Оферта является публичной в соответствии со статьями 367 и 369 Гражданского кодекса Республики Узбекистан.',
					'Регистрация на сайте или в приложении, а также любое использование сервисов означает полное и безоговорочное принятие оферты (акцепт, статья 370 ГК). С момента акцепта договор между Пользователем и Платформой считается заключённым.',
					'Неотъемлемые части оферты: Условия использования и Политика конфиденциальности.',
				],
			},
			{
				title: '2. Термины',
				text: [
					'Платформа — сайт CarPort, мобильное приложение и их API.',
					'Пользователь — физическое или юридическое лицо, зарегистрированное или использующее сервисы; Продавец — Пользователь, разместивший объявление; Покупатель — Пользователь, просматривающий объявления и связывающийся с продавцом.',
					'Объявление — сведения о продаже автомобиля, фотографии и цена.',
				],
			},
			{
				title: '3. Предмет договора',
				text: [
					'Платформа предоставляет Пользователю возможность: размещать и управлять объявлениями, искать и сохранять объявления, писать продавцу, получать уведомления, видеть ориентировочный расчёт стоимости ввоза автомобиля в Узбекистан.',
					'В настоящее время услуги бесплатны. При введении платных услуг их стоимость и условия объявляются заранее и принимаются отдельно.',
				],
			},
			{
				title: '4. Права и обязанности сторон',
				text: [
					'Пользователь: предоставляет достоверные данные; размещает только свои автомобили или те, которые вправе продавать; соблюдает Условия использования; хранит пароль в тайне.',
					'Платформа: обеспечивает работу сервисов; защищает персональные данные в соответствии с законом; вправе удалять объявления, нарушающие правила, и блокировать аккаунты нарушителей.',
					'Платформа может временно приостанавливать сервисы для технических работ, обновлений или по независящим от неё причинам (связь, электроснабжение, сервисы третьих лиц).',
				],
			},
			{
				title: '5. Ответственность',
				text: [
					'Платформа не является стороной сделок между Пользователями и не отвечает за их результат, состояние автомобиля и достоверность сведений в объявлениях.',
					'Расчёт стоимости ввоза носит справочный характер и не заменяет официальный таможенный расчёт.',
					'Ответственность сторон определяется законодательством Республики Узбекистан.',
				],
			},
			{
				title: '6. Персональные данные',
				text: [
					'Данные обрабатываются в соответствии с Законом Республики Узбекистан «О персональных данных» в целях, указанных в Политике конфиденциальности. Принимая оферту, Пользователь даёт на это согласие.',
				],
			},
			{
				title: '7. Разрешение споров',
				text: [
					'Споры решаются путём переговоров: ответ на претензию — в течение 10 рабочих дней. При недостижении согласия спор рассматривается судами Республики Узбекистан.',
				],
			},
			{
				title: '8. Срок действия и изменения',
				text: [
					'Оферта вступает в силу с момента публикации на сайте и действует до её отзыва. Платформа вправе изменять оферту; новая редакция действует со дня публикации.',
					'Пользователь может расторгнуть договор в любое время, запросив удаление аккаунта.',
				],
			},
			{
				title: '9. Реквизиты',
				text: details({ inn: 'ИНН', address: 'Адрес', phone: 'Телефон', email: 'Email' }),
			},
		],
	},
	en: {
		title: 'Public Offer',
		updated: UPDATED.en,
		intro: `This document is a public offer by ${LEGAL_ENTITY.name} (the "Platform") to any person to use the services of the CarPort website and mobile app.`,
		sections: [
			{
				title: '1. General',
				text: [
					'This offer is public under Articles 367 and 369 of the Civil Code of the Republic of Uzbekistan.',
					'Signing up on the website or in the app, or any use of the services, is full and unconditional acceptance of the offer (Article 370 of the Civil Code). From that moment a contract between the User and the Platform is concluded.',
					'The Terms of Use and the Privacy Policy are an integral part of this offer.',
				],
			},
			{
				title: '2. Terms',
				text: [
					'Platform — the CarPort website, mobile app and their API.',
					'User — a person or company that has signed up or uses the services; Seller — a User who posted a listing; Buyer — a User who views listings and contacts sellers.',
					'Listing — information about a car for sale, its photos and price.',
				],
			},
			{
				title: '3. Subject',
				text: [
					'The Platform lets the User post and manage listings, search and save listings, message sellers, receive notifications and see an estimate of the cost of importing a car to Uzbekistan.',
					'The services are free at present. If paid services are introduced, their price and terms are announced in advance and accepted separately.',
				],
			},
			{
				title: '4. Rights and obligations',
				text: [
					'The User gives true information, lists only cars they own or may sell, follows the Terms of Use and keeps the password secret.',
					'The Platform keeps the services running, protects personal data as the law requires, and may remove listings that break the rules and block accounts that do.',
					'The Platform may suspend the services for maintenance, updates or reasons outside its control (connectivity, power, third-party services).',
				],
			},
			{
				title: '5. Liability',
				text: [
					'The Platform is not a party to deals between Users and is not liable for their outcome, the condition of a car or the accuracy of listings.',
					'The import cost estimate is for information only and does not replace the official customs calculation.',
					'The liability of the parties is governed by the law of the Republic of Uzbekistan.',
				],
			},
			{
				title: '6. Personal data',
				text: [
					'Data is processed under the Law of the Republic of Uzbekistan "On Personal Data" for the purposes stated in the Privacy Policy. By accepting the offer the User consents to this.',
				],
			},
			{
				title: '7. Disputes',
				text: [
					'Disputes are first settled by negotiation: a complaint is answered within 10 working days. Otherwise the dispute goes to the courts of the Republic of Uzbekistan.',
				],
			},
			{
				title: '8. Term and changes',
				text: [
					'The offer takes effect when published on the website and remains in force until withdrawn. The Platform may change it; a new version applies from the day it is published.',
					'The User may end the contract at any time by asking to delete the account.',
				],
			},
			{
				title: '9. Company details',
				text: details({ inn: 'TIN', address: 'Address', phone: 'Phone', email: 'Email' }),
			},
		],
	},
};

export const privacy: Record<string, LegalDoc> = {
	uz: {
		title: 'Maxfiylik siyosati',
		updated: UPDATED.uz,
		intro: 'Ushbu siyosat CarPort qanday maʼlumot toʻplashi va undan qanday foydalanishini tushuntiradi.',
		sections: [
			{
				title: '1. Qanday maʼlumot toʻplaymiz',
				text: [
					'Akkaunt: nik, telefon raqami va/yoki email, parol (faqat shifrlangan holda), ixtiyoriy ism, manzil, rasm va tavsif.',
					'Eʼlonlar, rasmlar, izohlar, maqolalar va shaxsiy xabarlar.',
					'Xavfsizlik uchun texnik maʼlumot: IP manzil (urinishlarni cheklash uchun) va brauzer turi (kirilgan qurilmalar roʻyxati va yangi qurilmadan kirish haqida ogohlantirish uchun).',
				],
			},
			{
				title: '2. Nima uchun foydalanamiz',
				text: [
					'Akkauntni yaratish va telefon yoki emailni tasdiqlash, eʼlonlarni koʻrsatish, xaridor va sotuvchini bogʻlash, firibgarlikka qarshi kurash, bildirishnomalar va xavfsizlik xatlari (yangi qurilmadan kirish, parol oʻzgarishi) yuborish.',
				],
			},
			{
				title: '3. Kim koʻradi',
				text: [
					'Profilingiz (nik, ism, rasm) va eʼlonlaringiz hammaga ochiq. Telefon raqamingiz xaridor «Telefonni koʻrsatish» tugmasini bosganda koʻrinadi. Emailingiz boshqa foydalanuvchilarga koʻrsatilmaydi.',
					'Shaxsiy xabarlarni faqat suhbat ishtirokchilari koʻradi. SMS kodlar SMS provayder (Eskiz.uz yoki Twilio), email xatlar pochta xizmati orqali yuboriladi.',
					'Maʼlumotlaringizni sotmaymiz va reklama uchun uchinchi shaxslarga bermaymiz.',
				],
			},
			{
				title: '4. Saqlash va oʻchirish',
				text: [
					'Oʻzbekiston Respublikasi fuqarolarining shaxsga doir maʼlumotlari qonun talabiga muvofiq Oʻzbekiston hududidagi serverlarda saqlanadi.',
					'Maʼlumotlar akkaunt faol boʻlgan davrda saqlanadi. Tasdiqlash kodlari 5 daqiqada, eski seanslar 30 kunda avtomatik oʻchiriladi.',
					'Akkauntni oʻchirish yoki maʼlumotlaringiz nusxasini olish uchun Yordam markazi → «Savol berish» orqali soʻrov yuboring.',
				],
			},
			{
				title: '5. Brauzer xotirasi',
				text: [
					'Qisqa muddatli kirish tokeni, tanlangan til, valyuta va taqqoslash roʻyxati brauzeringiz xotirasida (localStorage) saqlanadi. Seansni yangilash tokeni faqat httpOnly cookie’da saqlanadi. Reklama cookie’laridan foydalanmaymiz.',
				],
			},
		],
	},
	ru: {
		title: 'Политика конфиденциальности',
		updated: UPDATED.ru,
		intro: 'Эта политика объясняет, какие данные собирает CarPort и как их использует.',
		sections: [
			{
				title: '1. Какие данные мы собираем',
				text: [
					'Аккаунт: никнейм, телефон и/или email, пароль (только в зашифрованном виде), по желанию имя, адрес, фото и описание.',
					'Объявления, фотографии, комментарии, статьи и личные сообщения.',
					'Технические данные для безопасности: IP-адрес (для ограничения попыток входа) и тип браузера (для списка устройств и уведомления о входе с нового устройства).',
				],
			},
			{
				title: '2. Зачем',
				text: [
					'Создание аккаунта и подтверждение телефона или email, показ объявлений, связь покупателя с продавцом, борьба с мошенничеством, отправка уведомлений и писем безопасности (вход с нового устройства, смена пароля).',
				],
			},
			{
				title: '3. Кто видит данные',
				text: [
					'Профиль (никнейм, имя, фото) и объявления видны всем. Телефон показывается, когда покупатель нажимает «Показать телефон». Email другим пользователям не показывается.',
					'Личные сообщения видят только участники диалога. SMS-коды отправляются через SMS-провайдера (Eskiz.uz или Twilio), письма — через почтовый сервис.',
					'Мы не продаём данные и не передаём их третьим лицам для рекламы.',
				],
			},
			{
				title: '4. Хранение и удаление',
				text: [
					'Персональные данные граждан Республики Узбекистан хранятся на серверах на территории Узбекистана, как того требует закон.',
					'Данные хранятся, пока аккаунт активен. Коды подтверждения удаляются через 5 минут, старые сеансы — через 30 дней.',
					'Чтобы удалить аккаунт или получить копию своих данных, отправьте запрос: Поддержка → «Задать вопрос».',
				],
			},
			{
				title: '5. Хранилище браузера',
				text: [
					'Короткоживущий токен входа, язык, валюта и список сравнения хранятся в localStorage браузера. Токен обновления сеанса хранится только в httpOnly cookie. Рекламные cookie мы не используем.',
				],
			},
		],
	},
	en: {
		title: 'Privacy Policy',
		updated: UPDATED.en,
		intro: 'This policy explains what data CarPort collects and how it is used.',
		sections: [
			{
				title: '1. What we collect',
				text: [
					'Account: nickname, phone number and/or email, password (stored only as a hash), optional name, address, photo and description.',
					'Listings, photos, comments, articles and private messages.',
					'Security data: IP address (to limit login attempts) and browser type (for the list of devices and alerts about logins from a new device).',
				],
			},
			{
				title: '2. Why',
				text: [
					'To create your account and confirm your phone or email, show listings, connect buyers with sellers, fight fraud, and send notifications and security emails (login from a new device, password change).',
				],
			},
			{
				title: '3. Who can see it',
				text: [
					'Your profile (nickname, name, photo) and listings are public. Your phone number is shown when a buyer presses "Show phone number". Your email is never shown to other members.',
					'Private messages are visible only to the two people in the conversation. SMS codes go through an SMS provider (Eskiz.uz or Twilio), emails through a mail service.',
					'We do not sell your data or share it with third parties for advertising.',
				],
			},
			{
				title: '4. Storage and deletion',
				text: [
					'Personal data of citizens of Uzbekistan is stored on servers in Uzbekistan, as the law requires.',
					'Data is kept while your account is active. Confirmation codes are deleted after 5 minutes and old sessions after 30 days.',
					'To delete your account or get a copy of your data, send a request in Support Center → "Ask a question".',
				],
			},
			{
				title: '5. Browser storage',
				text: [
					'A short-lived login token, your language, currency and comparison list are kept in your browser (localStorage). The session refresh token is kept only in an httpOnly cookie. We do not use advertising cookies.',
				],
			},
		],
	},
};
