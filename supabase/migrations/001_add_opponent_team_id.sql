-- Add opponent_team_id column to matches table
-- This allows tracking which team is the opponent for match confirmation

ALTER TABLE matches 
ADD COLUMN opponent_team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Add index for faster queries
CREATE INDEX idx_matches_opponent_team_id ON matches(opponent_team_id);

-- Add comment for documentation
COMMENT ON COLUMN matches.opponent_team_id IS 'The team that was challenged for this match. Set when the opponent accepts the challenge.';
