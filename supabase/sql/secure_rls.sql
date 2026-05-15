-- Re-enable RLS
alter table public.bookings enable row level security;

-- Drop any existing conflicting policies
drop policy if exists "Allow public inserts" on public.bookings;
drop policy if exists "Allow anon inserts" on public.bookings;
drop policy if exists "Allow all inserts" on public.bookings;

-- Create a strict INSERT ONLY policy for public (anon) users
create policy "Allow public inserts" 
on public.bookings 
for insert 
to anon 
with check (true);
