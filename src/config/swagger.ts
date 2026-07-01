import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Et-Pulse News API",
      version: "1.0.0",
      description:
        "REST API for Et-Pulse — an Ethiopian news aggregation platform. Supports news browsing, comments, bookmarks, user management, and admin moderation.",
      contact: {
        name: "Et-Pulse Team",
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Clerk JWT token — obtain from Clerk SDK on the client",
        },
      },
      schemas: {
        // ─── Shared ──────────────────────────────────────────────────────────
        PaginationMeta: {
          type: "object",
          properties: {
            currentPage: { type: "integer", example: 1 },
            totalPages: { type: "integer", example: 10 },
            totalNews: { type: "integer", example: 97 },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            error: { type: "string" },
          },
        },
        // ─── Channel ──────────────────────────────────────────────────────────
        Channel: {
          type: "object",
          properties: {
            _id: { type: "string", example: "665abc123def456789012345" },
            telegram_channel_id: { type: "integer", example: 10012345678 },
            name: { type: "string", example: "Ethiopian News Agency" },
            username: { type: "string", example: "ethiopian_news" },
            profile_pic: { type: "string", format: "uri" },
            description: { type: "string" },
            subscribers_count: { type: "integer", example: 45000 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        // ─── News ─────────────────────────────────────────────────────────────
        News: {
          type: "object",
          properties: {
            _id: { type: "string", example: "665abc123def456789012345" },
            telegram_channel_id: { type: "integer", example: 10012345678 },
            telegram_message_id: { type: "integer", example: 541 },
            channel_id: {
              oneOf: [
                { type: "string" },
                { $ref: "#/components/schemas/Channel" }
              ]
            },
            title: { type: "string", example: "Ethiopia Signs Historic Accord" },
            content: { type: "string" },
            raw_text: { type: "string" },
            category: {
              type: "string",
              enum: ["Politics", "Tech", "Sports", "Business", "World", "Entertainment", "Other"],
            },
            language: { type: "string", example: "am" },
            engagement: {
              type: "object",
              properties: {
                views: { type: "integer", example: 1204 },
                forwards: { type: "integer", example: 42 }
              }
            },
            media: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["image", "video", "document"] },
                  url: { type: "string", format: "uri" }
                }
              }
            },
            source: {
              type: "object",
              properties: {
                platform: { type: "string", example: "telegram" },
                url: { type: "string", format: "uri" }
              }
            },
            tags: { type: "array", items: { type: "string" } },
            status: { type: "string", enum: ["published", "draft", "deleted", "pending", "rejected"] },
            likesCount: { type: "integer", example: 47 },
            commentsCount: { type: "integer", example: 12 },
            bookmarksCount: { type: "integer", example: 5 },
            isLiked: { type: "boolean" },
            published_at: { type: "string", format: "date-time" },
            scraped_at: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateNewsBody: {
          type: "object",
          required: ["title", "content", "category"],
          properties: {
            title: { type: "string" },
            summary: { type: "string" },
            content: { type: "string" },
            category: {
              type: "string",
              enum: ["Politics", "Tech", "Sports", "Business", "World", "Entertainment", "Other"],
            },
            coverImage: { type: "string", format: "uri" },
            tags: { type: "array", items: { type: "string" } },
          },
        },
        // ─── Comment ─────────────────────────────────────────────────────────
        Comment: {
          type: "object",
          properties: {
            _id: { type: "string" },
            content: { type: "string" },
            user: { $ref: "#/components/schemas/UserPublic" },
            news: { type: "string" },
            parentComment: { type: "string", nullable: true },
            likes: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        // ─── User ─────────────────────────────────────────────────────────────
        UserPublic: {
          type: "object",
          properties: {
            _id: { type: "string" },
            username: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            profilePicture: { type: "string", format: "uri" },
          },
        },
        UserFull: {
          type: "object",
          properties: {
            _id: { type: "string" },
            email: { type: "string", format: "email" },
            username: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            profilePicture: { type: "string", format: "uri" },
            role: { type: "string", enum: ["admin", "writer", "editor", "user"] },
            status: { type: "string", enum: ["active", "banned", "suspended"] },
            isVerified: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        // ─── Bookmark ─────────────────────────────────────────────────────────
        BookMark: {
          type: "object",
          properties: {
            _id: { type: "string" },
            user: { type: "string" },
            news: { $ref: "#/components/schemas/News" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        // ─── Report ─────────────────────────────────────────────────────────────
        Report: {
          type: "object",
          properties: {
            _id: { type: "string" },
            reporter: { $ref: "#/components/schemas/UserPublic" },
            status: { type: "string", enum: ["pending", "resolved", "dismissed"] },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        // ─── Admin ─────────────────────────────────────────────────────────────
        DashboardStats: {
          type: "object",
          properties: {
            totalUsers: { type: "integer" },
            totalNews: { type: "integer" },
            totalComments: { type: "integer" },
            pendingReports: { type: "integer" },
            totalViews: { type: "integer" },
            totalLikes: { type: "integer" },
          },
        },
      },
    },
    tags: [
      { name: "News", description: "Public and protected news endpoints" },
      { name: "Comments", description: "Comment and reply management" },
      { name: "Bookmarks", description: "User bookmark management" },
      { name: "Users", description: "User profile and sync" },
      { name: "Admin", description: "Admin-only management endpoints" },
      { name: "Webhooks", description: "Clerk webhook receiver" },
      { name: "Health", description: "Server health check" },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  // Swagger JSON endpoint
  app.get("/api/docs/swagger.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // Swagger UI
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "Et-Pulse API Docs",
      customCss: `
        .swagger-ui .topbar { background: #1a1a2e; }
        .swagger-ui .topbar-wrapper img { content: url(''); }
        .swagger-ui .info .title { color: #e94560; }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: "none",
        filter: true,
        displayRequestDuration: true,
      },
    })
  );

  console.log(`📚 Swagger docs available at http://localhost:${process.env.PORT || 5000}/api/docs`);
};
