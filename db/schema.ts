import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  real,
  jsonb,
  pgEnum,
  primaryKey,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

export const jobStatusEnum = pgEnum('job_status', ['Active', 'Archived', 'Draft']);
export const workModeEnum = pgEnum('work_mode', ['Remote', 'Hybrid', 'On-Site']);
export const userRoleEnum = pgEnum('user_role', [
  'SuperAdmin',
  'TenantAdmin',
  'RecruitmentLead',
  'HiringManager',
  'Recruiter',
]);

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  company: text('company').notNull(),
  region: text('region').notNull(),
  activeRoles: integer('active_roles').notNull().default(0),
  totalUsers: integer('total_users').notNull().default(0),
  status: text('status').notNull().default('Active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// NextAuth-compatible users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  role: userRoleEnum('role').notNull().default('Recruiter'),
  passwordHash: text('password_hash'),
  enabled: boolean('enabled').notNull().default(true),
  lifetimeCredits: integer('lifetime_credits').notNull().default(0),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// NextAuth accounts table
export const accounts = pgTable('accounts', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').$type<AdapterAccountType>().notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })]);

// NextAuth sessions table
export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

// NextAuth verification tokens
export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (table) => [primaryKey({ columns: [table.identifier, table.token] })]);

export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  code: text('code').notNull().unique(),
  title: text('title').notNull(),
  location: text('location').notNull().default('Remote'),
  workMode: workModeEnum('work_mode').notNull().default('Remote'),
  experience: text('experience'),
  contractDuration: text('contract_duration'),
  description: text('description'),
  status: jobStatusEnum('status').notNull().default('Active'),
  scored: integer('scored').notNull().default(0),
  processing: integer('processing').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rubricCompetencies = pgTable('rubric_competencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  level: text('level').notNull().default('IMPORTANT'),
  weight: real('weight').notNull().default(20),
  sortOrder: integer('sort_order').notNull().default(0),
  mandatory: boolean('mandatory').notNull().default(false),
});

export const candidates = pgTable('candidates', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull().default(''),
  email: text('email'),
  phone: text('phone'),
  currentRole: text('current_role'),
  location: text('location'),
  experience: text('experience'),
  status: text('status').notNull().default('processing'),
  score: integer('score'),
  tags: jsonb('tags').$type<string[]>().default([]),
  aiHead: text('ai_head'),
  aiReasoning: jsonb('ai_reasoning').$type<string[]>().default([]),
  capabilities: jsonb('capabilities').$type<{ label: string; note: string; w: number }[]>().default([]),
  gaps: jsonb('gaps').$type<{ label: string; note: string; w: number }[]>().default([]),
  evaluations: jsonb('evaluations').$type<{
    competency: string;
    level: string;
    weight_percentage: number;
    evidence_quote: string | null;
    competency_score_0_to_100: number;
    weighted_points_earned: number;
    reasoning: string;
  }[]>().default([]),
  fileName: text('file_name'),
  resumeText: text('resume_text'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const systemSettings = pgTable('system_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const authenticationLogs = pgTable('authentication_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  authMethod: text('auth_method').notNull(), // 'Email' | 'Google SSO'
  status: text('status').notNull(),           // 'Success' | 'Failed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
