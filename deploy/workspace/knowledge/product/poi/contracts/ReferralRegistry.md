# ReferralRegistry

## Overview

- Captures inviter → invitee relationships.
- Prevents self referral and subsequent changes.
- Emits an event including a timestamp when bindings occur.

## Key Functions

- `setReferrer(address parent)` – caller binds themselves to a referrer.
- `getReferrer(address child)` – lookup parent address.
- `getReferralCount(address parent)` – total invitees.

## Deployment Notes

- Constructor argument: `owner` (for administrative clarity, though no owner-only functions are currently provided).
