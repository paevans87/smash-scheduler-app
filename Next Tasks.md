# Club Management
## Matchmaking Profile
### Simulator! 
1. Add players
2. Add number of courts
3. Add number of iterations to process OR average game length & session duration 
4. Run simulator
5. Present analysis back to user to showing useful information to determine if the profile is a good one for them
Things like but not limited to: 
# of mix games
# of level games
# of 'funny mix' games (only if gender match is not strict)
# of duplicate games
# of duplicate partners
# of duplicate opponents 
# Max games 
# Min games
# avg games per player

### Advanced - Tweak multiplier variables
The user should be able to modify the following multiplier variables from matchmaking.ts

This should be disabled / hidden by default by a toggle, when enabled & shown, a warning to user should be shown informing that changes can easily make the algorithm give unexpected results and to use with risk.
There must be a reset option.

These are the default values and should be stored against all matchmaking profiles. (These exist in matchmaking.ts)
export const LEVEL_MULTIPLIER = 1.12;
export const MIX_MULTIPLIER = 1.04;
export const ASYMETRIC_GENDER_MULTIPLIER = 0.9; 


# Session
## New Session
### Number Of Courts
Make input a slider with an upper limit of 12

## Active Session
### End Session
If there are any active matches the user should be notified that they will all be marked as a draw and finished in order to end the session
