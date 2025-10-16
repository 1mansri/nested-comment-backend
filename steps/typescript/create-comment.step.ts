import {
    ApiRouteConfig,
    ApiRouteHandler,
    ApiRequest,
    //   FlowContext,
} from 'motia';
import { z } from 'zod';
import db from '../../src/db/index';
import { comments, TNewComment } from '../../src/db/schemas/schema';
import { randomUUID } from 'crypto';

const createNewCommentSchema = z.object({
    post_id: z.string().uuid(),
    parent_comment_id: z.string().uuid().nullable().optional(),
    user_id: z.string().uuid(),
    text: z.string(),
    upvotes: z.number().int().optional(),
});

const responseSchema = z.object({
    id: z.string(),
    text: z.string(),
    upvotes: z.number().int(),
    post_id: z.string().uuid(),
    parent_comment_id: z.string().uuid().nullable().optional(),
    user_id: z.string().uuid(),
    created_at: z.date(),
    is_deleted: z.boolean(),
});

export const config: ApiRouteConfig = {
    name: 'CreateComment',
    type: 'api',
    path: '/create-comment',
    method: 'POST',
    bodySchema: createNewCommentSchema,
    responseSchema: {
        200: responseSchema,
        400: z.object({ error: z.string() }),
    },
    flows: ['PostManagement'],
    emits: [],
};

export const handler: ApiRouteHandler<
    z.infer<typeof createNewCommentSchema>,
    { status: 200; body: TNewComment } | { status: 400; body: { error: string } }
> = async (req: ApiRequest<z.infer<typeof createNewCommentSchema>>, { logger }) => {
    const data = req.body;

    if (!data.post_id || data.post_id.length === 0) {
        return { status: 400, body: { error: 'Post ID is required' } };
    }
    if (!data.user_id || data.user_id.length === 0) {
        return { status: 400, body: { error: 'User ID is required' } };
    }
    if (!data.text || data.text.trim().length === 0) {
        return { status: 400, body: { error: 'Comment text cannot be empty' } };
    }
    const commentData: TNewComment = {
        ...data,
        parent_comment_id: data.parent_comment_id ?? null,
        upvotes: 0,
        id: randomUUID(),
        created_at: new Date(),
        is_deleted: false,
    };
    logger.info('Attempting to create comment', { text: data.text });

    // Insert and return the created comment
    const [createdComment] = await db.insert(comments).values(commentData).returning();

    logger.info('Comment created', { comment: createdComment.text });

    return { status: 200, body: createdComment };
};
