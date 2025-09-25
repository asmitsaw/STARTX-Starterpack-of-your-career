-- STARTX seed data for demo

-- Demo users
INSERT INTO users (name, headline, email, password)
VALUES
  ('Demo User', 'Aspiring Engineer', 'demo@startx.app', '$2a$10$0t7I0r2u5Wsl2yNwJ5GJQO5o4o2bqC0xYz7c4JqQmQ0kLQ0kLQ0kK')
ON CONFLICT (email) DO NOTHING;

-- Simple trending topics
INSERT INTO trending_topics (title, post_count) VALUES
  ('AI in 2025', 123),
  ('TypeScript Patterns', 98),
  ('System Design', 76)
ON CONFLICT DO NOTHING;

