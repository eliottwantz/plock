import { env } from '$env/dynamic/private';
import {
	accountTable,
	authProviderEnum,
	selectUserSchema,
	sessionSchema,
	sessionTable,
	userTable,
	type User
} from '$lib/db/schema';
import { db } from '$lib/server/db';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { createId } from '@paralleldrive/cuid2';
import { GitHub, Google } from 'arctic';
import { type Cookie, Lucia } from 'lucia';
import { z } from 'zod';

const adapter = new DrizzleSQLiteAdapter(db, sessionTable, userTable);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: env.ENV === 'PROD'
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
	type DatabaseUserAttributes = z.infer<typeof selectUserSchema>;
	type DatabaseSessionAttributes = z.infer<typeof databaseSessionAttributes>;
}
const databaseSessionAttributes = sessionSchema.omit({
	id: true,
	userId: true,
	expiresAt: true
});

export const github = new GitHub(env.GITHUB_CLIENT_ID!, env.GITHUB_CLIENT_SECRET!);
export const google = new Google(
	env.GOOGLE_CLIENT_ID!,
	env.GOOGLE_CLIENT_SECRET!,
	env.GOOGLE_AUTH_CALLBACK_URL!
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
	const existingAccount = await db.query.accountTable.findFirst({
		where: (table, { and, eq }) =>
			and(eq(table.provider, provider), eq(table.providerUserId, info.providerId))
	});
	if (existingAccount) {
		const session = await lucia.createSession(existingAccount.userId, {
			createdAt: new Date(),
			ip: info.ip,
			userAgent: info.userAgent
		});
		const sessionCookie = lucia.createSessionCookie(session.id);
		return sessionCookie;
	} else {
		const existingUser = await db.query.userTable.findFirst({
			where: (table, { eq }) => eq(table.email, info.email)
		});

		let userId: string;
		if (!existingUser) {
			userId = createId();
			await db.transaction(async (tx) => {
				await tx.insert(userTable).values({
					id: userId,
					name: info.name,
					email: info.email,
					picture: info.picture
				});
				await tx.insert(accountTable).values({
					provider,
					providerUserId: info.providerId,
					userId
				});
			});
		} else {
			userId = existingUser.id;
			await db.insert(accountTable).values({
				provider,
				providerUserId: info.providerId,
				userId
			});
		}

		const session = await lucia.createSession(userId, {
			createdAt: new Date(),
			ip: info.ip,
			userAgent: info.userAgent
		});
		const sessionCookie = lucia.createSessionCookie(session.id);
		return sessionCookie;
	}
};
