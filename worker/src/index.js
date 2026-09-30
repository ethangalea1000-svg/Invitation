// Invitation API — déploiement automatique via GitHub Actions / Cloudflare Workers
// Sécurité admin : le secret ADMIN_PASSWORD est injecté par GitHub Actions dans Cloudflare.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,X-Admin-Password",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS }
  });

const id = () => crypto.randomUUID();

const DEFAULT_INVITATIONS = {
  lettre_louise_2026: {inviteId:"lettre_louise_2026",title:"Louise",message:"Invitation personnelle de Louise",date:"2026-08-19",time:"14:30",place:"Saint-Rémy-de-Provence",host:"Ethan",rsvp:true},
  lettre_laure_2026: {inviteId:"lettre_laure_2026",title:"Laure",message:"Invitation de Laure",date:"2026-08-19",time:"14:30",place:"Saint-Rémy-de-Provence",host:"Ethan",rsvp:true},
  lettre_iris_2026: {inviteId:"lettre_iris_2026",title:"Iris",message:"Invitation de Iris",date:"2026-08-19",time:"14:30",place:"Saint-Rémy-de-Provence",host:"Ethan",rsvp:true},
  rappel_iris_2026: {inviteId:"rappel_iris_2026",title:"Rappel Iris",message:"Rappel pour Iris",date:"2026-08-19",time:"14:30",place:"Saint-Rémy-de-Provence",host:"Ethan",rsvp:true},
  rappel_louna_2026: {inviteId:"rappel_louna_2026",title:"Rappel Louna",message:"Rappel de mission pour Louna",date:"2026-08-19",time:"14:30",place:"Saint-Rémy-de-Provence",host:"Ethan",rsvp:true}
};

const clean = (x = {}) => {
  const keys = [
    "inviteId", "type", "title", "message", "date", "time", "place",
    "details", "host", "guestName", "contact", "rsvp", "theme", "accent", "textColor",
    "font", "compact", "symbol", "subtitle", "image", "askGuests",
    "askNote", "customQuestion"
  ];

  const out = {};
  for (const key of keys) {
    if (key in x) out[key] = x[key];
  }

  out.title = String(out.title || "Invitation").slice(0, 80);
  out.message = String(out.message || "").slice(0, 600);

  return out;
};

const adminPassword = (request) =>
  request.headers.get("X-Admin-Password") || "";

const requireAdmin = (request, env) => {
  if (!env.ADMIN_PASSWORD) {
    return json(
      { error: "Le mot de passe administrateur n'est pas encore configuré." },
      503
    );
  }

  if (adminPassword(request) !== env.ADMIN_PASSWORD) {
    return json({ error: "Mot de passe incorrect." }, 401);
  }

  return null;
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    try {
      const url = new URL(request.url);

      // Vérification du mot de passe administrateur.
      if (request.method === "POST" && url.pathname === "/api/admin/login") {
        if (!env.ADMIN_PASSWORD) {
          return json(
            { ok: false, error: "Le mot de passe administrateur n'est pas configuré." },
            503
          );
        }

        const body = await request.json().catch(() => ({}));
        if (String(body.password || "") !== env.ADMIN_PASSWORD) {
          return json({ ok: false, error: "Mot de passe incorrect." }, 401);
        }

        return json({ ok: true });
      }

      // Toutes les opérations d'administration sont protégées.
      if (
        (request.method === "POST" && url.pathname === "/api/invitations") ||
        (request.method === "GET" && url.pathname === "/api/invitations") ||
        (request.method === "DELETE" && /^\/api\/invitations\/[^/]+$/.test(url.pathname))
      ) {
        const authError = requireAdmin(request, env);
        if (authError) return authError;
      }

      if (request.method === "POST" && url.pathname === "/api/invitations") {
        const body = await request.json();

        if (!body.invitation?.inviteId) {
          return json({ error: "Identifiant d'invitation manquant." }, 400);
        }

        const invitation = clean(body.invitation);
        const now = Date.now();

        await env.DB.prepare(
          `INSERT INTO invitations
            (invite_id, owner_token_hash, data_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(invite_id) DO UPDATE SET
             owner_token_hash = excluded.owner_token_hash,
             data_json = excluded.data_json,
             updated_at = excluded.updated_at`
        )
          .bind(
            invitation.inviteId,
            "admin-password",
            JSON.stringify(invitation),
            now,
            now
          )
          .run();

        return json({ ok: true, inviteId: invitation.inviteId });
      }

      const responseMatch = url.pathname.match(
        /^\/api\/invitations\/([^/]+)\/responses$/
      );

      // Les invités peuvent répondre sans connaître le mot de passe admin.
      if (request.method === "POST" && responseMatch) {
        const inviteId = decodeURIComponent(responseMatch[1]);
        const body = await request.json();
        const name = String(body.name || "").trim();

        if (!["yes", "no"].includes(body.answer) || !name) {
          return json({ error: "Nom et réponse requis." }, 400);
        }

        const exists = await env.DB
          .prepare("SELECT invite_id FROM invitations WHERE invite_id = ?")
          .bind(inviteId)
          .first();

        // Une invitation supprimée reste réellement supprimée.
        // Pour créer/réactiver une invitation, l'administrateur utilise
        // « Activer / préparer les invitations » ou crée une nouvelle invitation.
        if (!exists) {
          return json({ error: "Invitation introuvable ou désactivée." }, 404);
        }

        const responseId = id();

        await env.DB.prepare(
          `INSERT INTO responses
            (id, invite_id, answer, name, count, note, custom, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            responseId,
            inviteId,
            body.answer,
            name.slice(0, 60),
            Math.max(1, Math.min(20, Number(body.count) || 1)),
            String(body.note || "").slice(0, 300),
            String(body.custom || "").slice(0, 160),
            Date.now()
          )
          .run();

        return json({ ok: true, id: responseId });
      }

      if (request.method === "GET" && url.pathname === "/api/invitations") {
        const rows = await env.DB
          .prepare("SELECT * FROM invitations ORDER BY updated_at DESC")
          .all();

        const invitations = [];

        for (const row of rows.results || []) {
          const data = JSON.parse(row.data_json);
          const responseRows = await env.DB
            .prepare(
              `SELECT
                id,
                answer,
                name,
                count,
                note,
                custom,
                created_at AS createdAt
               FROM responses
               WHERE invite_id = ?
               ORDER BY created_at DESC`
            )
            .bind(row.invite_id)
            .all();

          invitations.push({
            ...data,
            responses: responseRows.results || []
          });
        }

        return json({ invitations });
      }

      const deleteMatch = url.pathname.match(
        /^\/api\/invitations\/([^/]+)$/
      );

      if (request.method === "DELETE" && deleteMatch) {
        const inviteId = decodeURIComponent(deleteMatch[1]);

        await env.DB
          .prepare("DELETE FROM responses WHERE invite_id = ?")
          .bind(inviteId)
          .run();

        await env.DB
          .prepare("DELETE FROM invitations WHERE invite_id = ?")
          .bind(inviteId)
          .run();

        return json({ ok: true });
      }

      if (request.method === "GET" && url.pathname === "/") {
        return json({ ok: true, service: "Invitation API", status: "online" });
      }

      return json({ error: "Route inconnue." }, 404);
    } catch (error) {
      return json({
        error: error?.message || "Erreur serveur."
      }, 500);
    }
  }
};
