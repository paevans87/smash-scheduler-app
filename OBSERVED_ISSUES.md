# /clubs
## The club Card is not entirely clickable. It shows the name / courts & doubles correctly but "View Club" does not work. 
### Fix: Clicking any of the card should navigate us to the club.
### Extras: Convert the card to a component. 

# clubs/{clubId}
## We get a console error about "Mud Element onBlurEvent - we don't need this fancy CSS for now, we can keep it simple. (Change this everywhere for the whole site)
### Fix: Remove onblur / focus

## Club Details panel is a bit redundant - it shows nothing useful
## Fix: Replace with "Session History" showing the dates of sessions, number of players, start time & end time in a tabular format, clicking on a session should navigate us to the session.
### Extras: Convert to a component. 

# Create Session
## Problems
### We should be able to set the date & time for this so we can setup future events easily.
#### Fix: Adjust to an input

### Available players should have an indication of gender (This applies site wide)
#### Fix: Avatar background Pink for female, blue for male

# Active Session page
## Problems
### Courts all have the same numbers (court 5, court 5, etc) 
#### Fix: Court numbers should be numbered from 1. For 4 courts we should have: court 1, court 2, court 3, court 4. 

### Courts should be optionally be able to be custom numbered. Sometimes sports halls have dedicated court numbers
#### Fix: The user should be able to override court numbers for the session if they want.

### On The Bench: 
#### We should show the number of games a player has played here so its easy to add players if we like

### Tap to create match: This should auto generate the match instead of go into a custom 

### Generate Matches: This should show up a prompt for the user to confirm / modify the match before locking it into a court.
#### Extra: When auto generate is used; try to include some context about why this match was chosen.


### Auto Match: Check the algorithm waitings. We should avoid duplicate matches as much as possible
#### Extras: If I go through a couple of series of generate > finish > generate > finish > generate > finish - the matches are ALWAYS the same, we need to ensure the weightings are working correctly to prevent this.