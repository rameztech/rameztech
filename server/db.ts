import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, categories, posts, comments, settings, analytics, Category, Post, Comment, Setting, Analytics } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// User functions
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(users).values(user);
  return result;
}

export async function updateUser(id: number, updates: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(users).set(updates).where(eq(users.id, id));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.role, 'user'));
}

// Category functions
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.order);
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCategory(category: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(categories).values(category);
}

export async function updateCategory(id: number, updates: Partial<Category>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(categories).set(updates).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(categories).where(eq(categories.id, id));
}

// Post functions
export async function getAllPosts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posts).where(eq(posts.published, true)).orderBy(desc(posts.createdAt));
}

export async function getPostsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posts).where(and(eq(posts.categoryId, categoryId), eq(posts.published, true))).orderBy(desc(posts.createdAt));
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPostBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPost(post: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(posts).values(post);
}

export async function updatePost(id: number, updates: Partial<Post>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(posts).set(updates).where(eq(posts.id, id));
}

export async function deletePost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(posts).where(eq(posts.id, id));
}

export async function incrementPostViews(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const post = await getPostById(id);
  if (!post) throw new Error("Post not found");
  return db.update(posts).set({ views: (post.views || 0) + 1 }).where(eq(posts.id, id));
}

// Comment functions
export async function getCommentsByPostId(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(comments).where(eq(comments.postId, postId)).orderBy(desc(comments.createdAt));
}

export async function createComment(comment: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(comments).values(comment);
}

export async function deleteComment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(comments).where(eq(comments.id, id));
}

export async function updateComment(id: number, updates: Partial<Comment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(comments).set(updates).where(eq(comments.id, id));
}

// Settings functions
export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(settings);
}

export async function setSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getSetting(key);
  if (existing) {
    return db.update(settings).set({ value }).where(eq(settings.key, key));
  } else {
    return db.insert(settings).values({ key, value });
  }
}

// Analytics functions
export async function getAnalytics() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(analytics).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function initializeAnalytics() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getAnalytics();
  if (!existing) {
    return db.insert(analytics).values({
      totalVisitors: 0,
      totalRegistered: 0,
      totalViews: 0,
    });
  }
  return existing;
}

export async function updateAnalytics(updates: Partial<Analytics>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await initializeAnalytics();
  return db.update(analytics).set(updates).limit(1);
}
