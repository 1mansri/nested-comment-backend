import 'dotenv/config';
    
import { drizzle } from 'drizzle-orm/node-postgres';
const db = drizzle(process.env.DATABASE_URL!);

export default db;


// import 'dotenv/config';
// import { drizzle } from 'drizzle-orm/node-postgres';
// import { eq } from 'drizzle-orm';
// import { users, TNewUser } from './schemas/schema';
  
// const db = drizzle(process.env.DATABASE_URL!);

// async function main() {
//   const user: TNewUser = {
//     name: 'John',
//     clerk_user_id: "dcr7n8n8e4783",
//     email: 'john@example.com',
//     role: 'user',
//     is_deleted: false,
//     created_at: new Date(),
//     avatar_url: 'https://example.com/avatar.jpg',
//   };

//   await db.insert(users).values(user);
//   console.log('New user created!')

//   const dbUsers  = await db.select().from(users);
//   console.log('Getting all users from the database: ', dbUsers)
//   /*
//   const users: {
//     id: number;
//     name: string;
//     age: number;
//     email: string;
//   }[]
//   */

//   await db
//     .update(users)
//     .set({
//       email: "john.doe@example.com",
//     })
//     .where(eq(users.email, user.email));
//   console.log('User info updated!')

//   await db.delete(users).where(eq(users.email, user.email));
//   console.log('User deleted!')
// }

// main();
