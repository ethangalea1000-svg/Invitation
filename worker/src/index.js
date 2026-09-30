const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,X-Organizer-Token",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS }
  });

const sha = async (value) => {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return [...new Uint8Array(bytes)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
};

const id = () => crypto.randomUUID();

const clean = (x = {}) => {
  const keys = [
    "inviteId", "type", "title", "message", "date", "time", "place",
    "details", "host", "contact", "rsvp", "theme", "accent", "textColor",
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

const organizerToken = (request) =>
  request.headers.get("X-Organizer-Token") ||
  new URL(request.url).searchParams.get("token") ||
  "";

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    try {
      const url = new URL(request.url);

      // Publier / mettre à jour une invitation.
      if (request.method === "POST" && url.pathname === "/api/invitations") {
        const body = await request.json();

        if (!body.token || !body.invitation?.inviteId) {
          return json(
            { error: "Code organisateur ou identifiant manquant." },
            400
          );
        }

        const ownerTokenHash = await sha(body.token);
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
            ownerTokenHash,
            JSON.stringify(invitation),
            now,
            now
          )
          .run();

        return json({ ok: true, inviteId: invitation.inviteId });
      }

      // Envoyer une réponse à une invitation.
      const responseMatch = url.pathname.match(
        /^\/api\/invitations\/([^/]+)\/responses$/
      );

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

        if (!exists) {
          return json({ error: "Invitation introuvable." }, 404);
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

      // Récupérer les invitations et leurs réponses pour l'admin.
      if (request.method === "GET" && url.pathname === "/api/invitations") {
        const token = organizerToken(request);

        if (!token) {
          return json({ error: "Code organisateur requis." }, 401);
        }

        const ownerTokenHash = await sha(token);

        const rows = await env.DB
          .prepare(
            "SELECT * FROM invitations WHERE owner_token_hash = ? ORDER BY updated_at DESC"
          )
          .bind(ownerTokenHash)
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

      // Supprimer une invitation et toutes ses réponses.
      const deleteMatch = url.pathname.match(
        /^\/api\/invitations\/([^/]+)$/
      );

      if (request.method === "DELETE" && deleteMatch) {
        const token = organizerToken(request);

        if (!token) {
          return json({ error: "Code organisateur requis." }, 401);
        }

        const inviteId = decodeURIComponent(deleteMatch[1]);
        const ownerTokenHash = await sha(token);

        const row = await env.DB
          .prepare(
            "SELECT invite_id FROM invitations WHERE invite_id = ? AND owner_token_hash = ?"
          )
          .bind(inviteId, ownerTokenHash)
          .first();

        if (!row) {
          return json(
            { error: "Invitation introuvable ou code incorrect." },
            404
          );
        }

        await env.DB
          .prepare("DELETE FROM responses WHERE invite_id = ?")
          .bind(inviteId)
          .run();

        await env.DB
          .prepare(
            "DELETE FROM invitations WHERE invite_id = ? AND owner_token_hash = ?"
          )
          .bind(inviteId, ownerTokenHash)
          .run();

        return json({ ok: true });
      }

      if (request.method === "GET" && url.pathname === "/") {
        return json({ ok: true, service: "Invitation API", status: "online" });
      }

      return json({ error: "Route inconnue." }, 404);
    } catch (error) {
      return json(
        { error: error?.message || "Erreur serveur." },
        500
      );
    }
  }
};
