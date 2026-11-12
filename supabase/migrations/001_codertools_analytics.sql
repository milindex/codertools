-- CoderTools analytics tables.
--
-- The Supabase project is shared across projects, so every CoderTools table is
-- prefixed with `codertools_`. Other projects should use their own prefix.
--
-- Apply with `supabase db push` or paste into the SQL editor.

CREATE TABLE IF NOT EXISTS codertools_visitors (
  visitor_id   TEXT PRIMARY KEY,
  first_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  browser      TEXT,
  os           TEXT,
  device       TEXT,
  country      TEXT,
  visit_count  INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS codertools_page_views (
  id         BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL REFERENCES codertools_visitors(visitor_id) ON DELETE CASCADE,
  pathname   TEXT NOT NULL,
  timestamp  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS codertools_presence (
  visitor_id TEXT PRIMARY KEY REFERENCES codertools_visitors(visitor_id) ON DELETE CASCADE,
  last_seen  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_codertools_page_views_timestamp
  ON codertools_page_views (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_codertools_page_views_visitor
  ON codertools_page_views (visitor_id);
CREATE INDEX IF NOT EXISTS idx_codertools_page_views_pathname
  ON codertools_page_views (pathname);
CREATE INDEX IF NOT EXISTS idx_codertools_visitors_country
  ON codertools_visitors (country);
CREATE INDEX IF NOT EXISTS idx_codertools_visitors_last_seen
  ON codertools_visitors (last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_codertools_presence_last_seen
  ON codertools_presence (last_seen DESC);

ALTER TABLE codertools_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE codertools_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE codertools_presence ENABLE ROW LEVEL SECURITY;

-- The Edge Functions use the service role key, so these policies are mainly a
-- safety net if the anon key is ever used directly.
DROP POLICY IF EXISTS "codertools_insert_visitors" ON codertools_visitors;
DROP POLICY IF EXISTS "codertools_insert_page_views" ON codertools_page_views;
DROP POLICY IF EXISTS "codertools_insert_presence" ON codertools_presence;
DROP POLICY IF EXISTS "codertools_update_presence" ON codertools_presence;
DROP POLICY IF EXISTS "codertools_select_visitors" ON codertools_visitors;
DROP POLICY IF EXISTS "codertools_select_page_views" ON codertools_page_views;
DROP POLICY IF EXISTS "codertools_select_presence" ON codertools_presence;

CREATE POLICY "codertools_insert_visitors"
  ON codertools_visitors FOR INSERT WITH CHECK (true);
CREATE POLICY "codertools_insert_page_views"
  ON codertools_page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "codertools_insert_presence"
  ON codertools_presence FOR INSERT WITH CHECK (true);
CREATE POLICY "codertools_update_presence"
  ON codertools_presence FOR UPDATE USING (true);
CREATE POLICY "codertools_select_visitors"
  ON codertools_visitors FOR SELECT USING (true);
CREATE POLICY "codertools_select_page_views"
  ON codertools_page_views FOR SELECT USING (true);
CREATE POLICY "codertools_select_presence"
  ON codertools_presence FOR SELECT USING (true);
