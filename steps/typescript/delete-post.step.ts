import { ApiRouteConfig, ApiRouteHandler, ApiRequest } from 'motia';
import { z } from 'zod';
import db from '../../src/db/index';
import { posts, users } from '../../src/db/schemas/schema';
import { eq } from 'drizzle-orm';

const deletePostSchema = z.object({
    post_id: z.string().uuid(),
    user_id: z.string().uuid(),
});

const responseSchema = z.object({
    message: z.string(),
    post_id: z.string().uuid(),
});

export const config: ApiRouteConfig = {
    name: 'DeletePost',
    type: 'api',
    path: '/delete-post',
    method: 'POST',
    bodySchema: deletePostSchema,
    responseSchema: {
        200: responseSchema,
        400: z.object({ error: z.string() }),
        403: z.object({ error: z.string() }),
    },
    flows: ['PostManagement'],
    emits: [],
};

export const handler: ApiRouteHandler<
    z.infer<typeof deletePostSchema>,
    | { status: 200; body: { message: string; post_id: string } }
    | { status: 400; body: { error: string } }
    | { status: 403; body: { error: string } }
> = async (req: ApiRequest<z.infer<typeof deletePostSchema>>, { logger }) => {
    const { post_id, user_id } = req.body;

    if (!post_id || post_id.length === 0) {
        return { status: 400, body: { error: 'Post ID is required' } };
    }
    if (!user_id || user_id.length === 0) {
        return { status: 400, body: { error: 'User ID is required' } };
    }

    // Check if post exists and is not already deleted
    const [post] = await db.select().from(posts).where(eq(posts.id, post_id));

    if (!post) {
        return { status: 400, body: { error: 'Post not found' } };
    }

    if (post.is_deleted) {
        return { status: 400, body: { error: 'Post is already deleted' } };
    }

    // Get user to check role
    const [user] = await db.select().from(users).where(eq(users.id, user_id));

    if (!user) {
        return { status: 400, body: { error: 'User not found' } };
    }

    // Check if user is the post author or admin
    const isAuthor = post.author_id === user_id;
    const isAdmin = user.role === 'admin';

    if (!isAuthor && !isAdmin) {
        return {
            status: 403,
            body: { error: 'You do not have permission to delete this post' },
        };
    }

    // Soft delete the post
    await db.update(posts).set({ is_deleted: true }).where(eq(posts.id, post_id));

    logger.info('Post deleted', {
        postId: post_id,
        userId: user_id,
        isAdmin,
    });

    return {
        status: 200,
        body: {
            message: 'Post deleted successfully',
            post_id,
        },
    };
};
