create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  topic text not null default 'General',
  storage_path text not null,
  mime_type text,
  word_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  answer text not null,
  citations jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists quiz_results (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid references documents(id) on delete set null,
  topic text not null,
  score integer not null check (score between 0 and 100),
  mistakes jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists study_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  topic text not null default 'General',
  duration_minutes integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists document_chunks_embedding_idx
  on document_chunks using ivfflat (embedding vector_cosine_ops);

create policy "Users can read own documents"
  on documents for select
  using (auth.uid() = owner_id);
