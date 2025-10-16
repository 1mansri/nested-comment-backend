import {
    ApiRouteConfig,
    ApiRouteHandler,
    ApiRequest,
    //   FlowContext,
} from 'motia';
import { z } from 'zod';
import db from '../../src/db/index';
import { posts, TPost, TNewPost } from '../../src/db/schemas/schema';
import { randomUUID } from 'crypto';

const createNewPostSchema = z.object({
    title: z.string(),
    author_id: z.string().uuid(),
    body: z.string(),
    image_url: z.string().nullable().optional(),
});

const responseSchema = z.object({
    id: z.string(),
    title: z.string(),
    body: z.string(),
    author_id: z.string(),
});

export const config: ApiRouteConfig = {
    name: 'CreatePost',
    type: 'api',
    path: '/create-post',
    method: 'POST',
    bodySchema: createNewPostSchema,
    responseSchema: {
        201: responseSchema,
        400: z.object({ error: z.string() }),
    },
    flows: ['PostManagement'],
    emits: [],
};

export const handler: ApiRouteHandler<
    z.infer<typeof createNewPostSchema>,
    { status: 201; body: TPost } | { status: 400; body: { error: string } }
> = async (req: ApiRequest<z.infer<typeof createNewPostSchema>>, { logger }) => {
    const data = createNewPostSchema.parse(req.body);

    const postData: TNewPost = { ...data, id: randomUUID(), created_at: new Date(), is_deleted: false };
    logger.info('Attempting to create post', { title: data.title });

    // Insert and return the created post
    const [post] = await db
        .insert(posts)
        .values(postData as TNewPost)
        .returning();

    logger.info('Post created', { postId: post.id });

    return { status: 201, body: post };
};
