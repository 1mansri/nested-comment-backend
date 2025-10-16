# Nested Comment System API Documentation

This document provides comprehensive documentation for the Nested Comment System backend API.

## Base URL

```
http://localhost:3000
```

## Authentication

The API uses Clerk for user authentication. The `user_id` should be obtained from your Clerk authentication flow and passed in request bodies where required.

For admin operations, ensure the user's `public_metadata.role` in Clerk is set to `"admin"`.

## User Data Population

All endpoints that return posts or comments now include populated user/author objects. This means:

- **Post endpoints** (`/get-recent-post`, `/get-user-post`) include an `author` object with complete user information
- **Comment endpoints** (`/get-post-comments`, `/get-comment-reply`, `/create-comment`) include a `user` object with complete user information

This eliminates the need for separate API calls to fetch user details and improves frontend performance by providing all necessary data in a single request.

---

## User Management

### 1. Create User

**Endpoint:** `POST /create-user`

**Description:** Creates a new user in the system.

**Request Body:**

```json
{
    "name": "John Doe",
    "clerk_user_id": "user_2abc123def456",
    "email": "john@example.com",
    "avatar_url": "https://example.com/avatar.jpg" // optional
}
```

**Response (201):**

```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "clerk_user_id": "user_2abc123def456",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar_url": "https://example.com/avatar.jpg",
    "role": "user",
    "is_deleted": false,
    "created_at": "2025-10-16T12:00:00Z"
}
```

**Error (400):**

```json
{
    "error": "User email already exists"
}
```

---

### 2. Get User

**Endpoint:** `POST /get-user`

**Description:** Retrieves user information by Clerk user ID.

**Request Body:**

```json
{
    "clerk_user_id": "user_2abc123def456"
}
```

**Response (201):**

```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "clerk_user_id": "user_2abc123def456",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar_url": "https://example.com/avatar.jpg",
    "role": "user",
    "is_deleted": false,
    "created_at": "2025-10-16T12:00:00Z"
}
```

**Error (400):**

```json
{
    "error": "User not found"
}
```

---

### 3. Clerk Webhook Handler

**Endpoint:** `POST /clerk-webhook`

**Description:** Handles webhook events from Clerk for user creation, updates, and deletion.

**Headers Required:**

- `svix-id`: Webhook message ID
- `svix-timestamp`: Webhook timestamp
- `svix-signature`: Webhook signature for verification

**Supported Events:**

- `user.created`: Automatically creates a user in the database
- `user.updated`: Updates user information (name, email, avatar, role)
- `user.deleted`: Soft deletes the user

**Environment Variable Required:**

