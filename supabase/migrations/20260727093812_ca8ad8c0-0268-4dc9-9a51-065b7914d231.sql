
-- Extensions for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Additive columns on jobs
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS external_url text,
  ADD COLUMN IF NOT EXISTS source_ats text,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS raw_description text;

-- Clear existing mock rows; they will be replaced by real ATS postings
DELETE FROM public.jobs;

-- job_sources: which company feeds to pull
CREATE TABLE IF NOT EXISTS public.job_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ats text NOT NULL CHECK (ats IN ('greenhouse','lever','ashby')),
  handle text NOT NULL,
  company_name text NOT NULL,
  company_domain text,
  company_sector text,
  enabled boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ats, handle)
);

GRANT SELECT ON public.job_sources TO authenticated;
GRANT ALL ON public.job_sources TO service_role;

ALTER TABLE public.job_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage job sources"
  ON public.job_sources FOR ALL
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read job sources"
  ON public.job_sources FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER job_sources_updated_at
  BEFORE UPDATE ON public.job_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed curated companies
INSERT INTO public.job_sources (ats, handle, company_name, company_sector) VALUES
  -- Greenhouse
  ('greenhouse','stripe','Stripe','Fintech'),
  ('greenhouse','airbnb','Airbnb','Travel'),
  ('greenhouse','doordash','DoorDash','Delivery'),
  ('greenhouse','instacart','Instacart','Delivery'),
  ('greenhouse','robinhood','Robinhood','Fintech'),
  ('greenhouse','coinbase','Coinbase','Crypto'),
  ('greenhouse','figma','Figma','Design tools'),
  ('greenhouse','notion','Notion','Productivity'),
  ('greenhouse','vercel','Vercel','Developer tools'),
  ('greenhouse','cloudflare','Cloudflare','Infrastructure'),
  ('greenhouse','anthropic','Anthropic','AI'),
  ('greenhouse','scaleai','Scale AI','AI'),
  ('greenhouse','ramp','Ramp','Fintech'),
  ('greenhouse','brex','Brex','Fintech'),
  ('greenhouse','retool','Retool','Developer tools'),
  ('greenhouse','zapier','Zapier','Automation'),
  ('greenhouse','discord','Discord','Consumer'),
  ('greenhouse','reddit','Reddit','Consumer'),
  ('greenhouse','shopify','Shopify','E-commerce'),
  ('greenhouse','pinterest','Pinterest','Consumer'),
  ('greenhouse','twilio','Twilio','Communications'),
  ('greenhouse','datadoghq','Datadog','Infrastructure'),
  ('greenhouse','snowflake','Snowflake','Data'),
  ('greenhouse','confluent','Confluent','Data'),
  ('greenhouse','mongodb','MongoDB','Data'),
  ('greenhouse','hashicorp','HashiCorp','Infrastructure'),
  ('greenhouse','elastic','Elastic','Data'),
  ('greenhouse','gitlab','GitLab','Developer tools'),
  ('greenhouse','digitalocean','DigitalOcean','Infrastructure'),
  ('greenhouse','asana','Asana','Productivity'),
  ('greenhouse','miro','Miro','Collaboration'),
  ('greenhouse','airtable','Airtable','Productivity'),
  ('greenhouse','webflow','Webflow','No-code'),
  ('greenhouse','postman','Postman','Developer tools'),
  ('greenhouse','plaid','Plaid','Fintech'),
  ('greenhouse','affirm','Affirm','Fintech'),
  ('greenhouse','chime','Chime','Fintech'),
  ('greenhouse','betterment','Betterment','Fintech'),
  ('greenhouse','wealthfront','Wealthfront','Fintech'),
  ('greenhouse','opendoor','Opendoor','Real estate'),
  ('greenhouse','faire','Faire','E-commerce'),
  ('greenhouse','samsara','Samsara','IoT'),
  ('greenhouse','okta','Okta','Security'),
  ('greenhouse','1password','1Password','Security'),
  ('greenhouse','duolingo','Duolingo','EdTech'),
  ('greenhouse','coursera','Coursera','EdTech'),
  ('greenhouse','peloton','Peloton','Fitness'),
  ('greenhouse','warbyparker','Warby Parker','Retail'),
  ('greenhouse','glossier','Glossier','Beauty'),
  ('greenhouse','allbirds','Allbirds','Retail'),
  -- Lever
  ('lever','netflix','Netflix','Streaming'),
  ('lever','spotify','Spotify','Streaming'),
  ('lever','blockchain','Blockchain.com','Crypto'),
  ('lever','eventbrite','Eventbrite','Events'),
  ('lever','attentive','Attentive','Marketing'),
  ('lever','fivetran','Fivetran','Data'),
  ('lever','ironclad','Ironclad','LegalTech'),
  ('lever','angi','Angi','Marketplace'),
  ('lever','rippling','Rippling','HR tech'),
  ('lever','kayak','KAYAK','Travel'),
  ('lever','benchling','Benchling','BioTech'),
  ('lever','census','Census','Data'),
  ('lever','clever','Clever','EdTech'),
  ('lever','magiceden','Magic Eden','Crypto'),
  ('lever','mercury','Mercury','Fintech'),
  ('lever','notarize','Notarize','LegalTech'),
  ('lever','writer','Writer','AI'),
  ('lever','clipboard','Clipboard Health','Healthcare'),
  ('lever','tempus','Tempus','HealthTech'),
  ('lever','sardine','Sardine','Fintech'),
  ('lever','ashbyhq','Ashby','HR tech'),
  ('lever','handshake','Handshake','Careers'),
  ('lever','coalition','Coalition','InsurTech'),
  ('lever','crexi','Crexi','Real estate'),
  ('lever','flexport','Flexport','Logistics'),
  ('lever','luminovo','Luminovo','Hardware'),
  ('lever','coder','Coder','Developer tools'),
  ('lever','deel','Deel','HR tech'),
  ('lever','deepgram','Deepgram','AI'),
  ('lever','runway','Runway','AI'),
  ('lever','sourcegraph','Sourcegraph','Developer tools'),
  ('lever','hex','Hex','Data'),
  ('lever','clari','Clari','Sales'),
  ('lever','gong','Gong','Sales'),
  ('lever','carta','Carta','Fintech')
ON CONFLICT (ats, handle) DO NOTHING;

CREATE INDEX IF NOT EXISTS jobs_last_seen_at_idx ON public.jobs(last_seen_at);
CREATE INDEX IF NOT EXISTS jobs_source_ats_idx ON public.jobs(source_ats);
