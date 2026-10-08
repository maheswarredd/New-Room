# RoomExpenses Push Notification Setup

## Notification events included

- New expense → affected members receive title, amount and split information.
- New assigned task → assignees receive task title and priority.
- Payment recorded → the member whose payment was recorded receives the payment amount.
- Test notification → each logged-in user can test their registered devices.

## API endpoints

- `POST /api/notifications/register`
- `POST /api/notifications/unregister`
- `POST /api/notifications/test`

All are protected by the existing JWT authentication middleware.

## Important

Do not put `FIREBASE_SERVICE_ACCOUNT_JSON` in the frontend or GitHub. Put it only in the Render backend environment.
