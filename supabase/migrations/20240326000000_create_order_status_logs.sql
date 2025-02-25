
create table "public"."order_status_logs" (
    id uuid not null default uuid_generate_v4(),
    store_id uuid not null references stores(id) on delete cascade,
    order_id bigint not null,
    old_status text not null,
    new_status text not null,
    changed_by text not null,
    created_at timestamp with time zone not null default timezone('utc'::text, now()),
    primary key (id),
    foreign key (store_id) references stores(id) on delete cascade
);

-- Enable RLS
alter table "public"."order_status_logs" enable row level security;

-- Create policy to allow all operations for authenticated users
create policy "Allow full access to authenticated users"
on "public"."order_status_logs"
for all
to authenticated
using (true)
with check (true);
