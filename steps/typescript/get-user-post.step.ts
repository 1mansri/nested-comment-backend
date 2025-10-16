import {
    ApiRouteConfig,
    ApiRouteHandler,
    ApiRequest,
    //   FlowContext,
} from 'motia';
import { z } from 'zod';
import db from '../../src/db/index';
import { posts, users } from '../../src/db/schemas/schema';
import { eq } from 'drizzle-orm';

const createNewCommentSchema = z.object({
    author_id: z
        .string({ required_error: 'Author ID is required' })
        .min(1, { message: 'Author ID must be at least 1 character long' })
        .uuid({
            message: 'Invalid UUID format',
        }),
});

// User schema for nested author object
const authorSchema = z.object({
    id: z.string().uuid(),
    clerk_user_id: z.string(),
    name: z.string(),
    email: z.string(),
    avatar_url: z.string().nullable(),
    role: z.string(),
    is_deleted: z.boolean(),
    created_at: z.date(),
});

const responseSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    body: z.string(),
    image_url: z.string().nullable().optional(),
    author_id: z.string(),
    is_deleted: z.boolean(),
    created_at: z.date(),
    author: authorSchema.nullable(),
});

export const config: ApiRouteConfig = {
    name: 'GetUserPost',
    type: 'api',
    path: '/get-user-post',
    method: 'POST',
    bodySchema: createNewCommentSchema,
    responseSchema: {
        200: z.array(responseSchema),
        400: z.object({ error: z.string() }),
    },
    flows: ['PostManagement'],
    emits: [],
};

export const handler: ApiRouteHandler<
    z.infer<typeof createNewCommentSchema>,
    { status: 200; body: any[] } | { status: 400; body: { error: string } }
> = async (req: ApiRequest<z.infer<typeof createNewCommentSchema>>, { logger }) => {
    // Schema validation happens automatically before this handler
    const { author_id: authorId } = req.body;

    // Defensive check: If authorId is empty or missing, return error
    if (!authorId || typeof authorId !== 'string' || authorId.trim() === '') {
        return { status: 400, body: { error: 'Author ID is required and cannot be empty' } };
    }

    const userPosts = await db
        .select({
            id: posts.id,
            title: posts.title,
            body: posts.body,
            image_url: posts.image_url,
            author_id: posts.author_id,
            is_deleted: posts.is_deleted,
            created_at: posts.created_at,
            author: {
                id: users.id,
                clerk_user_id: users.clerk_user_id,
                name: users.name,
                email: users.email,
                avatar_url: users.avatar_url,
                role: users.role,
                is_deleted: users.is_deleted,
                created_at: users.created_at,
            },
        })
        .from(posts)
        .leftJoin(users, eq(posts.author_id, users.id))
        .where(eq(posts.author_id, authorId));

    if (!userPosts || userPosts.length === 0) {
        return { status: 400, body: { error: 'No posts found for this user' } };
    }

    logger.info('Posts retrieved', { userId: authorId, count: userPosts.length });

    return { status: 200, body: userPosts };
};
