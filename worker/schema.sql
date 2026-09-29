CREATE TABLE IF NOT EXISTS invitations (
  invite_id TEXT PRIMARY KEY,
  owner_token_hash TEXT NOT NULL,
  data_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  invite_id TEXT NOT NULL,
  answer TEXT NOT NULL CHECK(answer IN ('yes','no')),
  name TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  note TEXT NOT NULL DEFAULT '',
  custom TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  FOREIGN KEY(invite_id) REFERENCES invitations(invite_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_responses_invite ON responses(invite_id);
CREATE INDEX IF NOT EXISTS idx_invitations_owner ON invitations(owner_token_hash);
