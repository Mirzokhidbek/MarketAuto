import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
	return (
		<Html lang="en">
			<Head>
				<meta name="robots" content="index,follow" />
				<link rel="icon" type="image/svg+xml" href="/img/logo/favicon.svg" />

				{/* SEO */}
				<meta name="keyword" content={'marketauto, car marketplace, buy car uzbekistan, sell car, avtomobil, avto bozor, автомобили узбекистан'} />
				<meta
					name={'description'}
					content={
						'Buy and sell cars anywhere in Uzbekistan. New and used cars from trusted dealers and private sellers on MarketAuto | ' +
						"O'zbekistonda avtomobillarni oson soting va sotib oling. Ishonchli dilerlar va xususiy sotuvchilardan yangi va ishlatilgan avtomobillar | " +
						'Покупайте и продавайте автомобили по всему Узбекистану. Новые и подержанные автомобили от надежных дилеров на MarketAuto'
					}
				/>
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
