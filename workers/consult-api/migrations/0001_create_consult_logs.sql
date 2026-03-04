CREATE TABLE IF NOT EXISTS consult_logs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  industry TEXT,
  challenge TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('ai', 'fallback', 'error')),
  status_code INTEGER NOT NULL,
  error_code TEXT,
  model TEXT,
  latency_ms INTEGER,
  ip_hash TEXT,
  user_agent TEXT,
  analysis_preview TEXT,
  page TEXT
);

CREATE INDEX IF NOT EXISTS idx_consult_logs_created_at ON consult_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_consult_logs_mode ON consult_logs(mode);
CREATE INDEX IF NOT EXISTS idx_consult_logs_status_code ON consult_logs(status_code);
