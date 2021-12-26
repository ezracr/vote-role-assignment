# vote-role-assignment
Assigns a role automatically provided enough votes

- Records likes and dislikes, it's possible to undo your vote.
- Allows to vote only users with the roles in `allowedRoleIds`.
- Once `votesThreshold` is met, assigns `awardedRoleId`.
