import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { randomBytes, timingSafeEqual, createHash } from "crypto";

declare module "express-session" {
  interface SessionData {
    authenticated?: boolean;
  }
}

const MemoryStore = createMemoryStore(session);

// Compara as senhas em tempo constante (hash antes para igualar o tamanho)
function passwordMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function setupAuth(app: Express) {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    throw new Error("APP_PASSWORD não definida: configure a senha de acesso ao sistema");
  }

  let sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    // Sem segredo fixo as sessões continuam funcionando, mas caem a cada reinício
    sessionSecret = randomBytes(32).toString("hex");
    console.warn("SESSION_SECRET não definida: usando segredo temporário (logins expiram ao reiniciar)");
  }

  // Necessário atrás de proxy reverso (nginx, painel de hospedagem) para cookies seguros
  app.set("trust proxy", 1);

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({ checkPeriod: 24 * 60 * 60 * 1000 }),
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: "auto",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      },
    }),
  );

  app.post("/api/auth/login", (req, res) => {
    const { password } = req.body ?? {};
    if (typeof password !== "string" || !passwordMatches(password, appPassword)) {
      return res.status(401).json({ error: "Senha incorreta" });
    }
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: "Falha ao iniciar sessão" });
      req.session.authenticated = true;
      res.json({ authenticated: true });
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.status(204).send();
    });
  });

  app.get("/api/auth/me", (req, res) => {
    res.json({ authenticated: !!req.session.authenticated });
  });

  // Todas as outras rotas da API exigem login
  app.use("/api", (req: Request, res: Response, next: NextFunction) => {
    if (req.session.authenticated) return next();
    res.status(401).json({ error: "Não autenticado" });
  });
}

// Limite simples em memória por sessão, em janela deslizante de 1 hora
export function aiRateLimit() {
  const limit = parseInt(process.env.AI_SEARCH_LIMIT_PER_HOUR || "100", 10);
  const windowMs = 60 * 60 * 1000;
  const hits = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.sessionID || req.ip || "anon";
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);

    if (recent.length >= limit) {
      const retryAfter = Math.ceil((recent[0] + windowMs - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: `Limite de ${limit} buscas com IA por hora atingido. Tente novamente em ${Math.ceil(retryAfter / 60)} min.`,
      });
    }

    recent.push(now);
    hits.set(key, recent);
    next();
  };
}
