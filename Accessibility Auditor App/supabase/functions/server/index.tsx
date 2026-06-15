import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use('*', logger(console.log));

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

app.get("/make-server-1ee6cbef/health", (c) => {
  return c.json({ status: "ok" });
});

// Sign up a new auditor account
app.post("/make-server-1ee6cbef/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || email },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.log("Signup error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (err) {
    console.log("Signup exception:", err);
    return c.json({ error: "Internal server error during signup" }, 500);
  }
});

// Create a shareable link for an audit
app.post("/make-server-1ee6cbef/share", async (c) => {
  try {
    const { audit } = await c.req.json();
    if (!audit) return c.json({ error: "No audit provided" }, 400);

    const shareId = crypto.randomUUID();
    await kv.set(`share:${shareId}`, JSON.stringify(audit));

    return c.json({ shareId });
  } catch (err) {
    console.log("Share error:", err);
    return c.json({ error: `Failed to create share link: ${err}` }, 500);
  }
});

// Retrieve a shared audit
app.get("/make-server-1ee6cbef/share/:shareId", async (c) => {
  try {
    const shareId = c.req.param("shareId");
    const raw = await kv.get(`share:${shareId}`);
    if (!raw) return c.json({ error: "Shared audit not found or expired" }, 404);

    return c.json({ audit: JSON.parse(raw as string) });
  } catch (err) {
    console.log("Share retrieve error:", err);
    return c.json({ error: `Failed to retrieve shared audit: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);
