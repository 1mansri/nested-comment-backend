import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  foreignKey,
  unique,
} from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

// TypeScript types for the tables
export type TUser = InferSelectModel<typeof users>;
export type TNewUser = InferInsertModel<typeof users>;
export type TPost = InferSelectModel<typeof posts>;
export type TNewPost = InferInsertModel<typeof posts>;
export type TComment = InferSelectModel<typeof comments>;
export type TNewComment = InferInsertModel<typeof comments>;
export type TUpvote = InferSelectModel<typeof upvotes>;
export type TNewUpvote = InferInsertModel<typeof upvotes>;

// USERS
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  clerk_user_id: varchar("clerk_user_id", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  avatar_url: varchar("avatar_url", { length: 255 }),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  is_deleted: boolean("is_deleted").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// POSTS
export const posts = pgTable(
  "posts",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body").notNull(),
    image_url: varchar("image_url", { length: 255 }),
    author_id: uuid("author_id").notNull(),
    is_deleted: boolean("is_deleted").default(false).notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.author_id],
      foreignColumns: [users.id],
      name: "posts_author_id_users_id_fk",
    }),
  ]
);

// COMMENTS - Self-referencing table
export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    post_id: uuid("post_id").notNull(),
    parent_comment_id: uuid("parent_comment_id"),
    user_id: uuid("user_id").notNull(),
    text: text("text").notNull(),
    upvotes: integer("upvotes").default(0).notNull(),
    is_deleted: boolean("is_deleted").default(false).notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Only the self-reference foreign key exists in the DB
    foreignKey({
      columns: [table.parent_comment_id],
      foreignColumns: [table.id],
      name: "comments_parent_comment_id_comments_id_fk",
    }).onDelete("set null"),
  ]
);

// UPVOTES
export const upvotes = pgTable("upvotes", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  comment_id: uuid("comment_id").notNull(),
  user_id: uuid("user_id").notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
