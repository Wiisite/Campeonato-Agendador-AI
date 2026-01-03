import { randomUUID } from "crypto";
import type {
  User,
  InsertUser,
  Organization,
  InsertOrganization,
  Lead,
  InsertLead,
  Meeting,
  InsertMeeting,
  Interaction,
  InsertInteraction,
  LeadWithOrganization,
  MeetingWithLead,
  DashboardMetrics,
  SearchFilters,
  LeadStatus,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getOrganizations(filters?: SearchFilters): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, org: Partial<InsertOrganization>): Promise<Organization | undefined>;
  deleteOrganization(id: string): Promise<boolean>;

  getLeads(filters?: { status?: LeadStatus; limit?: number }): Promise<LeadWithOrganization[]>;
  getLead(id: string): Promise<LeadWithOrganization | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<boolean>;

  getMeetings(filters?: { status?: string; limit?: number }): Promise<MeetingWithLead[]>;
  getMeeting(id: string): Promise<MeetingWithLead | undefined>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: string, meeting: Partial<InsertMeeting>): Promise<Meeting | undefined>;
  deleteMeeting(id: string): Promise<boolean>;

  getInteractions(leadId: string): Promise<Interaction[]>;
  createInteraction(interaction: InsertInteraction): Promise<Interaction>;

  getDashboardMetrics(): Promise<DashboardMetrics>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private organizations: Map<string, Organization>;
  private leads: Map<string, Lead>;
  private meetings: Map<string, Meeting>;
  private interactions: Map<string, Interaction>;

  constructor() {
    this.users = new Map();
    this.organizations = new Map();
    this.leads = new Map();
    this.meetings = new Map();
    this.interactions = new Map();

    this.seedData();
  }

  private seedData() {
    const sampleOrganizations: InsertOrganization[] = [
      {
        name: "Liga Society São Paulo",
        sportType: "society",
        orgType: "associacao",
        description: "Liga de futebol society com mais de 50 times participantes",
        contactInfo: {
          email: "contato@ligasocietysp.com.br",
          phone: "(11) 98765-4321",
          city: "São Paulo",
          state: "SP",
          address: "Av. Paulista, 1000",
        },
        tags: ["liga", "society", "campeonato"],
      },
      {
        name: "Escola de Futebol Campeões",
        sportType: "campo",
        orgType: "escola",
        description: "Escola de formação de atletas com categorias de base",
        contactInfo: {
          email: "escolacampeoes@gmail.com",
          phone: "(21) 99876-5432",
          city: "Rio de Janeiro",
          state: "RJ",
          address: "Rua das Laranjeiras, 500",
        },
        tags: ["escola", "formação", "base"],
      },
      {
        name: "Grêmio Esportivo Industrial",
        sportType: "futsal",
        orgType: "gremio",
        description: "Grêmio de funcionários com time de futsal",
        contactInfo: {
          email: "gremio.industrial@empresa.com",
          phone: "(31) 97654-3210",
          city: "Belo Horizonte",
          state: "MG",
          address: "Av. Afonso Pena, 2000",
        },
        tags: ["grêmio", "empresa", "futsal"],
      },
      {
        name: "Clube Atlético Metropolitano",
        sportType: "campo",
        orgType: "clube",
        description: "Clube tradicional com times amadores de futebol de campo",
        contactInfo: {
          email: "secretaria@cammetropolitano.com.br",
          phone: "(41) 3333-4444",
          city: "Curitiba",
          state: "PR",
          address: "Rua XV de Novembro, 700",
        },
        tags: ["clube", "tradicional", "amador"],
      },
      {
        name: "Campeonato Empresarial ABC",
        sportType: "society",
        orgType: "empresa",
        description: "Campeonato entre empresas da região do ABC paulista",
        contactInfo: {
          email: "campeonatoabc@gmail.com",
          phone: "(11) 4444-5555",
          city: "Santo André",
          state: "SP",
          address: "Av. Industrial, 1500",
        },
        tags: ["empresarial", "society", "abc"],
      },
      {
        name: "Associação Futsal Catarinense",
        sportType: "futsal",
        orgType: "associacao",
        description: "Federação regional de futsal com mais de 100 times filiados",
        contactInfo: {
          email: "contato@futsalsc.org.br",
          phone: "(48) 3232-1010",
          city: "Florianópolis",
          state: "SC",
          address: "Rua Bocaiúva, 2100",
        },
        tags: ["federação", "futsal", "catarinense"],
      },
      {
        name: "Escola Técnica Bola de Ouro",
        sportType: "campo",
        orgType: "escola",
        description: "Centro de treinamento técnico para jovens atletas",
        contactInfo: {
          email: "boladeouro@escola.com.br",
          phone: "(51) 3030-2020",
          city: "Porto Alegre",
          state: "RS",
          address: "Av. Borges de Medeiros, 1700",
        },
        tags: ["escola", "técnica", "treinamento"],
      },
      {
        name: "Grêmio Recreativo Amigos do Bairro",
        sportType: "society",
        orgType: "gremio",
        description: "Time amador de society do bairro, jogos aos finais de semana",
        contactInfo: {
          email: "amigosdobairro@hotmail.com",
          phone: "(85) 99999-8888",
          city: "Fortaleza",
          state: "CE",
          address: "Rua do Sol, 300",
        },
        tags: ["amador", "bairro", "fins de semana"],
      },
    ];

    sampleOrganizations.forEach((org) => {
      const id = randomUUID();
      this.organizations.set(id, {
        ...org,
        id,
        createdAt: new Date(),
      } as Organization);
    });

    const orgIds = Array.from(this.organizations.keys());
    const sampleLeads = [
      { organizationId: orgIds[0], status: "novo" as LeadStatus, priority: 3 },
      { organizationId: orgIds[1], status: "contato" as LeadStatus, priority: 4 },
      { organizationId: orgIds[2], status: "reuniao_agendada" as LeadStatus, priority: 5 },
      { organizationId: orgIds[3], status: "negociando" as LeadStatus, priority: 4 },
      { organizationId: orgIds[4], status: "novo" as LeadStatus, priority: 2 },
    ];

    sampleLeads.forEach((lead) => {
      const id = randomUUID();
      this.leads.set(id, {
        ...lead,
        id,
        notes: null,
        lastContactedAt: lead.status !== "novo" ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      } as Lead);
    });

    const leadIds = Array.from(this.leads.keys());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    dayAfter.setHours(14, 30, 0, 0);

    const sampleMeetings = [
      {
        leadId: leadIds[2],
        title: "Apresentação do Sistema",
        meetingType: "virtual" as const,
        scheduledFor: tomorrow,
        duration: 60,
        location: "Google Meet",
        notes: "Primeira apresentação do sistema de gestão",
        status: "agendada" as const,
      },
      {
        leadId: leadIds[3],
        title: "Negociação de Contrato",
        meetingType: "presencial" as const,
        scheduledFor: dayAfter,
        duration: 90,
        location: "Escritório central",
        notes: "Discussão dos termos do contrato",
        status: "agendada" as const,
      },
    ];

    sampleMeetings.forEach((meeting) => {
      const id = randomUUID();
      this.meetings.set(id, {
        ...meeting,
        id,
        createdAt: new Date(),
      } as Meeting);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getOrganizations(filters?: SearchFilters): Promise<Organization[]> {
    let orgs = Array.from(this.organizations.values());

    if (filters) {
      if (filters.query) {
        const query = filters.query.toLowerCase();
        orgs = orgs.filter(
          (org) =>
            org.name.toLowerCase().includes(query) ||
            org.description?.toLowerCase().includes(query) ||
            org.contactInfo?.city?.toLowerCase().includes(query) ||
            org.tags?.some((tag) => tag.toLowerCase().includes(query))
        );
      }

      if (filters.sportTypes && filters.sportTypes.length > 0) {
        orgs = orgs.filter((org) => filters.sportTypes!.includes(org.sportType));
      }

      if (filters.orgTypes && filters.orgTypes.length > 0) {
        orgs = orgs.filter((org) => filters.orgTypes!.includes(org.orgType));
      }

      if (filters.state) {
        orgs = orgs.filter((org) => org.contactInfo?.state === filters.state);
      }

      if (filters.city) {
        const city = filters.city.toLowerCase();
        orgs = orgs.filter((org) =>
          org.contactInfo?.city?.toLowerCase().includes(city)
        );
      }
    }

    return orgs.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const id = randomUUID();
    const organization: Organization = {
      ...org,
      id,
      createdAt: new Date(),
    };
    this.organizations.set(id, organization);
    return organization;
  }

  async updateOrganization(id: string, org: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const existing = this.organizations.get(id);
    if (!existing) return undefined;

    const updated: Organization = { ...existing, ...org };
    this.organizations.set(id, updated);
    return updated;
  }

  async deleteOrganization(id: string): Promise<boolean> {
    return this.organizations.delete(id);
  }

  async getLeads(filters?: { status?: LeadStatus; limit?: number }): Promise<LeadWithOrganization[]> {
    let leads = Array.from(this.leads.values());

    if (filters?.status) {
      leads = leads.filter((lead) => lead.status === filters.status);
    }

    leads = leads.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    if (filters?.limit) {
      leads = leads.slice(0, filters.limit);
    }

    return leads.map((lead) => ({
      ...lead,
      organization: this.organizations.get(lead.organizationId)!,
    }));
  }

  async getLead(id: string): Promise<LeadWithOrganization | undefined> {
    const lead = this.leads.get(id);
    if (!lead) return undefined;

    return {
      ...lead,
      organization: this.organizations.get(lead.organizationId)!,
    };
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const existingLead = Array.from(this.leads.values()).find(
      (l) => l.organizationId === insertLead.organizationId
    );
    if (existingLead) {
      return existingLead;
    }

    const id = randomUUID();
    const lead: Lead = {
      ...insertLead,
      id,
      status: insertLead.status || "novo",
      priority: insertLead.priority || 1,
      notes: insertLead.notes || null,
      lastContactedAt: null,
      createdAt: new Date(),
    };
    this.leads.set(id, lead);
    return lead;
  }

  async updateLead(id: string, leadUpdate: Partial<InsertLead>): Promise<Lead | undefined> {
    const existing = this.leads.get(id);
    if (!existing) return undefined;

    const updated: Lead = {
      ...existing,
      ...leadUpdate,
      lastContactedAt: leadUpdate.status && leadUpdate.status !== "novo" ? new Date() : existing.lastContactedAt,
    };
    this.leads.set(id, updated);
    return updated;
  }

  async deleteLead(id: string): Promise<boolean> {
    Array.from(this.meetings.values())
      .filter((m) => m.leadId === id)
      .forEach((m) => this.meetings.delete(m.id));

    Array.from(this.interactions.values())
      .filter((i) => i.leadId === id)
      .forEach((i) => this.interactions.delete(i.id));

    return this.leads.delete(id);
  }

  async getMeetings(filters?: { status?: string; limit?: number }): Promise<MeetingWithLead[]> {
    let meetings = Array.from(this.meetings.values());

    if (filters?.status) {
      meetings = meetings.filter((meeting) => meeting.status === filters.status);
    }

    meetings = meetings.sort((a, b) => {
      const dateA = a.scheduledFor ? new Date(a.scheduledFor).getTime() : 0;
      const dateB = b.scheduledFor ? new Date(b.scheduledFor).getTime() : 0;
      return dateA - dateB;
    });

    if (filters?.limit) {
      meetings = meetings.slice(0, filters.limit);
    }

    return Promise.all(
      meetings.map(async (meeting) => {
        const lead = await this.getLead(meeting.leadId);
        return {
          ...meeting,
          lead: lead!,
        };
      })
    );
  }

  async getMeeting(id: string): Promise<MeetingWithLead | undefined> {
    const meeting = this.meetings.get(id);
    if (!meeting) return undefined;

    const lead = await this.getLead(meeting.leadId);
    return {
      ...meeting,
      lead: lead!,
    };
  }

  async createMeeting(insertMeeting: InsertMeeting): Promise<Meeting> {
    const id = randomUUID();
    const meeting: Meeting = {
      ...insertMeeting,
      id,
      scheduledFor: new Date(insertMeeting.scheduledFor),
      status: insertMeeting.status || "agendada",
      duration: insertMeeting.duration || 60,
      location: insertMeeting.location || null,
      notes: insertMeeting.notes || null,
      createdAt: new Date(),
    };
    this.meetings.set(id, meeting);

    const lead = this.leads.get(insertMeeting.leadId);
    if (lead && lead.status === "contato") {
      lead.status = "reuniao_agendada";
      lead.lastContactedAt = new Date();
      this.leads.set(lead.id, lead);
    }

    return meeting;
  }

  async updateMeeting(id: string, meetingUpdate: Partial<InsertMeeting>): Promise<Meeting | undefined> {
    const existing = this.meetings.get(id);
    if (!existing) return undefined;

    const updated: Meeting = {
      ...existing,
      ...meetingUpdate,
      scheduledFor: meetingUpdate.scheduledFor
        ? new Date(meetingUpdate.scheduledFor)
        : existing.scheduledFor,
    };
    this.meetings.set(id, updated);
    return updated;
  }

  async deleteMeeting(id: string): Promise<boolean> {
    return this.meetings.delete(id);
  }

  async getInteractions(leadId: string): Promise<Interaction[]> {
    return Array.from(this.interactions.values())
      .filter((i) => i.leadId === leadId)
      .sort((a, b) => (b.occurredAt?.getTime() || 0) - (a.occurredAt?.getTime() || 0));
  }

  async createInteraction(insertInteraction: InsertInteraction): Promise<Interaction> {
    const id = randomUUID();
    const interaction: Interaction = {
      ...insertInteraction,
      id,
      occurredAt: insertInteraction.occurredAt ? new Date(insertInteraction.occurredAt) : new Date(),
      subject: insertInteraction.subject || null,
      notes: insertInteraction.notes || null,
      createdAt: new Date(),
    };
    this.interactions.set(id, interaction);

    const lead = this.leads.get(insertInteraction.leadId);
    if (lead) {
      lead.lastContactedAt = new Date();
      this.leads.set(lead.id, lead);
    }

    return interaction;
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const leads = Array.from(this.leads.values());
    const meetings = Array.from(this.meetings.values());

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const totalLeads = leads.length;
    const meetingsScheduled = meetings.filter((m) => m.status === "agendada").length;
    const convertedLeads = leads.filter((l) => l.status === "convertido").length;
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
    const newLeadsThisWeek = leads.filter(
      (l) => l.createdAt && new Date(l.createdAt) > oneWeekAgo
    ).length;

    return {
      totalLeads,
      meetingsScheduled,
      conversionRate,
      newLeadsThisWeek,
    };
  }
}

export const storage = new MemStorage();
