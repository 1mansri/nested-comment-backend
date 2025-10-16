import { ApiRouteConfig, ApiRouteHandler, ApiRequest } from 'motia';
import { z } from 'zod';
import { Webhook } from 'svix';
import db from '../../src/db/index';
import { users } from '../../src/db/schemas/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Clerk webhook event types
const clerkWebhookSchema = z.object({
    type: z.enum(['user.created', 'user.updated', 'user.deleted']),
    data: z.object({
        id: z.string(), // Clerk user ID
        email_addresses: z
            .array(
                z.object({
                    email_address: z.string(),
                    id: z.string(),
                }),
            )
            .optional(),
        first_name: z.string().nullable().optional(),
        last_name: z.string().nullable().optional(),
        image_url: z.string().nullable().optional(),
        public_metadata: z.record(z.any()).optional(),
        username: z.string().nullable().optional(),
    }),
});

const responseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
});

export const config: ApiRouteConfig = {
    name: 'ClerkWebhook',
    type: 'api',
    path: '/clerk-webhook',
    method: 'POST',
    responseSchema: {
        200: responseSchema,
        400: z.object({ error: z.string() }),
    },
    flows: ['UserManagement'],
    emits: [],
};

export const handler: ApiRouteHandler<
    { status: 200; body: { success: boolean; message: string } } | { status: 400; body: { error: string } }
> = async (req: ApiRequest, { logger }) => {
    // Get Clerk webhook secret from environment
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
        logger.error('CLERK_WEBHOOK_SECRET is not set');
        return { status: 400, body: { error: 'Webhook secret not configured' } };
    }

    // Get headers for verification
    const svix_id = req.headers['svix-id'] as string;
    const svix_timestamp = req.headers['svix-timestamp'] as string;
    const svix_signature = req.headers['svix-signature'] as string;

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return { status: 400, body: { error: 'Missing svix headers' } };
    }

    // Verify the webhook signature
    const wh = new Webhook(webhookSecret);
    let evt: z.infer<typeof clerkWebhookSchema>;

    try {
        evt = wh.verify(JSON.stringify(req.body), {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        }) as z.infer<typeof clerkWebhookSchema>;
    } catch (err) {
        logger.error('Webhook verification failed', { error: err });
        return { status: 400, body: { error: 'Invalid webhook signature' } };
    }

    // Parse and validate the event
    const eventType = evt.type;
    const userData = evt.data;

    logger.info('Clerk webhook received', { eventType, clerkUserId: userData.id });

    try {
        switch (eventType) {
            case 'user.created': {
                // Extract user information
                const primaryEmail = userData.email_addresses?.[0]?.email_address;

                if (!primaryEmail) {
                    return { status: 400, body: { error: 'No email address found' } };
                }

                const name =
                    `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username ||
                    'Anonymous User';

                // Get role from public_metadata, default to 'user'
                const role = (userData.public_metadata?.role as string) || 'user';

                // Check if user already exists
                const [existingUser] = await db.select().from(users).where(eq(users.clerk_user_id, userData.id));

                if (existingUser) {
                    logger.info('User already exists', { clerkUserId: userData.id });
                    return {
                        status: 200,
                        body: {
                            success: true,
                            message: 'User already exists',
                        },
                    };
                }

                // Create new user
                await db.insert(users).values({
                    id: randomUUID(),
                    clerk_user_id: userData.id,
                    name,
                    email: primaryEmail,
                    avatar_url: userData.image_url || null,
                    role,
                    is_deleted: false,
                    created_at: new Date(),
                });

                logger.info('User created from webhook', { clerkUserId: userData.id, email: primaryEmail });

                return {
                    status: 200,
                    body: {
                        success: true,
                        message: 'User created successfully',
                    },
                };
            }

            case 'user.updated': {
                // Update existing user
                const [existingUser] = await db.select().from(users).where(eq(users.clerk_user_id, userData.id));

                if (!existingUser) {
                    return { status: 400, body: { error: 'User not found' } };
                }

                const primaryEmail = userData.email_addresses?.[0]?.email_address;
                const name =
                    userData.username ||
                    `${userData.first_name || ''} ${userData.last_name || ''}`.trim() ||
                    existingUser.name;

                // Get role from public_metadata, keep existing if not provided
                const role = (userData.public_metadata?.role as string) || existingUser.role;

                await db
                    .update(users)
                    .set({
                        name,
                        email: primaryEmail || existingUser.email,
                        avatar_url: userData.image_url || existingUser.avatar_url,
                        role,
                    })
                    .where(eq(users.clerk_user_id, userData.id));

                logger.info('User updated from webhook', { clerkUserId: userData.id });

                return {
                    status: 200,
                    body: {
                        success: true,
                        message: 'User updated successfully',
                    },
                };
            }

            case 'user.deleted': {
                // Soft delete user
                const [existingUser] = await db.select().from(users).where(eq(users.clerk_user_id, userData.id));

                if (!existingUser) {
                    return { status: 400, body: { error: 'User not found' } };
                }

                await db.update(users).set({ is_deleted: true }).where(eq(users.clerk_user_id, userData.id));

                logger.info('User deleted from webhook', { clerkUserId: userData.id });

                return {
                    status: 200,
                    body: {
                        success: true,
                        message: 'User deleted successfully',
                    },
                };
            }

            default:
                return { status: 400, body: { error: 'Unsupported event type' } };
        }
    } catch (error) {
        logger.error('Error processing webhook', { error, eventType });
        return { status: 400, body: { error: 'Failed to process webhook' } };
    }
};
