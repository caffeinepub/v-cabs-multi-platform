# V Cabs Multi Platform System

## Current State
New project — no existing code.

## Requested Changes (Diff)

### Add
- Shared Motoko backend with authentication, ride management, driver dispatch, OTP trip verification, V Coin payments, and admin audit logging
- Rider App: registration/login, ride booking with pickup/destination, live ride status, fare display, payment with V Coins
- Driver App: registration/login, accept/reject ride requests, OTP verification to start trip, trip completion
- Admin Dashboard: user management (riders and drivers), ride monitoring, analytics overview, audit logs
- Role-based access: rider, driver, admin
- Amber and white branding (V Space One style)

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Select authorization component for role-based access
2. Generate Motoko backend with riders, drivers, rides, V Coin wallet, OTP, and admin APIs
3. Build frontend with three views: Rider, Driver, Admin — switchable via role-based login
4. Wire all backend APIs to frontend UI