```bash
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Response (200):**

```json
{
    "success": true,
    "message": "User created successfully"
}
```

**Error (400):**

```json
{
    "error": "Invalid webhook signature"
}
```

---

## Post Management

### 4. Create Post

**Endpoint:** `POST /create-post`

**Description:** Creates a new post.

**Request Body:**

```json
{
    "title": "My First Post",
    "author_id": "550e8400-e29b-41d4-a716-446655440000",
    "body": "This is the content of my post.",
    "image_url": "https://example.com/image.jpg" // optional
}
```

**Response (201):**

```json
{
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "title": "My First Post",
    "body": "This is the content of my post.",
    "author_id": "550e8400-e29b-41d4-a716-446655440000",
    "image_url": "https://example.com/image.jpg",
    "is_deleted": false,
    "created_at": "2025-10-16T12:00:00Z"
}
```

---

### 5. Get Recent Posts

**Endpoint:** `GET /get-recent-post`

**Description:** Retrieves the 15 most recent non-deleted posts with author information.

**Response (200):**

```json
[
    {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "title": "My First Post",
        "body": "This is the content of my post.",
        "image_url": "https://example.com/image.jpg",
        "author_id": "550e8400-e29b-41d4-a716-446655440000",
        "is_deleted": false,
        "created_at": "2025-10-16T12:00:00Z",
        "author": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "clerk_user_id": "user_2abc123def456",
            "name": "John Doe",
            "email": "john@example.com",
            "avatar_url": "https://example.com/avatar.jpg",
            "role": "user",
            "is_deleted": false,
            "created_at": "2025-10-16T12:00:00Z"
        }
    }
]
```

---

### 6. Get User Posts

**Endpoint:** `POST /get-user-post`

**Description:** Retrieves all posts by a specific user with author information.

**Request Body:**

```json
{
    "author_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200):**

```json
[
    {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "title": "My First Post",
        "body": "This is the content of my post.",
        "image_url": "https://example.com/image.jpg",
        "author_id": "550e8400-e29b-41d4-a716-446655440000",
        "is_deleted": false,
        "created_at": "2025-10-16T12:00:00Z",
        "author": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "clerk_user_id": "user_2abc123def456",
            "name": "John Doe",
            "email": "john@example.com",
            "avatar_url": "https://example.com/avatar.jpg",
            "role": "user",
            "is_deleted": false,
            "created_at": "2025-10-16T12:00:00Z"
        }
    }
]
```

---

### 7. Delete Post

**Endpoint:** `POST /delete-post`

**Description:** Soft deletes a post. Users can delete their own posts, admins can delete any post.

**Request Body:**

```json
{
    "post_id": "660e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200):**

```json
{
    "message": "Post deleted successfully",
    "post_id": "660e8400-e29b-41d4-a716-446655440000"
}
```

**Error (403):**

```json
{
    "error": "You do not have permission to delete this post"
}
```

---

## Comment Management

### 8. Create Comment

**Endpoint:** `POST /create-comment`

**Description:** Creates a new comment on a post or replies to an existing comment. Returns the created comment with user information.

**Request Body:**

```json
{
    "post_id": "660e8400-e29b-41d4-a716-446655440000",
    "parent_comment_id": null, // null for top-level comment, or UUID for reply
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "text": "This is my comment"
}
```

**Response (200):**

```json
{
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "post_id": "660e8400-e29b-41d4-a716-446655440000",
    "parent_comment_id": null,
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "text": "This is my comment",
    "upvotes": 0,
    "is_deleted": false,
    "created_at": "2025-10-16T12:00:00Z",
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "clerk_user_id": "user_2abc123def456",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar_url": "https://example.com/avatar.jpg",
        "role": "user",
        "is_deleted": false,
        "created_at": "2025-10-16T12:00:00Z"
    }
}
```

---

### 9. Get Post Comments

**Endpoint:** `POST /get-post-comments`

**Description:** Retrieves all comments for a specific post with optional sorting. Includes user information for each comment.

**Request Body:**

```json
{
    "post_id": "660e8400-e29b-41d4-a716-446655440000",
    "sort_by": "upvotes" // optional: "upvotes", "created_at" (newest first), "oldest"
}
```

**Response (200):**

```json
[
    {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "post_id": "660e8400-e29b-41d4-a716-446655440000",
        "parent_comment_id": null,
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "text": "This is my comment",
        "upvotes": 5,
        "is_deleted": false,
        "created_at": "2025-10-16T12:00:00Z",
        "user": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "clerk_user_id": "user_2abc123def456",
            "name": "John Doe",
            "email": "john@example.com",
            "avatar_url": "https://example.com/avatar.jpg",
            "role": "user",
            "is_deleted": false,
            "created_at": "2025-10-16T12:00:00Z"
        }
    }
]
```

**Sorting Options:**

- `upvotes`: Sort by most upvoted comments first
- `created_at`: Sort by newest comments first (default)
- `oldest`: Sort by oldest comments first

---

### 10. Get Comment Replies

**Endpoint:** `POST /get-comment-reply`

**Description:** Retrieves all replies to a specific comment with optional sorting. Includes user information for each reply.

**Request Body:**

```json
{
    "post_id": "660e8400-e29b-41d4-a716-446655440000",
    "parent_comment_id": "770e8400-e29b-41d4-a716-446655440000",
    "sort_by": "created_at" // optional: "upvotes", "created_at", "oldest"
}
```

**Response (200):**

```json
[
    {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "post_id": "660e8400-e29b-41d4-a716-446655440000",
        "parent_comment_id": "770e8400-e29b-41d4-a716-446655440000",
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "text": "This is a reply",
        "upvotes": 2,
        "is_deleted": false,
        "created_at": "2025-10-16T12:30:00Z",
        "user": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "clerk_user_id": "user_2abc123def456",
            "name": "John Doe",
            "email": "john@example.com",
            "avatar_url": "https://example.com/avatar.jpg",
            "role": "user",
            "is_deleted": false,
            "created_at": "2025-10-16T12:00:00Z"
        }
    }
]
```

---

### 11. Upvote Comment

**Endpoint:** `POST /upvote-comment`

**Description:** Upvotes a comment. If user already upvoted, removes the upvote (toggle behavior).

**Request Body:**

```json
{
    "comment_id": "770e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200) - Upvote Added:**

```json
{
    "comment_id": "770e8400-e29b-41d4-a716-446655440000",
    "upvotes": 6,
    "message": "Upvote added successfully"
}
```

**Response (200) - Upvote Removed:**

```json
{
    "comment_id": "770e8400-e29b-41d4-a716-446655440000",
    "upvotes": 5,
    "message": "Upvote removed successfully"
}
```

---

### 12. Delete Comment

**Endpoint:** `POST /delete-comment`

**Description:** Soft deletes a comment. Users can delete their own comments, admins can delete any comment.

**Request Body:**

```json
{
    "comment_id": "770e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200):**

```json
{
    "message": "Comment deleted successfully",
    "comment_id": "770e8400-e29b-41d4-a716-446655440000"
}
```

**Error (403):**

```json
{
    "error": "You do not have permission to delete this comment"
}
```

---

## Database Schema

### Users Table

```typescript
{
  id: UUID (Primary Key),
  clerk_user_id: String (Unique),
  name: String,
  email: String,
  avatar_url: String (Nullable),
  role: String (default: "user"), // "user" or "admin"
  is_deleted: Boolean (default: false),
  created_at: Timestamp
}
```

### Posts Table

```typescript
{
  id: UUID (Primary Key),
  title: String,
  body: Text,
  image_url: String (Nullable),
  author_id: UUID (Foreign Key -> users.id),
  is_deleted: Boolean (default: false),
  created_at: Timestamp
}
```

### Comments Table

```typescript
{
  id: UUID (Primary Key),
  post_id: UUID (Foreign Key -> posts.id),
  parent_comment_id: UUID (Nullable, Self-reference),
  user_id: UUID (Foreign Key -> users.id),
  text: Text,
  upvotes: Integer (default: 0),
  is_deleted: Boolean (default: false),
  created_at: Timestamp
}
```

### Upvotes Table

```typescript
{
  id: UUID (Primary Key),
  comment_id: UUID (Foreign Key -> comments.id),
  user_id: UUID (Foreign Key -> users.id),
  created_at: Timestamp
}
```

---

## Admin Features

To make a user an admin, set their Clerk `public_metadata` with:

```json
{
    "role": "admin"
}
```

This can be done in the Clerk Dashboard or via the Clerk API. When the user is created or updated via webhook, the role will be synchronized to the database.

**Admin Privileges:**

- Delete any user's posts
- Delete any user's comments
- All regular user permissions

---

## Setup Instructions

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nested_comments

# Clerk
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Clerk Webhook Setup

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to Webhooks section
3. Create a new endpoint with URL: `https://yourdomain.com/clerk-webhook`
4. Subscribe to events: `user.created`, `user.updated`, `user.deleted`
5. Copy the signing secret and add it to your `.env` file

### Install Dependencies

```bash
npm install
```

### Database Setup

```bash
npm run db:push
```

### Run Development Server

```bash
npm run dev
```

---

## Error Codes

- `200`: Success
- `201`: Resource created successfully
- `400`: Bad request (invalid input or resource not found)
- `403`: Forbidden (insufficient permissions)

---

## Notes

- All IDs use UUID v4 format
- Timestamps are in ISO 8601 format
- Soft deletion is used throughout (records marked as deleted, not removed)
- Comments support unlimited nesting via `parent_comment_id`
- Upvotes use a toggle mechanism (click once to upvote, click again to remove)

---

## Example Workflows

### Creating a Nested Comment Thread

1. Create a post: `POST /create-post`
2. Create a top-level comment: `POST /create-comment` with `parent_comment_id: null`
3. Reply to that comment: `POST /create-comment` with `parent_comment_id: <comment_id_from_step_2>`
4. Reply to the reply: `POST /create-comment` with `parent_comment_id: <comment_id_from_step_3>`

### Fetching Comments with Nesting

1. Get all top-level comments: `POST /get-post-comments`
2. For each comment, fetch replies: `POST /get-comment-reply` with the comment's ID
3. Recursively fetch replies for nested comments

### Admin Deleting Content

1. Set user role to admin in Clerk public_metadata
2. Use any user_id with admin role in delete endpoints
3. Can delete any post or comment regardless of ownership
