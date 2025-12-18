import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as authService from "./auth";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),

    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          await authService.registerUser(input.email, input.password, input.name);
          return { success: true };
        } catch (error: any) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
        rememberMe: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await authService.loginUser(input.email, input.password);
          // Set session cookie
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.setHeader('Set-Cookie', `${COOKIE_NAME}=${JSON.stringify({ userId: user.id })}; ${Object.entries(cookieOptions).map(([k, v]) => `${k}=${v}`).join('; ')}`);
          return { success: true, user };
        } catch (error: any) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: error.message,
          });
        }
      }),

    adminLogin: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await authService.loginAdmin(input.email, input.password);
          // Set admin session cookie
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.setHeader('Set-Cookie', `${COOKIE_NAME}=${JSON.stringify({ userId: user.id, isAdmin: true })}; ${Object.entries(cookieOptions).map(([k, v]) => `${k}=${v}`).join('; ')}`);
          return { success: true, user };
        } catch (error: any) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: error.message,
          });
        }
      }),

    requestPasswordReset: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          // Don't reveal if user exists for security
          return { success: true };
        }
        // In production, send email with reset link
        return { success: true };
      }),

    resetPassword: publicProcedure
      .input(z.object({
        email: z.string().email(),
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ input }) => {
        try {
          await authService.resetPassword(input.email, input.newPassword);
          return { success: true };
        } catch (error: any) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
      }),
  }),

  posts: router({
    getAll: publicProcedure.query(async () => {
      return db.getAllPosts();
    }),

    getByCategory: publicProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(async ({ input }) => {
        return db.getPostsByCategory(input.categoryId);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const post = await db.getPostById(input.id);
        if (post) {
          await db.incrementPostViews(input.id);
        }
        return post;
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const post = await db.getPostBySlug(input.slug);
        if (post) {
          await db.incrementPostViews(post.id);
        }
        return post;
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        content: z.string(),
        excerpt: z.string().optional(),
        categoryId: z.number(),
        image: z.string().optional(),
        youtubeUrl: z.string().optional(),
        externalLinks: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const slug = input.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        return db.createPost({
          ...input,
          slug,
          externalLinks: input.externalLinks ? JSON.stringify(input.externalLinks) : null,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        excerpt: z.string().optional(),
        categoryId: z.number().optional(),
        image: z.string().optional(),
        youtubeUrl: z.string().optional(),
        externalLinks: z.array(z.string()).optional(),
        published: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const { id, ...updates } = input;
        return db.updatePost(id, updates);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return db.deletePost(input.id);
      }),
  }),

  categories: router({
    getAll: publicProcedure.query(async () => {
      return db.getAllCategories();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getCategoryById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        slug: z.string().optional(),
        description: z.string().optional(),
        order: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const slug = input.slug || input.name.toLowerCase().replace(/\s+/g, '-');
        return db.createCategory({ ...input, slug });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        order: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const { id, ...updates } = input;
        return db.updateCategory(id, updates);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return db.deleteCategory(input.id);
      }),
  }),

  comments: router({
    getByPost: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ input }) => {
        return db.getCommentsByPostId(input.postId);
      }),

    create: protectedProcedure
      .input(z.object({
        postId: z.number(),
        content: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED' });
        }
        return db.createComment({
          postId: input.postId,
          userId: ctx.user.id,
          content: input.content,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return db.deleteComment(input.id);
      }),
  }),

  settings: router({
    getAll: publicProcedure.query(async () => {
      return db.getAllSettings();
    }),

    get: publicProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        return db.getSetting(input.key);
      }),

    set: protectedProcedure
      .input(z.object({
        key: z.string(),
        value: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return db.setSetting(input.key, input.value);
      }),
  }),

  analytics: router({
    get: publicProcedure.query(async () => {
      return db.getAnalytics();
    }),

    update: protectedProcedure
      .input(z.object({
        totalVisitors: z.number().optional(),
        totalRegistered: z.number().optional(),
        totalViews: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return db.updateAnalytics(input);
      }),
  }),

  users: router({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      return db.getAllUsers();
    }),

    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        password: z.string().min(6).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED' });
        }
        const updates: any = {};
        if (input.name) updates.name = input.name;
        if (input.email) updates.email = input.email;
        if (input.password) {
          updates.password = await authService.hashPassword(input.password);
        }
        return db.updateUser(ctx.user.id, updates);
      }),
  }),
});

export type AppRouter = typeof appRouter;
