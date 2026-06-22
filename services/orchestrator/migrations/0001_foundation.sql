CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
    accrued_royalties NUMERIC(12, 2) NOT NULL DEFAULT 0,
    unrecouped_advance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID REFERENCES artists(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    isrc TEXT NOT NULL UNIQUE,
    metadata_tags JSONB NOT NULL DEFAULT '{}'::jsonb,
    acoustic_features JSONB NOT NULL DEFAULT '{}'::jsonb,
    audio_url TEXT NOT NULL,
    semantic_embedding VECTOR(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
    split_percentages JSONB NOT NULL DEFAULT '{}'::jsonb,
    advance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    recoupment_rate NUMERIC(6, 5) NOT NULL DEFAULT 0,
    legal_status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT NOT NULL,
    thread_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    conversation_thread JSONB NOT NULL DEFAULT '[]'::jsonb,
    graph_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    tool_execution_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
    state_status TEXT NOT NULL DEFAULT 'initialized',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON tracks (artist_id);
CREATE INDEX IF NOT EXISTS idx_contracts_artist_id ON contracts (artist_id);
CREATE INDEX IF NOT EXISTS idx_contracts_track_id ON contracts (track_id);
CREATE INDEX IF NOT EXISTS idx_agent_states_agent_name ON agent_states (agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_states_thread_id ON agent_states (thread_id);
