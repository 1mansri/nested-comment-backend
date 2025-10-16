import {
    ApiRouteConfig,
    ApiRouteHandler,
    ApiRequest,
    //   FlowContext,
} from 'motia';
import { z } from 'zod';
import db from '../../src/db/index';
import { posts, users } from '../../src/db/schemas/schema';
import { eq, desc } from 'drizzle-orm';

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
    name: 'GetRecentPost',
    type: 'api',
    path: '/get-recent-post',
    method: 'GET',
    responseSchema: {
        200: z.array(responseSchema),
        400: z.object({ error: z.string() }),
    },
    flows: ['PostManagement'],
    emits: [],
};

export const handler: ApiRouteHandler<{ status: 200; body: any[] } | { status: 400; body: { error: string } }> = async (
    req: ApiRequest,
    { logger },
) => {
    // Schema validation happens automatically before this handler

    const recentPosts = await db
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
        .where(eq(posts.is_deleted, false))
        .orderBy(desc(posts.created_at))
        .limit(15);

    if (!recentPosts || recentPosts.length === 0) {
        return { status: 400, body: { error: 'No posts found' } };
    }

    logger.info('Recent posts retrieved', { count: recentPosts.length });

    return { status: 200, body: recentPosts };
};
