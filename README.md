# Coursify (Be-coursify)

Backend for a course-selling platform. Admins (creators) publish courses; users sign up and purchase them, much like Udemy.

> **Note**: Payment integration has not been done yet. `purchase-course` records the purchase without charging anything.

## Features

- **Admin / creator**: sign up, sign in, create, update and delete their own courses, list their courses.
- **Users**: sign up, sign in, browse the public catalogue, purchase a course (once), list purchased courses.
- Security basics: bcrypt password hashing, JWT auth (separate secrets for users and admins, tokens expire), Zod input validation, per-creator ownership checks, rate limiting on auth routes, `helmet` headers, configurable CORS.

## Tech stack

Node.js, Express 4, MongoDB + Mongoose, JWT, bcrypt, Zod, helmet, express-rate-limit.

## API

Send the token as `Authorization: Bearer <token>` (the older `token` header is still accepted).

| Method | Route | Auth | Body |
|---|---|---|---|
| GET | `/health` | none | |
| POST | `/api/user/signup` | none | `email, password (min 8), FirstName, LastName` |
| POST | `/api/user/signin` | none | `email, password` -> `{ token }` |
| POST | `/api/user/purchase-course` | user | `courseId` |
| GET | `/api/user/courses` | user | purchased courses |
| POST | `/api/admin/signup` | none | same as user signup |
| POST | `/api/admin/signin` | none | `email, password` -> `{ token }` |
| POST | `/api/admin/create-course` | admin | `title, price, thumbnailUrl?` |
| POST | `/api/admin/update-course` | admin | `courseId` + any of `title, price, thumbnailUrl` |
| DELETE | `/api/admin/Delete-course` | admin | `courseId` |
| GET | `/api/admin/courses/all` | admin | the creator's own courses |
| GET | `/api/course/courses/all` | none | public catalogue |

Example:

```bash
curl -X POST http://localhost:3000/api/user/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","password":"a-long-password","FirstName":"Me","LastName":"Tester"}'

curl -X POST http://localhost:3000/api/user/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","password":"a-long-password"}'
```

## Run locally

1. Copy `.env.example` to `.env` and fill it in (see the table below).
2. Install and start:
   ```bash
   npm install
   npm start        # or: npm run dev   (auto-restart on changes)
   ```
3. Run the tests: `npm test`

## Environment variables

| Name | Required | Purpose |
|---|---|---|
| `MongooseURL` | yes | MongoDB connection string (for example from MongoDB Atlas) |
| `JWT_SECRET_KEY_USER` | yes | secret for user tokens (use a long random string) |
| `JWT_SECRET_KEY_ADMIN` | yes | secret for admin tokens (must differ from the user secret) |
| `PORT` | no | defaults to 3000; hosting platforms set it automatically |
| `CORS_ORIGIN` | no | allowed frontend origin(s), comma separated; all origins when unset |
| `JWT_EXPIRES_IN` | no | token lifetime, default `1d` |

## Deploy (Render + MongoDB Atlas)

1. Create a free MongoDB Atlas cluster, a database user and allow network access; copy the connection string.
2. On Render choose **New > Web Service**, connect this repo, runtime **Node**.
3. Build command `npm install`, start command `npm start`, health check path `/health`.
4. Add the environment variables from the table above, then deploy.
5. Open `https://<your-service>.onrender.com/health` to confirm it is up.

Free Render services sleep after about 15 minutes without traffic, so the first request after a pause can take up to a minute.

## Demo
Set `SEED_DEMO=true` to load demo data on start (learner demo-user@coursify.dev, instructor demo-admin@coursify.dev, password Demo@12345). `/` serves a small live console that calls the API.
