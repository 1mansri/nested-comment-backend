import {
    ApiRouteConfig,
    ApiRouteHandler,
    ApiRequest,
    //   FlowContext,
} from 'motia';
import { z } from 'zod';
import db from '../../src/db/index';
import { comments, TComment, TNewComment } from '../../src/db/schemas/schema';
import { and, eq, desc, asc } from 'drizzle-orm';

const createNewCommentSchema = z.object({
    post_id: z.string().uuid(),
    parent_comment_id: z.string().uuid().nullable(),
    sort_by: z.enum(['upvotes', 'created_at', 'oldest']).optional().default('created_at'),
});

const responseSchema = z.object({
    id: z.string().uuid(),
    post_id: z.string().uuid(),
    parent_comment_id: z.string().uuid().nullable().optional(),
    user_id: z.string().uuid(),
    text: z.string(),
    upvotes: z.number().int().optional(),
});

export const config: ApiRouteConfig = {
    name: 'GetCommentReply',
    type: 'api',
    path: '/get-comment-reply',
    method: 'POST',
    bodySchema: createNewCommentSchema,
    responseSchema: {
        200: z.array(responseSchema), // Changed to 200 and return array of comments
        400: z.object({ error: z.string() }),
    },
    flows: ['PostManagement'],
    emits: [],
};

export const handler: ApiRouteHandler<
    z.infer<typeof createNewCommentSchema>,
    { status: 200; body: TComment[] } | { status: 400; body: { error: string } }
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
        .select()
        .from(comments)
        .where(and(eq(comments.post_id, postId), eq(comments.parent_comment_id, parentCommentId)))
        .orderBy(orderByClause);

    if (!commentsForPost || commentsForPost.length === 0) {
        return { status: 400, body: { error: 'No comments found for this post' } };
    }

    logger.info('Comments retrieved', { postId, parentCommentId, count: commentsForPost.length, sortBy });

    return { status: 200, body: commentsForPost };
};
