-- Run this in your Supabase SQL Editor

create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  status text default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date timestamptz,
  parent_id uuid references tasks(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists tasks_status_idx on tasks(status);
create index if not exists tasks_parent_idx on tasks(parent_id);
create index if not exists tasks_created_at_idx on tasks(created_at desc);

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_tasks_updated_at on tasks;
create trigger update_tasks_updated_at
  before update on tasks
  for each row
  execute function update_updated_at_column();

alter table tasks enable row level security;

create policy "Allow all operations for now" on tasks
  for all
  using (true)
  with check (true);

