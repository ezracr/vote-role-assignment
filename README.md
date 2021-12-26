# vote-role-assignment
Assigns a role automatically provided enough votes

- Records likes and dislikes, it's possible to undo your vote.
- Allows only users with the roles to vote in `allowedRoleIds`.
- Once `votesThreshold` is met, assigns `awardedRoleId`.
