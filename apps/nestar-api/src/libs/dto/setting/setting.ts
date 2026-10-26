import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsOptional, Length } from 'class-validator';

@ObjectType()
export class SiteSettings {
	@Field(() => String, { nullable: true })
	supportPhone?: string;

	@Field(() => String, { nullable: true })
	supportEmail?: string;

	@Field(() => String, { nullable: true })
	telegramUrl?: string;

	@Field(() => String, { nullable: true })
	instagramUrl?: string;

	@Field(() => String, { nullable: true })
	facebookUrl?: string;
}

@InputType()
export class SiteSettingsInput {
	@IsOptional()
	@Length(0, 30)
	@Field(() => String, { nullable: true })
	supportPhone?: string;

	@IsOptional()
	@Length(0, 100)
	@Field(() => String, { nullable: true })
	supportEmail?: string;

	@IsOptional()
	@Length(0, 200)
	@Field(() => String, { nullable: true })
	telegramUrl?: string;

	@IsOptional()
	@Length(0, 200)
	@Field(() => String, { nullable: true })
	instagramUrl?: string;

	@IsOptional()
	@Length(0, 200)
	@Field(() => String, { nullable: true })
	facebookUrl?: string;
}
