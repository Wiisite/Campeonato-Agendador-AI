import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertOrganizationSchema,
  insertLeadSchema,
  insertMeetingSchema,
  insertInteractionSchema,
  type SearchFilters,
  type LeadStatus,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to get dashboard metrics" });
    }
  });

  app.get("/api/organizations", async (req, res) => {
    try {
      const filters: SearchFilters = {};
      
      if (req.query.query) {
        filters.query = String(req.query.query);
      }
      if (req.query.sportTypes) {
        filters.sportTypes = (req.query.sportTypes as string).split(",") as any;
      }
      if (req.query.orgTypes) {
        filters.orgTypes = (req.query.orgTypes as string).split(",") as any;
      }
      if (req.query.state) {
        filters.state = String(req.query.state);
      }
      if (req.query.city) {
        filters.city = String(req.query.city);
      }

      const organizations = await storage.getOrganizations(filters);
      res.json(organizations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get organizations" });
    }
  });

  app.get("/api/organizations/:id", async (req, res) => {
    try {
      const organization = await storage.getOrganization(req.params.id);
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }
      res.json(organization);
    } catch (error) {
      res.status(500).json({ error: "Failed to get organization" });
    }
  });

  app.post("/api/organizations", async (req, res) => {
    try {
      const parsed = insertOrganizationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues });
      }
      const organization = await storage.createOrganization(parsed.data);
      res.status(201).json(organization);
    } catch (error) {
      res.status(500).json({ error: "Failed to create organization" });
    }
  });

  app.patch("/api/organizations/:id", async (req, res) => {
    try {
      const organization = await storage.updateOrganization(req.params.id, req.body);
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }
      res.json(organization);
    } catch (error) {
      res.status(500).json({ error: "Failed to update organization" });
    }
  });

  app.delete("/api/organizations/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteOrganization(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Organization not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete organization" });
    }
  });

  app.get("/api/leads", async (req, res) => {
    try {
      const filters: { status?: LeadStatus; limit?: number } = {};
      
      if (req.query.status) {
        filters.status = req.query.status as LeadStatus;
      }
      if (req.query.limit) {
        filters.limit = parseInt(req.query.limit as string, 10);
      }

      const leads = await storage.getLeads(filters);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to get leads" });
    }
  });

  app.get("/api/leads/:id", async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to get lead" });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const parsed = insertLeadSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues });
      }
      const lead = await storage.createLead(parsed.data);
      res.status(201).json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to create lead" });
    }
  });

  app.patch("/api/leads/:id", async (req, res) => {
    try {
      const lead = await storage.updateLead(req.params.id, req.body);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteLead(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lead" });
    }
  });

  app.get("/api/leads/:id/interactions", async (req, res) => {
    try {
      const interactions = await storage.getInteractions(req.params.id);
      res.json(interactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get interactions" });
    }
  });

  app.post("/api/leads/:id/interactions", async (req, res) => {
    try {
      const parsed = insertInteractionSchema.safeParse({
        ...req.body,
        leadId: req.params.id,
      });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues });
      }
      const interaction = await storage.createInteraction(parsed.data);
      res.status(201).json(interaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to create interaction" });
    }
  });

  app.get("/api/meetings", async (req, res) => {
    try {
      const filters: { status?: string; limit?: number } = {};
      
      if (req.query.status) {
        filters.status = req.query.status as string;
      }
      if (req.query.limit) {
        filters.limit = parseInt(req.query.limit as string, 10);
      }

      const meetings = await storage.getMeetings(filters);
      res.json(meetings);
    } catch (error) {
      res.status(500).json({ error: "Failed to get meetings" });
    }
  });

  app.get("/api/meetings/:id", async (req, res) => {
    try {
      const meeting = await storage.getMeeting(req.params.id);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      res.json(meeting);
    } catch (error) {
      res.status(500).json({ error: "Failed to get meeting" });
    }
  });

  app.post("/api/meetings", async (req, res) => {
    try {
      const parsed = insertMeetingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues });
      }
      const meeting = await storage.createMeeting(parsed.data);
      res.status(201).json(meeting);
    } catch (error) {
      res.status(500).json({ error: "Failed to create meeting" });
    }
  });

  app.patch("/api/meetings/:id", async (req, res) => {
    try {
      const meeting = await storage.updateMeeting(req.params.id, req.body);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      res.json(meeting);
    } catch (error) {
      res.status(500).json({ error: "Failed to update meeting" });
    }
  });

  app.delete("/api/meetings/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteMeeting(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete meeting" });
    }
  });

  return httpServer;
}
