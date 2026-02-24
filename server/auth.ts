import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual, createHash } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import type { User as DbUser } from "@shared/schema";
import { passwordResetTokens } from "@shared/schema";
import { db } from "./db";
import { eq, and, isNull, gt } from "drizzle-orm";
import { sendEmail, emailPasswordReset } from "./services/email";

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

    const user = await storage.createUser({
      ...req.body,
      role: requestedRole,
      isActive,
      password: await hashPassword(req.body.password),
    });

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

  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).send("Email non valida");
      }

      const user = await storage.getUserByEmail(email.trim().toLowerCase());
      if (user) {
        await db
          .update(passwordResetTokens)
          .set({ usedAt: new Date() })
          .where(
            and(
              eq(passwordResetTokens.userId, user.id),
              isNull(passwordResetTokens.usedAt)
            )
          );

        const rawToken = randomBytes(32).toString("hex");
        const hashedToken = createHash("sha256").update(rawToken).digest("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await db.insert(passwordResetTokens).values({
          userId: user.id,
          token: hashedToken,
          expiresAt,
        });

        const protocol = req.headers["x-forwarded-proto"] || "https";
        const host = req.headers.host;
        const resetLink = `${protocol}://${host}/reset-password?token=${rawToken}`;

        const emailContent = emailPasswordReset(resetLink, user.fullName || user.username);
        await sendEmail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      }

      res.json({ message: "Se l'email esiste nel sistema, riceverai un link per reimpostare la password." });
    } catch (error) {
      console.error("Error in forgot-password:", error);
      res.status(500).send("Errore interno del server");
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || typeof token !== "string" || !password || typeof password !== "string") {
        return res.status(400).send("Token e password sono obbligatori");
      }

      if (password.length < 6) {
        return res.status(400).send("La password deve essere di almeno 6 caratteri");
      }

      const hashedToken = createHash("sha256").update(token).digest("hex");

      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, hashedToken),
            isNull(passwordResetTokens.usedAt),
            gt(passwordResetTokens.expiresAt, new Date())
          )
        )
        .limit(1);

      if (!resetToken) {
        return res.status(400).send("Link non valido o scaduto. Richiedi un nuovo reset.");
      }

      const hashedPassword = await hashPassword(password);
      await storage.updateUser(resetToken.userId, { password: hashedPassword });

      await db
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, resetToken.id));

      res.json({ message: "Password reimpostata con successo." });
    } catch (error) {
      console.error("Error in reset-password:", error);
      res.status(500).send("Errore interno del server");
    }
  });
}
