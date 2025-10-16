import {
    ApiRouteConfig,
    ApiRouteHandler,
    ApiRequest,
    //   FlowContext,
} from 'motia';
import { z } from 'zod';
import db from '../../src/db/index';
import { posts, TPost } from '../../src/db/schemas/schema';
import { eq, desc } from 'drizzle-orm';


const responseSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    body: z.string(),
    author_id: z.string(),
    is_deleted: z.boolean(),
    created_at: z.date(),
});

export const config: ApiRouteConfig = {
    name: 'GetRecentPost',
    type: 'api',
    path: '/get-recent-post',
    method: 'GET',
    responseSchema: {
        200: z.array(responseSchema), // Changed to 200 and return array of posts
        400: z.object({ error: z.string() }),
    },
    flows: ['PostManagement'],
    emits: [],
};

export const handler: ApiRouteHandler<
    { status: 200; body: TPost[] } | { status: 400; body: { error: string } }
> = async (req: ApiRequest, { logger }) => {
    // Schema validation happens automatically before this handler
 

    const recentPost = await db.select().from(posts).where(eq(posts.is_deleted, false)).orderBy(desc(posts.created_at)).limit(15);

    if (!recentPost || recentPost.length === 0) {
        return { status: 400, body: { error: 'No posts found for this user' } };
    }

    logger.info('Recent posts retrieved', { count: recentPost.length });

    return { status: 200, body: recentPost };
};
