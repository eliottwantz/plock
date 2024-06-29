import { serverEnv } from '$lib/env/server';
import { authProviderEnum, type Session, type User } from '$lib/db/schema';
import { db } from '$lib/server/db';
import { createId } from '@paralleldrive/cuid2';
import { GitHub, Google } from 'arctic';
import { Lucia, type Cookie } from 'lucia';
import { adapter } from '$lib/server/db';

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: serverEnv.ENV === 'PROD'
		}
	},
	getUserAttributes(databaseUserAttributes) {
		return databaseUserAttributes;
	},
	getSessionAttributes(databaseSessionAttributes) {
		return databaseSessionAttributes;
	}
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: User;
		DatabaseSessionAttributes: DatabaseSessionAttributes;
	}
	type DatabaseUserAttributes = User;
	type DatabaseSessionAttributes = Omit<Session, 'id' | 'user_id' | 'expires_at'>;
}

export const github = new GitHub(serverEnv.GITHUB_CLIENT_ID, serverEnv.GITHUB_CLIENT_SECRET);
export const google = new Google(
	serverEnv.GOOGLE_CLIENT_ID,
	serverEnv.GOOGLE_CLIENT_SECRET,
	serverEnv.GOOGLE_AUTH_CALLBACK_URL
);

export type LoginInfo = {
	providerId: string;
	name: string;
	email: string;
	picture?: string;
	ip: string | null;
	userAgent: string | null;
};
export const handleLogin = async (
	provider: (typeof authProviderEnum)[number],
	info: LoginInfo
): Promise<Cookie> => {
	const existingAccount = await db
		.selectFrom('account')
		.where('provider', '=', provider)
		.where('provider_user_id', '=', info.providerId)
		.selectAll()
		.executeTakeFirst();
	if (existingAccount) {
		const session = await lucia.createSession(existingAccount.user_id, {
			ip: info.ip,
			user_agent: info.userAgent,
			created_at: new Date()
		});
		const sessionCookie = lucia.createSessionCookie(session.id);
		return sessionCookie;
	} else {
		const existingUser = await db
			.selectFrom('user')
			.where('email', '=', info.email)
			.selectAll()
			.executeTakeFirst();

		let userId: string;
		if (!existingUser) {
			userId = createId();
			await db.transaction().execute(async (tx) => {
				await tx
					.insertInto('user')
					.values({
						id: userId,
						name: info.name,
						email: info.email,
						picture: info.picture,
						created_at: new Date(),
						updated_at: new Date()
					})
					.execute();

				await tx
					.insertInto('account')
					.values({
						provider,
						provider_user_id: info.providerId,
						user_id: userId,
						created_at: new Date(),
						updated_at: new Date()
					})
					.execute();
			});
		} else {
			userId = existingUser.id;
			await db
				.insertInto('account')
				.values({
					provider,
					provider_user_id: info.providerId,
					user_id: userId,
					created_at: new Date(),
					updated_at: new Date()
				})
				.execute();
		}

		const session = await lucia.createSession(userId, {
			ip: info.ip,
			user_agent: info.userAgent,
			created_at: new Date()
		});
		const sessionCookie = lucia.createSessionCookie(session.id);
		return sessionCookie;
	}
};
