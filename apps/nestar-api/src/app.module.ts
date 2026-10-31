import { settings } from './libs/env';
import * as Sentry from '@sentry/node';
import { Message } from './libs/enums/common.enum';
import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppResolver } from './app.resolver';
import { ComponentsModule } from './components/components.module';
import { DatabaseModule } from './database/database.module';
import { GraphqlErrorShape } from './libs/types/common';
import { SocketModule } from './socket/socket.module';
import { depthLimit, MAX_QUERY_DEPTH } from './libs/graphql-depth-limit';
import { costLimit } from './libs/graphql-cost-limit';
import { graphqlErrors, routeLabels } from './libs/observability/metrics';
import { currentRequest } from './libs/observability/request-context';

const graphqlLogger = new Logger('GraphQL');

@Module({
	imports: [
		ConfigModule.forRoot(),
		GraphQLModule.forRoot<ApolloDriverConfig>({
			driver: ApolloDriver,
			// the GraphQL IDE and schema introspection are for development only
			graphiql: !settings.production,
			introspection: !settings.production,
			autoSchemaFile: true,
			validationRules: [depthLimit(MAX_QUERY_DEPTH), costLimit()],
			// res is needed to set/clear the refresh-token cookie
			context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
			formatError: (error: GraphqlErrorShape) => {
				// class-validator puts the real reasons ("Please add at least 3 photos") into originalError.message
				const original: any = (error?.extensions as any)?.originalError?.message;
				const validation = Array.isArray(original) ? original[0] : undefined;
				const graphqlFormattedError = {
					message:
						validation ||
						error?.extensions?.exception?.response?.message ||
						error?.extensions?.response?.message ||
						error?.message,
					extensions: {
						code: error?.extensions?.code,
					},
				};
				// expected business errors (validation, wrong password...) carry a known message; log and report the rest
				const known = (Object.values(Message) as string[]).includes(String(graphqlFormattedError.message));
				graphqlErrors.inc({
					route: routeLabels.of(currentRequest()?.route ?? 'unknown'),
					code: String(graphqlFormattedError.extensions.code ?? 'UNKNOWN'),
				});
				if (!known) graphqlLogger.warn(`${graphqlFormattedError.extensions.code}: ${graphqlFormattedError.message}`);
				if (settings.sentryDsn && !known && graphqlFormattedError.extensions.code === 'INTERNAL_SERVER_ERROR')
					Sentry.captureException(error);
				return graphqlFormattedError;
			},
		}),
		ComponentsModule,
		DatabaseModule,
		SocketModule,
	],
	controllers: [AppController],
	providers: [AppService, AppResolver],
})
export class AppModule {}
