import type { ColumnType, Selectable } from 'kysely';

export const authProviderEnum = ['google', 'github'] as const;
export const algorithmEnum = ['RS256', 'ES256'] as const;

export type Database = {
	user: UserTable;
	session: SessionTable;
	account: AccountTable;
	challenge: ChallengeTable;
	credential: CredentialTable;
};

type CreatedAt = ColumnType<Date, Date, never>;
type UpdatedAt = ColumnType<Date, Date, Date>;
type Timestamps = {
	created_at: CreatedAt;
	updated_at: UpdatedAt;
};

type UserTable = {
	id: string;
	name: string;
	email: string;
	picture: string | null;
} & Timestamps;
export type User = Selectable<UserTable>;

type SessionTable = {
	id: string;
	user_id: string;
	user_agent: string | null;
	ip: string | null;
	expires_at: number;
	created_at: CreatedAt;
};
export type Session = Selectable<SessionTable>;

type AccountTable = {
	provider: (typeof authProviderEnum)[number];
	provider_user_id: string;
	user_id: string;
} & Timestamps;

type ChallengeTable = {
	id: string;
	challenge: string;
	user_id: string | null;
	created_at: CreatedAt;
};

type CredentialTable = {
	id: string;
	user_id: string;
	name: string;
	public_key: string;
	algorithm: (typeof algorithmEnum)[number];
} & Timestamps;
