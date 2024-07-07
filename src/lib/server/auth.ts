import { authProviderEnum, type Database, type User as DBUser, type Session } from '$lib/db/schema';
import { serverEnv } from '$lib/env/server';
import { adapter, db } from '$lib/server/db';
import { GitHub, Google } from 'arctic';
import type { Transaction } from 'kysely';
import { generateId, generateIdFromEntropySize, Lucia, type Cookie, type User } from 'lucia';
import { createDate, isWithinExpirationDate, TimeSpan } from 'oslo';
import { alphabet, generateRandomString, sha256 } from 'oslo/crypto';
import { encodeHex } from 'oslo/encoding';

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: serverEnv.ENV === 'PROD',
			domain: serverEnv.COOKIE_SUBDOMAIN
		}
	},
	getUserAttributes(databaseUserAttributes) {
		return {
			name: databaseUserAttributes.name,
			email: databaseUserAttributes.email,
			email_verified: databaseUserAttributes.email_verified,
			picture: databaseUserAttributes.picture,
			created_at: databaseUserAttributes.created_at,
			updated_at: databaseUserAttributes.updated_at
		};
	},
	getSessionAttributes(databaseSessionAttributes) {
		return databaseSessionAttributes;
	}
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: DatabaseUserAttributes;
		DatabaseSessionAttributes: DatabaseSessionAttributes;
	}
	type DatabaseUserAttributes = Omit<DBUser, 'password_hash'>;
	type DatabaseSessionAttributes = Omit<Session, 'id' | 'user_id' | 'expires_at'>;
}

export const github = new GitHub(serverEnv.GITHUB_CLIENT_ID, serverEnv.GITHUB_CLIENT_SECRET);
export const google = new Google(
	serverEnv.GOOGLE_CLIENT_ID,
	serverEnv.GOOGLE_CLIENT_SECRET,
	serverEnv.GOOGLE_AUTH_CALLBACK_URL
);

export type OauthLoginInfo = {
	providerId: string;
	name: string;
	email: string;
	picture?: string;
	ip: string | null;
	userAgent: string | null;
};
export const handleOauthLogin = async (
	provider: (typeof authProviderEnum)[number],
	info: OauthLoginInfo
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
			userId = generateIdFromEntropySize(10);
			await db.transaction().execute(async (tx) => {
				await tx
					.insertInto('user')
					.values({
						id: userId,
						name: info.name,
						email: info.email,
						email_verified: true,
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

export async function generateEmailVerificationCode(
	tx: Transaction<Database>,
	userId: string,
	email: string
): Promise<string> {
	const code = generateRandomString(8, alphabet('0-9'));
	await tx.deleteFrom('email_verification_code').where('user_id', '=', userId).execute();
	await tx
		.insertInto('email_verification_code')
		.values({
			id: generateId(11),
			user_id: userId,
			email,
			code,
			created_at: new Date(),
			expires_at: createDate(new TimeSpan(15, 'm')) // 15 minutes
		})
		.execute();
	return code;
}

export async function verifyVerificationCode(user: User, code: string): Promise<boolean> {
	const databaseCode = await db.transaction().execute(async (tx) => {
		const databaseCode = await tx
			.selectFrom('email_verification_code')
			.where('user_id', '=', user.id)
			.selectAll()
			.executeTakeFirst();
		if (!databaseCode || databaseCode.code !== code) {
			return false;
		}
		await tx.deleteFrom('email_verification_code').where('id', '=', databaseCode.id).execute();
		return databaseCode;
	});
	if (!databaseCode) return false;

	if (!isWithinExpirationDate(databaseCode.expires_at)) {
		return false;
	}
	if (databaseCode.email !== user.email) {
		return false;
	}
	return true;
}

export async function createPasswordResetToken(userId: string): Promise<string> {
	await db.deleteFrom('password_reset_token').where('user_id', '=', userId).execute();
	const tokenId = generateIdFromEntropySize(25); // 40 character
	const tokenHash = encodeHex(await sha256(new TextEncoder().encode(tokenId)));
	await db
		.insertInto('password_reset_token')
		.values({
			id: generateId(11),
			token_hash: tokenHash,
			user_id: userId,
			expires_at: createDate(new TimeSpan(2, 'h')),
			created_at: new Date()
		})
		.execute();
	return tokenId;
}
