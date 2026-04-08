-- Growth Planner Database Schema

-- 1. Budgets table (one per user)
create table public.budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  new_arr numeric default 0,
  expansion_revenue numeric default 0,
  partner_arr numeric default 0,
  previous_arr numeric default 0,
  gross_margin numeric default 0,
  annual_churn_rate numeric default 0,
  average_contract_value numeric default 0,
  total_budget numeric default 0,
  include_headcount boolean default false,
  demand_gen text default '30',
  content text default '15',
  field text default '20',
  brand text default '10',
  ecosystem text default '10',
  martech text default '10',
  headcount text default '5',
  marketing_spend_percentage numeric default 0,
  lead_to_mql_rate numeric default 0,
  mql_to_sql_rate numeric default 0,
  sql_to_closed_rate numeric default 0,
  marketing_pipeline_percentage numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Actual spend tracking
create table public.actual_spend (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  month text not null,
  category text not null,
  amount numeric default 0,
  created_at timestamptz default now()
);

-- 3. Budget scenarios
create table public.budget_scenarios (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  budget_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Budget alerts
create table public.budget_alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  alert_type text not null,
  metric text not null,
  threshold numeric default 0,
  enabled boolean default true,
  created_at timestamptz default now()
);

-- 5. Budget shares (team collaboration)
create table public.budget_shares (
  id uuid default gen_random_uuid() primary key,
  scenario_id uuid references public.budget_scenarios(id) on delete cascade not null,
  shared_with_email text not null,
  permission text default 'view',
  created_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- 6. Shared budgets (public share links)
create table public.shared_budgets (
  id uuid default gen_random_uuid() primary key,
  share_id text unique not null,
  created_by uuid references auth.users(id) on delete set null,
  new_arr numeric default 0,
  expansion_revenue numeric default 0,
  partner_arr numeric default 0,
  previous_arr numeric default 0,
  gross_margin numeric default 0,
  annual_churn_rate numeric default 0,
  average_contract_value numeric default 0,
  total_budget numeric default 0,
  include_headcount boolean default false,
  demand_gen text default '30',
  content text default '15',
  field text default '20',
  brand text default '10',
  ecosystem text default '10',
  martech text default '10',
  headcount text default '5',
  marketing_spend_percentage numeric default 0,
  lead_to_mql_rate numeric default 0,
  mql_to_sql_rate numeric default 0,
  sql_to_closed_rate numeric default 0,
  marketing_pipeline_percentage numeric default 0,
  view_count integer default 0,
  created_at timestamptz default now()
);

-- 7. Budget comments
create table public.budget_comments (
  id uuid default gen_random_uuid() primary key,
  scenario_id uuid references public.budget_scenarios(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  section text not null,
  comment text not null,
  created_at timestamptz default now()
);

-- Row Level Security policies

alter table public.budgets enable row level security;
alter table public.actual_spend enable row level security;
alter table public.budget_scenarios enable row level security;
alter table public.budget_alerts enable row level security;
alter table public.budget_shares enable row level security;
alter table public.shared_budgets enable row level security;
alter table public.budget_comments enable row level security;

-- Budgets: users can only access their own
create policy "Users can view own budgets" on public.budgets for select using (auth.uid() = user_id);
create policy "Users can insert own budgets" on public.budgets for insert with check (auth.uid() = user_id);
create policy "Users can update own budgets" on public.budgets for update using (auth.uid() = user_id);

-- Actual spend: users can only access their own
create policy "Users can view own actual_spend" on public.actual_spend for select using (auth.uid() = user_id);
create policy "Users can insert own actual_spend" on public.actual_spend for insert with check (auth.uid() = user_id);

-- Budget scenarios: users can only access their own
create policy "Users can view own scenarios" on public.budget_scenarios for select using (auth.uid() = user_id);
create policy "Users can insert own scenarios" on public.budget_scenarios for insert with check (auth.uid() = user_id);
create policy "Users can update own scenarios" on public.budget_scenarios for update using (auth.uid() = user_id);
create policy "Users can delete own scenarios" on public.budget_scenarios for delete using (auth.uid() = user_id);

-- Budget alerts: users can only access their own
create policy "Users can view own alerts" on public.budget_alerts for select using (auth.uid() = user_id);
create policy "Users can insert own alerts" on public.budget_alerts for insert with check (auth.uid() = user_id);
create policy "Users can update own alerts" on public.budget_alerts for update using (auth.uid() = user_id);
create policy "Users can delete own alerts" on public.budget_alerts for delete using (auth.uid() = user_id);

-- Budget shares: creators can manage, shared users can view
create policy "Creators can view own shares" on public.budget_shares for select using (auth.uid() = created_by);
create policy "Creators can insert shares" on public.budget_shares for insert with check (auth.uid() = created_by);
create policy "Creators can delete shares" on public.budget_shares for delete using (auth.uid() = created_by);

-- Shared budgets: anyone can view (public links), authenticated users can create
create policy "Anyone can view shared budgets" on public.shared_budgets for select using (true);
create policy "Authenticated users can create shared budgets" on public.shared_budgets for insert with check (auth.uid() = created_by);
create policy "Creators can update shared budgets" on public.shared_budgets for update using (auth.uid() = created_by);

-- Budget comments: users can manage their own, can view all on scenarios they have access to
create policy "Users can view comments" on public.budget_comments for select using (true);
create policy "Users can insert own comments" on public.budget_comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments" on public.budget_comments for delete using (auth.uid() = user_id);
