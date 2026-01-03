import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sportTypes = ["society", "futsal", "campo"] as const;
export type SportType = (typeof sportTypes)[number];

export const organizationTypes = ["empresa", "escola", "gremio", "associacao", "clube"] as const;
export type OrganizationType = (typeof organizationTypes)[number];

export const leadStatuses = ["novo", "contato", "reuniao_agendada", "negociando", "convertido", "arquivado"] as const;
export type LeadStatus = (typeof leadStatuses)[number];

export const meetingStatuses = ["agendada", "concluida", "cancelada"] as const;
export type MeetingStatus = (typeof meetingStatuses)[number];

export const meetingTypes = ["virtual", "presencial"] as const;
export type MeetingType = (typeof meetingTypes)[number];

export const interactionTypes = ["email", "ligacao", "reuniao", "nota"] as const;
export type InteractionType = (typeof interactionTypes)[number];

export const contactInfoSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

export type ContactInfo = z.infer<typeof contactInfoSchema>;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sportType: text("sport_type").notNull().$type<SportType>(),
  orgType: text("org_type").notNull().$type<OrganizationType>(),
  description: text("description"),
  contactInfo: jsonb("contact_info").$type<ContactInfo>(),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
}).extend({
  sportType: z.enum(sportTypes),
  orgType: z.enum(organizationTypes),
  contactInfo: contactInfoSchema.optional(),
  tags: z.array(z.string()).optional(),
});

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull(),
  status: text("status").notNull().$type<LeadStatus>().default("novo"),
  priority: integer("priority").default(1),
  notes: text("notes"),
  lastContactedAt: timestamp("last_contacted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(leadStatuses).optional(),
  priority: z.number().min(1).max(5).optional(),
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

export const meetings = pgTable("meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull(),
  title: text("title").notNull(),
  meetingType: text("meeting_type").notNull().$type<MeetingType>(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  duration: integer("duration").default(60),
  location: text("location"),
  notes: text("notes"),
  status: text("status").notNull().$type<MeetingStatus>().default("agendada"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  createdAt: true,
}).extend({
  meetingType: z.enum(meetingTypes),
  status: z.enum(meetingStatuses).optional(),
  scheduledFor: z.string().or(z.date()),
  duration: z.number().min(15).max(480).optional(),
});

export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;

export const interactions = pgTable("interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull(),
  type: text("type").notNull().$type<InteractionType>(),
  subject: text("subject"),
  notes: text("notes"),
  occurredAt: timestamp("occurred_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInteractionSchema = createInsertSchema(interactions).omit({
  id: true,
  createdAt: true,
}).extend({
  type: z.enum(interactionTypes),
  occurredAt: z.string().or(z.date()).optional(),
});

export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type Interaction = typeof interactions.$inferSelect;

export type LeadWithOrganization = Lead & {
  organization: Organization;
};

export type MeetingWithLead = Meeting & {
  lead: LeadWithOrganization;
};

export interface DashboardMetrics {
  totalLeads: number;
  meetingsScheduled: number;
  conversionRate: number;
  newLeadsThisWeek: number;
}

export interface SearchFilters {
  query?: string;
  sportTypes?: SportType[];
  orgTypes?: OrganizationType[];
  statuses?: LeadStatus[];
  city?: string;
  state?: string;
}
