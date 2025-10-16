import { ApiRouteConfig, ApiRouteHandler, ApiRequest } from 'motia';
import { z } from 'zod';
import db from '../../src/db/index';
import { comments, upvotes } from '../../src/db/schemas/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const upvoteCommentSchema = z.object({
    comment_id: z.string().uuid(),
    user_id: z.string().uuid(),
});

const responseSchema = z.object({
    comment_id: z.string().uuid(),
    upvotes: z.number().int(),
    message: z.string(),
});

export const config: ApiRouteConfig = {
    name: 'UpvoteComment',
    type: 'api',
    path: '/upvote-comment',
    method: 'POST',
    bodySchema: upvoteCommentSchema,
    responseSchema: {
        200: responseSchema,
        400: z.object({ error: z.string() }),
    },
    flows: ['PostManagement'],
    emits: [],
};

export const handler: ApiRouteHandler<
    z.infer<typeof upvoteCommentSchema>,
    | { status: 200; body: { comment_id: string; upvotes: number; message: string } }
    | { status: 400; body: { error: string } }
> = async (req: ApiRequest<z.infer<typeof upvoteCommentSchema>>, { logger }) => {
    const { comment_id, user_id } = req.body;

    if (!comment_id || comment_id.length === 0) {
        return { status: 400, body: { error: 'Comment ID is required' } };
    }
    if (!user_id || user_id.length === 0) {
        return { status: 400, body: { error: 'User ID is required' } };
    }

    // Check if comment exists
    const [comment] = await db.select().from(comments).where(eq(comments.id, comment_id));

    if (!comment) {
        return { status: 400, body: { error: 'Comment not found' } };
    }

    // Check if user already upvoted this comment
    const [existingUpvote] = await db
        .select()
        .from(upvotes)
        .where(and(eq(upvotes.comment_id, comment_id), eq(upvotes.user_id, user_id)));

    if (existingUpvote) {
        // User already upvoted, so remove the upvote (toggle behavior)
        await db.delete(upvotes).where(eq(upvotes.id, existingUpvote.id));

        // Decrement upvote count
        const [updatedComment] = await db
            .update(comments)
            .set({ upvotes: comment.upvotes - 1 })
            .where(eq(comments.id, comment_id))
            .returning();

        logger.info('Upvote removed', { commentId: comment_id, userId: user_id });

        return {
            status: 200,
            body: {
                comment_id: updatedComment.id,
                upvotes: updatedComment.upvotes,
                message: 'Upvote removed successfully',
            },
        };
    } else {
        // Add new upvote
        await db.insert(upvotes).values({
            id: randomUUID(),
            comment_id,
            user_id,
            created_at: new Date(),
        });

        // Increment upvote count
        const [updatedComment] = await db
            .update(comments)
            .set({ upvotes: comment.upvotes + 1 })
            .where(eq(comments.id, comment_id))
            .returning();

        logger.info('Upvote added', { commentId: comment_id, userId: user_id });

        return {
            status: 200,
            body: {
                comment_id: updatedComment.id,
                upvotes: updatedComment.upvotes,
                message: 'Upvote added successfully',
            },
        };
    }
};
