import {
    ApiRouteConfig,
    ApiRouteHandler,
    ApiRequest,
    //   FlowContext,
} from 'motia';
import { z } from 'zod';
import db from '../../src/db/index';
import { users, TNewUser, TUser } from '../../src/db/schemas/schema';
import { eq } from 'drizzle-orm';

const GetUserSchema = z.object({
    clerk_user_id: z.string().optional(),
    id: z.string().uuid().optional(),
});

const responseSchema = z.object({
    id: z.string().uuid(),
    clerk_user_id: z.string(),
    name: z.string(),
    email: z.string(),
    avatar_url: z.string().nullable(),
    role: z.string(),
    is_deleted: z.boolean(),
    created_at: z.date(),
});

export const config: ApiRouteConfig = {
    name: 'GetUser',
    type: 'api',
    path: '/get-user',
    method: 'POST',
    bodySchema: GetUserSchema,
    responseSchema: {
        201: responseSchema,
        400: z.object({ error: z.string() }),
    },
    flows: ['UserManagement'],
    emits: [],
};

export const handler: ApiRouteHandler<
    z.infer<typeof GetUserSchema>,
    { status: 201; body: TUser } | { status: 400; body: { error: string } }
> = async (req: ApiRequest<z.infer<typeof GetUserSchema>>, { logger }) => {
    const data = GetUserSchema.parse(req.body);

    logger.info('Attempting to get user', { clerkId: data.clerk_user_id });

    // Select and return the user
    if (!data.clerk_user_id && !data.id) {
        return { status: 400, body: { error: 'clerk_user_id or id is required' } };
    }
    
    const query = data.clerk_user_id 
        ? eq(users.clerk_user_id, data.clerk_user_id)
        : eq(users.id, data.id as string);
    const [user] = await db.select().from(users).where(query);

    if (!user) {
        return { status: 400, body: { error: 'User not found' } };
    }

    logger.info('User retrieved', { username: user.name });

    return { status: 201, body: user };
};
