import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import type { User as DbUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends DbUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  if (!stored || !stored.includes(".")) {
    // Password is not in the expected format (hash.salt)
    console.log('[AUTH] Invalid password format - missing salt');
    return false;
  }
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    console.log('[AUTH] Invalid password format - empty hash or salt');
    return false;
  }
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (usernameOrEmail, password, done) => {
      console.log('[AUTH] Login attempt:', { usernameOrEmail, passwordLength: password?.length });
      
      // Try to find user by username first, then by email
      let user = await storage.getUserByUsername(usernameOrEmail);
      if (!user) {
        user = await storage.getUserByEmail(usernameOrEmail);
      }
      
      if (!user) {
        console.log('[AUTH] User not found:', usernameOrEmail);
        return done(null, false, { message: "Credenziali non valide" });
      }
      
      // Check if user is active (approved)
      if (!user.isActive) {
        console.log('[AUTH] User not active (pending approval):', usernameOrEmail);
        return done(null, false, { message: "Account in attesa di approvazione" });
      }
      
      const passwordMatch = await comparePasswords(password, user.password);
      console.log('[AUTH] Password match:', passwordMatch, 'for user:', usernameOrEmail);
      if (!passwordMatch) {
        return done(null, false, { message: "Credenziali non valide" });
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    // If user is inactive, invalidate session
    if (user && !user.isActive) {
      return done(null, false);
    }
    done(null, user);
  });

  // Global middleware to enforce isActive on all authenticated requests
  app.use((req, res, next) => {
    if (req.isAuthenticated() && req.user && !req.user.isActive) {
      req.logout((err) => {
        if (err) console.error('[AUTH] Error logging out inactive user:', err);
        return res.status(401).send("Account disattivato");
      });
    } else {
      next();
    }
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    // Allow customer and reseller registration
    // Resellers require admin approval (isActive=false until approved)
    const allowedRoles = ["customer", "reseller"];
    const requestedRole = req.body.role || "customer";
    
    if (!allowedRoles.includes(requestedRole)) {
      return res.status(403).send("Cannot register with that role. Contact administrator.");
    }

    // Resellers start inactive and need admin approval
    const isActive = requestedRole === "reseller" ? false : true;

    // Customer onboarding: Handle invitation code or repair center selection
    let resellerId: string | undefined;
    let repairCenterId: string | undefined;
    
    if (requestedRole === "customer") {
      const { invitationCode, selectedRepairCenterId } = req.body;
      
      // Priority 1: Invitation code (validates and assigns customer)
      if (invitationCode) {
        const validation = await storage.validateAndUseInvitationCode(invitationCode);
        if (!validation.valid) {
          return res.status(400).send(validation.error || "Codice invito non valido");
        }
        if (validation.invitationCode) {
          resellerId = validation.invitationCode.resellerId;
          repairCenterId = validation.invitationCode.repairCenterId;
        }
      }
      // Priority 2: Direct repair center selection (from public search)
      else if (selectedRepairCenterId) {
        const center = await storage.getRepairCenter(selectedRepairCenterId);
        if (center && center.isActive && center.resellerId) {
          resellerId = center.resellerId;
          repairCenterId = center.id;
        }
      }
      // Note: If neither is provided, customer registers without association
      // They can be associated later when creating a repair order
    }

    const user = await storage.createUser({
      ...req.body,
      role: requestedRole,
      isActive,
      resellerId,
      repairCenterId,
      password: await hashPassword(req.body.password),
    });

    // If customer was associated to a repair center, create the many-to-many link
    if (requestedRole === "customer" && repairCenterId) {
      await storage.ensureCustomerRepairCenterAssociation(user.id, repairCenterId);
    }

    // Only auto-login for customers (resellers need approval first)
    if (requestedRole === "customer") {
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } else {
      // Reseller registration - don't auto-login
      res.status(201).json({ 
        message: "Registrazione completata. Il tuo account rivenditore è in attesa di approvazione.",
        pending: true 
      });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).send(info?.message || "Credenziali non valide");
      }
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
