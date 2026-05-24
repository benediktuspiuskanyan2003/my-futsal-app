-- Update conversations table to support new status values
-- Add Declined status to support team rejection

-- Check if conversations table exists, if not create it
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_a_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  team_b_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Open', -- Open, Confirmed, Declined, Cancelled
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_match_id ON conversations(match_id);
CREATE INDEX IF NOT EXISTS idx_conversations_team_a_id ON conversations(team_a_id);
CREATE INDEX IF NOT EXISTS idx_conversations_team_b_id ON conversations(team_b_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

-- Add comments for documentation
COMMENT ON TABLE conversations IS 'Tracks conversations between teams for match confirmation';
COMMENT ON COLUMN conversations.status IS 'Open: waiting for confirmation, Confirmed: match confirmed, Declined: team rejected, Cancelled: auto-cancelled when another team confirms';

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_team_id ON messages(sender_team_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Create RLS policies for conversations table
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversations of their team" ON conversations
  FOR SELECT USING (
    team_a_id IN (SELECT id FROM teams WHERE manager_id = auth.uid()) OR
    team_b_id IN (SELECT id FROM teams WHERE manager_id = auth.uid())
  );

CREATE POLICY "Users can update conversations of their team" ON conversations
  FOR UPDATE USING (
    team_a_id IN (SELECT id FROM teams WHERE manager_id = auth.uid()) OR
    team_b_id IN (SELECT id FROM teams WHERE manager_id = auth.uid())
  );

CREATE POLICY "Users can insert conversations for their team" ON conversations
  FOR INSERT WITH CHECK (
    team_a_id IN (SELECT id FROM teams WHERE manager_id = auth.uid()) OR
    team_b_id IN (SELECT id FROM teams WHERE manager_id = auth.uid())
  );

-- Create RLS policies for messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in conversations of their team" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE 
        team_a_id IN (SELECT id FROM teams WHERE manager_id = auth.uid()) OR
        team_b_id IN (SELECT id FROM teams WHERE manager_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in conversations of their team" ON messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE 
        team_a_id IN (SELECT id FROM teams WHERE manager_id = auth.uid()) OR
        team_b_id IN (SELECT id FROM teams WHERE manager_id = auth.uid())
    )
  );
