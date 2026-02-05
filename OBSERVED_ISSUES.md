Add player dialog: 
1. User has to click away from player name before add player becomes clickable. Fix by using on text changed events instead.
2. Play style preference - open should be default
3 Gender - only male & female, there should be no other option.

Navigation: 
There is no easy way to go back from player management. We should use breadcrumbs and provide easy navigation to and from different areas of the site (Site wide) 

Add Session:
datetime picker is rendering the same width as the input, meaning it doesn't show correctly. Same for time

Active Session:
BROKEN: When a match is put on a court, the component should be updated to show who is on the court, rather than keeping it as "still available". This now means there is no way to actively end a match.