-- ============================================================
-- Lock In — Slice 5 Migration
-- Sets up pg_cron to call the send-reminders Edge Function every minute
-- ============================================================

-- Create the pg_net extension if it doesn't exist (usually already exists on Supabase Cloud)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- pg_cron is usually enabled via the Supabase Dashboard. 
-- Assuming it is enabled, we schedule the job.

-- IMPORTANT: Replace [YOUR_SUPABASE_URL] with your actual Supabase URL (e.g. https://xyz.supabase.co)
-- Replace [YOUR_ANON_KEY] with your actual Supabase Anon Key.
-- DO NOT commit the real keys to source control if this repository is public!

SELECT cron.schedule(
  'send-reminders',
  '* * * * *',
  $$
    SELECT net.http_post(
      url:='[https://cdtfcesdjexrocvklorg.supabase.co]/functions/v1/send-reminders',
      headers:='{"Authorization": "Bearer [sb_publishable_WQxYxWgDqNNOmu88sSlRew_f-7gUZN3]"}'::jsonb,
      body:='{}'::jsonb
    )
  $$
);
