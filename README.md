# Nested Comment System Backend

A robust backend API for a nested commenting system built with TypeScript, Drizzle ORM, and PostgreSQL. Features include multi-level comment nesting, upvoting, admin privileges, and Clerk authentication integration.

## Features

### Core Features

- ✅ **Nested Comments**: Unlimited nesting depth for threaded discussions
- ✅ **User Management**: Full CRUD with Clerk webhook integration
- ✅ **Post Management**: Create, read, and soft-delete posts
- ✅ **Comment Management**: Create, read, and soft-delete comments
- ✅ **Upvoting System**: Toggle upvotes on comments
- ✅ **Comment Sorting**: Sort by upvotes, newest, or oldest
- ✅ **Soft Deletion**: Non-destructive deletion for posts and comments

### Advanced Features

- ✅ **Admin Privileges**: Admins can delete any content
- ✅ **Clerk Webhook Integration**: Automatic user sync from Clerk
- ✅ **Role-Based Access Control**: User and admin roles
- ✅ **Webhook Signature Verification**: Secure webhook handling with Svix

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Motia (API step framework)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Clerk (webhook integration)
- **Validation**: Zod
- **Webhook Security**: Svix

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Clerk account (for authentication webhooks)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd nested-comment-backend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/nested_comments
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
PORT=3000
NODE_ENV=development
```

4. Set up the database:

```bash
npm run db:push
```

5. Start the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Database Schema

The system uses four main tables:

### Users

- Stores user information synced from Clerk
- Fields: id, clerk_user_id, name, email, avatar_url, role, is_deleted, created_at

### Posts

- Stores user-created posts
- Fields: id, title, body, image_url, author_id, is_deleted, created_at

### Comments

- Supports nested threading via self-referencing parent_comment_id
- Fields: id, post_id, parent_comment_id, user_id, text, upvotes, is_deleted, created_at

### Upvotes

- Tracks user upvotes on comments
- Fields: id, comment_id, user_id, created_at

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference including:

- All endpoints with request/response schemas
- Authentication requirements
- Error codes
- Example workflows

### Key Endpoints

**User Management**

- `POST /create-user` - Create a new user
- `POST /get-user` - Get user by Clerk ID
- `POST /clerk-webhook` - Handle Clerk webhook events

**Post Management**

- `POST /create-post` - Create a post
- `GET /get-recent-post` - Get 15 most recent posts
- `POST /get-user-post` - Get posts by user
- `POST /delete-post` - Soft delete a post

**Comment Management**

- `POST /create-comment` - Create comment or reply
- `POST /get-post-comments` - Get all comments for a post (with sorting)
- `POST /get-comment-reply` - Get replies to a comment (with sorting)
- `POST /upvote-comment` - Toggle upvote on a comment
- `POST /delete-comment` - Soft delete a comment

## Clerk Webhook Setup

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to **Webhooks** → **Add Endpoint**
3. Set endpoint URL: `https://yourdomain.com/clerk-webhook`
4. Subscribe to events:
    - `user.created`
    - `user.updated`
    - `user.deleted`
5. Copy the **Signing Secret** and add to `.env`:

```env
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## Admin Setup

To grant admin privileges to a user:

1. Go to Clerk Dashboard → Users
2. Select the user
3. Navigate to **Metadata** → **Public metadata**
4. Add:

```json
{
    "role": "admin"
}
```

The role will sync to the database on the next webhook event (user.updated).

**Admin Privileges:**

- Delete any user's posts
- Delete any user's comments

## Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Generate TypeScript types
npm run generate-types

# Open Drizzle Studio (database GUI)
npm run db:studio

# Push database schema changes
npm run db:push

# Clean build artifacts
npm run clean
```

### Project Structure

```
nested-comment-backend/
├── src/
│   └── db/
│       ├── index.ts              # Database connection
│       └── schemas/
│           └── schema.ts         # Drizzle schema definitions
├── steps/
│   └── typescript/
│       ├── create-user.step.ts
│       ├── get-user.step.ts
│       ├── clerk-webhook.step.ts
│       ├── create-post.step.ts
│       ├── get-recent-post.step.ts
│       ├── get-user-post.step.ts
│       ├── delete-post.step.ts
│       ├── create-comment.step.ts
│       ├── get-post-comment.step.ts
│       ├── get-comment-reply.step.ts
│       ├── upvote-comment.step.ts
│       └── delete-comment.step.ts
├── .env.example
├── API_DOCUMENTATION.md
├── package.json
├── tsconfig.json
├── drizzle.config.ts
└── docker-compose.yml
```

## Docker Deployment

The project includes a `docker-compose.yml` for containerized deployment:

```bash
docker-compose up -d
```

## Features Implementation Status

| Feature                   | Status      |
| ------------------------- | ----------- |
| User CRUD                 | ✅ Complete |
| Post CRUD                 | ✅ Complete |
| Comment CRUD              | ✅ Complete |
| Nested Comments           | ✅ Complete |
| Upvoting                  | ✅ Complete |
| Comment Sorting           | ✅ Complete |
| Soft Deletion             | ✅ Complete |
| Admin Privileges          | ✅ Complete |
| Clerk Webhook Integration | ✅ Complete |
| Role-Based Access Control | ✅ Complete |
| API Documentation         | ✅ Complete |

## Security

- ✅ Webhook signature verification using Svix
- ✅ Input validation with Zod schemas
- ✅ Role-based authorization for deletions
- ✅ Prepared statements via Drizzle ORM (SQL injection protection)
- ✅ Soft deletion (data preservation)

## Troubleshooting

### Webhook Verification Failed

- Ensure `CLERK_WEBHOOK_SECRET` matches your Clerk endpoint's signing secret
- Check that webhook headers (svix-id, svix-timestamp, svix-signature) are present

### Database Connection Issues

- Verify `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- Ensure PostgreSQL is running
- Check firewall settings

### Comments Not Nesting

- Verify `parent_comment_id` references a valid comment ID
- Ensure `post_id` matches for parent and child comments

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on the GitHub repository.
