import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import MemberSchema from '../../schemas/Member.model';
import SessionSchema from '../../schemas/Session.model';

@Module({
	imports: [
		HttpModule,
		// read when the app starts (after .env is loaded), not when this file is imported
		JwtModule.registerAsync({
			useFactory: () => ({
				secret: process.env.SECRET_TOKEN,
				signOptions: { expiresIn: (process.env.ACCESS_TOKEN_TTL ?? '1h') as any },
			}),
		}),
		// the token is only proof of identity; status and role are always read from the database
		MongooseModule.forFeature([
			{ name: 'Member', schema: MemberSchema },
			{ name: 'Session', schema: SessionSchema },
		]),
	],
	providers: [AuthService],
	exports: [AuthService],
})
export class AuthModule {}
