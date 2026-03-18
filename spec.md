# V Cabs Multi Platform

## Current State
Admin panel has a single Users section showing both riders and drivers together. Drivers have vehicle type and vehicle number fields but no vehicle model field.

## Requested Changes (Diff)

### Add
- Separate "Riders" and "Drivers" tabs/sections in Admin Users area
- Vehicle Model field for drivers (e.g. Honda Activa, Maruti Swift, Toyota Innova)
- Vehicle Model shown in driver cards/table and add/edit driver form

### Modify
- Admin Users section: split into two tabs — Riders tab and Drivers tab
- Riders tab: shows only rider accounts with relevant columns (Name, Mobile, City, Status, Rides)
- Drivers tab: shows only driver accounts with columns (Name, Mobile, City, Vehicle Type, Vehicle No, Vehicle Model, Status)
- Add Driver form: include Vehicle Model input field
- Driver cards in admin: display vehicle model alongside vehicle type and number

### Remove
- Combined users list view (replaced by separate tabs)

## Implementation Plan
1. Split admin Users section into Riders and Drivers tabs
2. Riders tab: filter and display only role=rider users
3. Drivers tab: filter and display only role=driver users with vehicle columns
4. Add vehicleModel field to driver data schema and add/edit forms
5. Display vehicle model in driver table rows and detail views
