# Architecture

```text
                 Supabase Auth
                      │
             Admin allowlists + RLS
                      │
        ┌─────────────┴─────────────┐
        │                           │
  FrankiFlow data             FrankiHolz data
  quotes / clients            bookings / rooms
  employees / jobs            calendar / iCal
  pricing / website           pricing / website
        │                           │
        └─────────────┬─────────────┘
                      │
                 Franki Admin
             Expo + React Native
                iOS + Android
```

### Trust boundary
The React Native client is untrusted. It only holds a Supabase publishable key. Authorization is enforced by Supabase Row Level Security and admin-checking RPC/Edge Functions. Stripe creation/cancellation stays on existing server-side Edge Functions.

### Realtime
Dashboard/bookings/quotes/jobs subscribe to Supabase realtime change channels. The app also supports manual pull-to-refresh/load refreshes so it does not depend exclusively on realtime delivery.

### Data separation
FrankiFlow and FrankiHolz remain distinct database domains. A shared authenticated session can be authorized independently for each domain, so future staff can be granted only one module.
