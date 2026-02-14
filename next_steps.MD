# Stripe Integration
I have created a second Product for "Club Lite" which is the free version. We should use this when creating clubs so that we always have our users on stripe, etc. - no card info required for this.

## Multiple Clubs 
If I create a second club, I get re-routed automatically to the existing club.
I notice I get a 500 on `/api/checkout/fulfil` prior to this happening

### C:\Git\smash-scheduler\src\app\(protected)\clubs\page.tsx
Lets remove the auto-direct to the club page if club count === 1 and change things around a little. 

1. The page should show a header + branding
2. We should be able to sign out
3. We should be able to go back to home page


## C:\Git\smash-scheduler\src\components\side-nav.tsx
1. Add an icon next to this to represent "switch club" which directs us to `/clubs/`
2. users email should be clickable also to bring up the context menu 