import {
    ApiRouteConfig,
    ApiRouteHandler,
    ApiRequest,
    //   FlowContext,
} from 'motia';
import { z } from 'zod';
import db from '../../src/db/index';
import { posts, TPost } from '../../src/db/schemas/schema';
import { eq } from 'drizzle-orm';

const createNewCommentSchema = z.object({
    author_id: z.string({ required_error: 'Author ID is required' }).min(1, { message: 'Author ID must be at least 1 character long' }).uuid({
        message: 'Invalid UUID format',
    }),
});

const responseSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    body: z.string(),
    author_id: z.string(),
    is_deleted: z.boolean(),
    created_at: z.date(),
});

export const config: ApiRouteConfig = {
    name: 'GetUserPost',
    type: 'api',
    path: '/get-user-post',
    method: 'POST',
    bodySchema: createNewCommentSchema,
    responseSchema: {
        200: z.array(responseSchema), // Changed to 200 and return array of posts
        400: z.object({ error: z.string() }),
    },
    flows: ['PostManagement'],
    emits: [],
};

export const handler: ApiRouteHandler<
    z.infer<typeof createNewCommentSchema>,
    { status: 200; body: TPost[] } | { status: 400; body: { error: string } }
> = async (req: ApiRequest<z.infer<typeof createNewCommentSchema>>, { logger }) => {
    // Schema validation happens automatically before this handler
    const { author_id: authorId } = req.body;

    // Defensive check: If authorId is empty or missing, return error
    if (!authorId || typeof authorId !== 'string' || authorId.trim() === '') {
        return { status: 400, body: { error: 'Author ID is required and cannot be empty' } };
    }

    const userPost = await db.select().from(posts).where(eq(posts.author_id, authorId));

    if (!userPost || userPost.length === 0) {
        return { status: 400, body: { error: 'No posts found for this user' } };
    }

    logger.info('Posts retrieved', { userId: authorId, count: userPost.length });

    return { status: 200, body: userPost };
};
