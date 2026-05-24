-- Create match_requests table to track which teams are interested in a match
CREATE TABLE match_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  requesting_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMP,
  response_notes TEXT,
  UNIQUE(match_id, requesting_team_id)
);

-- Add indexes for faster queries
CREATE INDEX idx_match_requests_match_id ON match_requests(match_id);
CREATE INDEX idx_match_requests_requesting_team_id ON match_requests(requesting_team_id);
CREATE INDEX idx_match_requests_status ON match_requests(status);

-- Add comments for documentation
COMMENT ON TABLE match_requests IS 'Tracks which teams are interested in playing a match';
COMMENT ON COLUMN match_requests.status IS 'pending: awaiting response, accepted: match confirmed, rejected: offer declined';
