import {
  ApiRouteConfig,
  ApiRouteHandler,
  ApiRequest,
  //   FlowContext,
} from "motia";
import { z } from "zod";
import db from "../../src/db/index";
import { users, TNewUser, TUser } from "../../src/db/schemas/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const createNewUserSchema = z.object({
  name: z.string(),
  clerk_user_id: z.string(),
  email: z.string().email(),
  avatar_url: z.string().nullable().optional(),
});

// name: string;
// clerk_user_id: string;
// email: string;
// id?: string | undefined;
// avatar_url?: string | null | undefined;
// role?: string | undefined;
// is_deleted?: boolean | undefined;
// created_at?: Date | undefined;

const responseSchema = z.object({
  clerk_user_id: z.string(),
  name: z.string(),
  email: z.string(),
  avatar_url: z.string().nullable(),
});

export const config: ApiRouteConfig = {
  name: "CreateUser",
  type: "api",
  path: "/create-user",
  method: "POST",
  bodySchema: createNewUserSchema,
  responseSchema: {
    201: responseSchema,
    400: z.object({ error: z.string() }),
  },
  flows: ["UserManagement"],
  emits: [],
};

export const handler: ApiRouteHandler<
  z.infer<typeof createNewUserSchema>,
  { status: 201; body: TUser } | { status: 400; body: { error: string } }
> = async (
  req: ApiRequest<z.infer<typeof createNewUserSchema>>,
  { logger }
) => {
  const data = createNewUserSchema.parse(req.body);

  const userData: TNewUser = {
    ...data,
    id: uuidv4(),
    created_at: new Date(),
    is_deleted: false,
    role: "user",
  };
  logger.info("Attempting to create user", { email: data.email });

  // Check if user's email already exists
  const [existingUserEmail] = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email));

  if (existingUserEmail) {
    logger.warn("User email already exists", { email: data.email });
    return { status: 400, body: { error: "User email already exists" } };
  }

  // Check if user's clerk ID already exists  
  const [existingUserClerkId] = await db
    .select()
    .from(users)
    .where(eq(users.clerk_user_id, data.clerk_user_id));

  if (existingUserClerkId) {
    logger.warn("User clerk ID already exists", { clerkUserId: data.clerk_user_id });
    return { status: 400, body: { error: "User clerk ID already exists" } };
  }

  // Insert and return the created user
  const [user] = await db
    .insert(users)
    .values(userData as TNewUser)
    .returning();

  logger.info("User created", { userId: user.id });

  return { status: 201, body: user };
};
