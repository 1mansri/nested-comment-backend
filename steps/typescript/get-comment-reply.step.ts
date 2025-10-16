import {
    ApiRouteConfig,
    ApiRouteHandler,
    ApiRequest,
    //   FlowContext,
} from 'motia';
import { z } from 'zod';
import db from '../../src/db/index';
import { comments, users } from '../../src/db/schemas/schema';
import { and, eq, desc, asc } from 'drizzle-orm';

const createNewCommentSchema = z.object({
    post_id: z.string().uuid(),
    parent_comment_id: z.string().uuid().nullable(),
    sort_by: z.enum(['upvotes', 'created_at', 'oldest']).optional().default('created_at'),
});

// User schema for nested user object
const userSchema = z.object({
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
    post_id: z.string().uuid(),
    parent_comment_id: z.string().uuid().nullable().optional(),
    user_id: z.string().uuid(),
    text: z.string(),
    upvotes: z.number().int(),
    is_deleted: z.boolean(),
    created_at: z.date(),
    user: userSchema.nullable(),
});

export const config: ApiRouteConfig = {
    name: 'GetCommentReply',
    type: 'api',
    path: '/get-comment-reply',
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
    const { post_id: postId, parent_comment_id: parentCommentId, sort_by: sortBy } = req.body;

    if (!postId || postId.length === 0) {
        return { status: 400, body: { error: 'Post ID is required' } };
    }
    if (!parentCommentId || parentCommentId.length === 0) {
        return { status: 400, body: { error: 'Parent Comment ID is required' } };
    }

    // Determine sorting order
    let orderByClause;
    switch (sortBy || 'created_at') {
        case 'upvotes':
            orderByClause = desc(comments.upvotes);
            break;
        case 'oldest':
            orderByClause = asc(comments.created_at);
            break;
        case 'created_at':
        default:
            orderByClause = desc(comments.created_at);
            break;
    }

    const commentsForPost = await db
        .select({
            id: comments.id,
            post_id: comments.post_id,
            parent_comment_id: comments.parent_comment_id,
            user_id: comments.user_id,
            text: comments.text,
            upvotes: comments.upvotes,
            is_deleted: comments.is_deleted,
            created_at: comments.created_at,
            user: {
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
        .from(comments)
        .leftJoin(users, eq(comments.user_id, users.id))
        .where(and(eq(comments.post_id, postId), eq(comments.parent_comment_id, parentCommentId)))
        .orderBy(orderByClause);

    if (!commentsForPost || commentsForPost.length === 0) {
        return { status: 400, body: { error: 'No comments found for this post' } };
    }

    logger.info('Comments retrieved', { postId, parentCommentId, count: commentsForPost.length, sortBy });

    return { status: 200, body: commentsForPost };
};
