-- ============================================
-- IN-APP MESSAGING
-- Crew-to-crew and crew-to-client conversations
-- ============================================

-- Conversations: internal (crew members) or client (org user <-> client contact)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('internal', 'client')),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  subject TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_org_id ON conversations(org_id);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- Participants: either a user (profiles) or a client contact
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  client_contact_id UUID REFERENCES client_contacts(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_participant_identity CHECK (
    (user_id IS NOT NULL AND client_contact_id IS NULL) OR
    (user_id IS NULL AND client_contact_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conv_participants_conv_user
  ON conversation_participants(conversation_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_conv_participants_conv_contact
  ON conversation_participants(conversation_id, client_contact_id) WHERE client_contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id) WHERE user_id IS NOT NULL;

-- Messages within a conversation
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sender_client_contact_id UUID REFERENCES client_contacts(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_sender_identity CHECK (
    (sender_user_id IS NOT NULL AND sender_client_contact_id IS NULL) OR
    (sender_user_id IS NULL AND sender_client_contact_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(conversation_id, created_at DESC);

-- Update conversation.updated_at when a message is added
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_conversation_messages_updated ON conversation_messages;
CREATE TRIGGER trigger_conversation_messages_updated
  AFTER INSERT ON conversation_messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_updated_at();

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage conversations"
  ON conversations FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Org members can manage conversation_participants"
  ON conversation_participants FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM conversations c
      WHERE c.org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Org members can manage conversation_messages"
  ON conversation_messages FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM conversations c
      WHERE c.org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
    )
  );
