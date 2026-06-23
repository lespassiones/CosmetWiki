-- advisor_conversations : un enregistrement par session de chat
CREATE TABLE IF NOT EXISTS cosme_check.advisor_conversations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- advisor_messages : tous les messages (user + assistant) d'une conversation.
-- user_id est NOT NULL : chaque message porte son propriétaire (l'API DOIT le
-- renseigner, sinon l'insert échoue). products / reco_criteria stockent les
-- éventuelles cartes produit et critères de reco attachés à un message.
CREATE TABLE IF NOT EXISTS cosme_check.advisor_messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        NOT NULL REFERENCES cosme_check.advisor_conversations(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT        NOT NULL,
  products        JSONB,
  reco_criteria   JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE cosme_check.advisor_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cosme_check.advisor_messages      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "advisor_conv_owner"
  ON cosme_check.advisor_conversations
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "advisor_msg_owner"
  ON cosme_check.advisor_messages
  FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM cosme_check.advisor_conversations
      WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_advisor_conv_user
  ON cosme_check.advisor_conversations (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_advisor_msg_conv
  ON cosme_check.advisor_messages (conversation_id, created_at);
