/**
 * Terms of Use and Privacy Policy texts. Kept per language (not in common.json) because they are long.
 * Have them reviewed by a lawyer before the public launch.
 */
type Section = { title: string; text: string[] };
type LegalDoc = { updated: string; intro: string; sections: Section[] };

export const terms: Record<string, LegalDoc> = {
	uz: {
		updated: 'Oxirgi yangilanish: 2026-yil oktyabr',
		intro:
			"MarketAuto — avtomobil sotish e'lonlari platformasi. Saytdan foydalanish orqali siz quyidagi shartlarga rozilik bildirasiz.",
		sections: [
			{
				title: '1. Platformaning roli',
				text: [
					"MarketAuto faqat e'lonlarni joylash va sotuvchi bilan bog'lanish imkonini beradi. Biz avtomobil sotmaymiz, to'lovlarni qabul qilmaymiz va bitim tomoni hisoblanmaymiz.",
					"Narx, to'lov va topshirish shartlari xaridor va sotuvchi o'rtasida to'g'ridan-to'g'ri kelishiladi.",
				],
			},
			{
				title: "2. Akkaunt",
				text: [
					"Ro'yxatdan o'tishda telefon raqami SMS kod bilan tasdiqlanadi. Bitta odam o'z nomidan haqiqiy ma'lumotlar bilan akkaunt ochadi.",
					"Parolingiz xavfsizligi uchun o'zingiz javobgarsiz. Akkauntdan begona foydalanilganini sezsangiz, darhol parolni o'zgartiring va bizga yozing.",
				],
			},
			{
				title: "3. E'lonlar",
				text: [
					"E'londa faqat o'zingizga tegishli yoki sotishga vakolatingiz bor avtomobil ko'rsatiladi. Ma'lumotlar (yil, probeg, avariya tarixi, rastamojka, narx) haqiqatga mos bo'lishi shart.",
					"Yangi sotuvchilarning birinchi e'loni moderatsiyadan o'tadi. Qoidalarga zid e'lonlar ogohlantirishsiz o'chirilishi mumkin.",
					"Bir avtomobilni bir necha marta joylash, boshqa birovning rasmlaridan foydalanish va reklama matnlari taqiqlanadi.",
				],
			},
			{
				title: '4. Taqiqlangan harakatlar',
				text: [
					"Firibgarlik, oldindan to'lov so'rash, soxta ma'lumot berish, haqorat va spam yuborish taqiqlanadi.",
					"Qoidabuzar akkauntlar bloklanadi; bloklangan foydalanuvchi e'lon joylay olmaydi va xabar yubora olmaydi.",
				],
			},
			{
				title: "5. Javobgarlik",
				text: [
					"Avtomobilni sotib olishdan oldin uni va hujjatlarini shaxsan tekshiring, VIN raqamini solishtiring. Ko'rmagan avtomobilingiz uchun oldindan pul o'tkazmang.",
					"MarketAuto foydalanuvchilar o'rtasidagi bitimlar natijasi uchun javob bermaydi, lekin shikoyat qilingan e'lonlarni tekshiradi.",
				],
			},
			{
				title: "6. Aloqa",
				text: ["Savollar va shikoyatlar uchun: Yordam markazi → «Savol berish»."],
			},
		],
	},
	ru: {
		updated: 'Последнее обновление: октябрь 2026 г.',
		intro: 'MarketAuto — платформа объявлений о продаже автомобилей. Пользуясь сайтом, вы соглашаетесь с этими условиями.',
		sections: [
			{
				title: '1. Роль платформы',
				text: [
					'MarketAuto только размещает объявления и помогает связаться с продавцом. Мы не продаём автомобили, не принимаем платежи и не являемся стороной сделки.',
					'Цена, оплата и передача автомобиля согласуются напрямую между покупателем и продавцом.',
				],
			},
			{
				title: '2. Аккаунт',
				text: [
					'При регистрации номер телефона подтверждается SMS-кодом. Аккаунт создаётся с достоверными данными.',
					'Вы отвечаете за сохранность пароля. При подозрении на чужой вход смените пароль и напишите нам.',
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
				title: '4. Запрещено',
				text: [
					'Мошенничество, требование предоплаты, ложные сведения, оскорбления и спам.',
					'Аккаунты нарушителей блокируются: заблокированный пользователь не может размещать объявления и писать сообщения.',
				],
			},
			{
				title: '5. Ответственность',
				text: [
					'Перед покупкой лично осмотрите автомобиль и документы, сверьте VIN. Не переводите деньги за автомобиль, который вы не видели.',
					'MarketAuto не отвечает за результат сделок между пользователями, но проверяет объявления, на которые пожаловались.',
				],
			},
			{ title: '6. Связь', text: ['Вопросы и жалобы: Поддержка → «Задать вопрос».'] },
		],
	},
	en: {
		updated: 'Last updated: October 2026',
		intro: 'MarketAuto is a marketplace for car sale listings. By using the site you agree to these terms.',
		sections: [
			{
				title: '1. Our role',
				text: [
					'MarketAuto only publishes listings and helps buyers contact sellers. We do not sell cars, take payments or act as a party to any deal.',
					'Price, payment and hand-over are agreed directly between the buyer and the seller.',
				],
			},
			{
				title: '2. Account',
				text: [
					'Your phone number is confirmed with an SMS code at sign-up. Accounts must use real information.',
					'You are responsible for keeping your password safe. If you suspect someone else used your account, change the password and contact us.',
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
				title: '4. Not allowed',
				text: [
					'Fraud, asking for prepayment, false information, insults and spam.',
					'Accounts that break the rules are blocked; a blocked member cannot list cars or send messages.',
				],
			},
			{
				title: '5. Responsibility',
				text: [
					'Inspect the car and its documents in person and check the VIN before buying. Never send money for a car you have not seen.',
					'MarketAuto is not responsible for the outcome of deals between members, but reviews every reported listing.',
				],
			},
			{ title: '6. Contact', text: ['Questions and complaints: Support Center → "Ask a question".'] },
		],
	},
};

export const privacy: Record<string, LegalDoc> = {
	uz: {
		updated: 'Oxirgi yangilanish: 2026-yil oktyabr',
		intro: "Ushbu siyosat MarketAuto qanday ma'lumot to'plashi va undan qanday foydalanishini tushuntiradi.",
		sections: [
			{
				title: "1. Qanday ma'lumot to'playmiz",
				text: [
					"Akkaunt: nik, telefon raqami, parol (faqat shifrlangan holda), ixtiyoriy ism, manzil, rasm va tavsif.",
					"E'lonlar, rasmlar, izohlar, maqolalar va shaxsiy xabarlar.",
					"Xavfsizlik uchun texnik ma'lumot: IP manzil (urinishlarni cheklash uchun) va brauzer turi (seanslarni boshqarish uchun).",
				],
			},
			{
				title: "2. Nima uchun foydalanamiz",
				text: [
					"Akkauntni yaratish va telefon raqamini tasdiqlash, e'lonlarni ko'rsatish, xaridor va sotuvchini bog'lash, firibgarlikka qarshi kurash va bildirishnomalar yuborish.",
				],
			},
			{
				title: "3. Kim ko'radi",
				text: [
					"Profilingiz (nik, ism, rasm) va e'lonlaringiz hammaga ochiq. Telefon raqamingiz xaridor «Telefonni ko'rsatish» tugmasini bosganda ko'rinadi.",
					"Shaxsiy xabarlarni faqat suhbat ishtirokchilari ko'radi. SMS kodlar SMS provayder (Eskiz.uz yoki Twilio) orqali yuboriladi.",
					"Ma'lumotlaringizni sotmaymiz va reklama uchun uchinchi shaxslarga bermaymiz.",
				],
			},
			{
				title: "4. Saqlash va o'chirish",
				text: [
					"Ma'lumotlar akkaunt faol bo'lgan davrda saqlanadi. SMS kodlar 5 daqiqada, eski seanslar 30 kunda avtomatik o'chiriladi.",
					"Akkauntni o'chirish uchun Yordam markazi → «Savol berish» orqali so'rov yuboring.",
				],
			},
			{
				title: '5. Brauzer xotirasi',
				text: [
					"Tizimga kirish tokeni, tanlangan til, valyuta va taqqoslash ro'yxati brauzeringiz xotirasida (localStorage) saqlanadi. Reklama cookie'laridan foydalanmaymiz.",
				],
			},
		],
	},
	ru: {
		updated: 'Последнее обновление: октябрь 2026 г.',
		intro: 'Эта политика объясняет, какие данные собирает MarketAuto и как их использует.',
		sections: [
			{
				title: '1. Какие данные мы собираем',
				text: [
					'Аккаунт: никнейм, телефон, пароль (только в зашифрованном виде), по желанию имя, адрес, фото и описание.',
					'Объявления, фотографии, комментарии, статьи и личные сообщения.',
					'Технические данные для безопасности: IP-адрес (для ограничения попыток входа) и тип браузера (для управления сеансами).',
				],
			},
			{
				title: '2. Зачем',
				text: [
					'Создание аккаунта и подтверждение телефона, показ объявлений, связь покупателя с продавцом, борьба с мошенничеством и отправка уведомлений.',
				],
			},
			{
				title: '3. Кто видит данные',
				text: [
					'Профиль (никнейм, имя, фото) и объявления видны всем. Телефон показывается, когда покупатель нажимает «Показать телефон».',
					'Личные сообщения видят только участники диалога. SMS-коды отправляются через SMS-провайдера (Eskiz.uz или Twilio).',
					'Мы не продаём данные и не передаём их третьим лицам для рекламы.',
				],
			},
			{
				title: '4. Хранение и удаление',
				text: [
					'Данные хранятся, пока аккаунт активен. SMS-коды удаляются через 5 минут, старые сеансы — через 30 дней.',
					'Чтобы удалить аккаунт, отправьте запрос: Поддержка → «Задать вопрос».',
				],
			},
			{
				title: '5. Хранилище браузера',
				text: [
					'Токен входа, выбранный язык, валюта и список сравнения хранятся в localStorage вашего браузера. Рекламные cookie мы не используем.',
				],
			},
		],
	},
	en: {
		updated: 'Last updated: October 2026',
		intro: 'This policy explains what data MarketAuto collects and how it is used.',
		sections: [
			{
				title: '1. What we collect',
				text: [
					'Account: nickname, phone number, password (stored only as a hash), optional name, address, photo and description.',
					'Listings, photos, comments, articles and private messages.',
					'Security data: IP address (to limit login attempts) and browser type (to manage sessions).',
				],
			},
			{
				title: '2. Why',
				text: [
					'To create your account and confirm your phone, show listings, connect buyers with sellers, fight fraud and send notifications.',
				],
			},
			{
				title: '3. Who can see it',
				text: [
					'Your profile (nickname, name, photo) and listings are public. Your phone number is shown when a buyer presses "Show phone number".',
					'Private messages are visible only to the two people in the conversation. SMS codes are sent through an SMS provider (Eskiz.uz or Twilio).',
					'We do not sell your data or share it with third parties for advertising.',
				],
			},
			{
				title: '4. Storage and deletion',
				text: [
					'Data is kept while your account is active. SMS codes are deleted after 5 minutes and old sessions after 30 days.',
					'To delete your account, send a request in Support Center → "Ask a question".',
				],
			},
			{
				title: '5. Browser storage',
				text: [
					'Your login token, language, currency and comparison list are kept in your browser (localStorage). We do not use advertising cookies.',
				],
			},
		],
	},
};
