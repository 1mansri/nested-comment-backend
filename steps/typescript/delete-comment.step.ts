import { ApiRouteConfig, ApiRouteHandler, ApiRequest } from 'motia';
import { z } from 'zod';
import db from '../../src/db/index';
import { comments, users } from '../../src/db/schemas/schema';
import { eq, and } from 'drizzle-orm';

const deleteCommentSchema = z.object({
    comment_id: z.string().uuid(),
    user_id: z.string().uuid(),
});

const responseSchema = z.object({
    message: z.string(),
    comment_id: z.string().uuid(),
});

export const config: ApiRouteConfig = {
    name: 'DeleteComment',
    type: 'api',
    path: '/delete-comment',
    method: 'POST',
    bodySchema: deleteCommentSchema,
    responseSchema: {
        200: responseSchema,
        400: z.object({ error: z.string() }),
        403: z.object({ error: z.string() }),
    },
    flows: ['PostManagement'],
    emits: [],
};

export const handler: ApiRouteHandler<
    z.infer<typeof deleteCommentSchema>,
    | { status: 200; body: { message: string; comment_id: string } }
    | { status: 400; body: { error: string } }
    | { status: 403; body: { error: string } }
> = async (req: ApiRequest<z.infer<typeof deleteCommentSchema>>, { logger }) => {
    const { comment_id, user_id } = req.body;

    if (!comment_id || comment_id.length === 0) {
        return { status: 400, body: { error: 'Comment ID is required' } };
    }
    if (!user_id || user_id.length === 0) {
        return { status: 400, body: { error: 'User ID is required' } };
    }

    // Check if comment exists and is not already deleted
    const [comment] = await db.select().from(comments).where(eq(comments.id, comment_id));

    if (!comment) {
        return { status: 400, body: { error: 'Comment not found' } };
    }

    if (comment.is_deleted) {
        return { status: 400, body: { error: 'Comment is already deleted' } };
    }

    // Get user to check role from clerk metadata
    const [user] = await db.select().from(users).where(eq(users.id, user_id));

    if (!user) {
        return { status: 400, body: { error: 'User not found' } };
    }

    // Check if user is the comment owner or admin
    const isOwner = comment.user_id === user_id;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
        return {
            status: 403,
            body: { error: 'You do not have permission to delete this comment' },
        };
    }

    // Soft delete the comment
    await db.update(comments).set({ is_deleted: true }).where(eq(comments.id, comment_id));

    logger.info('Comment deleted', {
        commentId: comment_id,
        userId: user_id,
        isAdmin,
    });

    return {
        status: 200,
        body: {
            message: 'Comment deleted successfully',
            comment_id,
        },
    };
};
