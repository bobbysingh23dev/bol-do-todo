export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "BolDo API",
    version: "1.0.0",
    description:
      "BolDo backend — voice-to-work manager. Auth, tasks, and email verification.",
  },
  servers: [
    { url: "http://localhost:4000", description: "Local dev" },
  ],
  tags: [
    { name: "Health", description: "Server health checks" },
    { name: "Auth", description: "Signup, login, email verification, password reset" },
    { name: "Tasks", description: "User tasks (JWT required)" },
    { name: "Email", description: "SMTP test utilities" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT from login or verify-email",
      },
    },
    schemas: {
      Message: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
      Error: {
        type: "object",
        properties: {
          message: { type: "string" },
          code: { type: "string" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "clx123abc" },
          name: { type: "string", example: "Bobby" },
          email: { type: "string", format: "email", example: "you@mailinator.com" },
          emailVerified: { type: "boolean" },
        },
      },
      AuthConfig: {
        type: "object",
        properties: {
          emailDelivery: { type: "string", enum: ["live", "console"] },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          token: { type: "string", description: "JWT access token (7 days)" },
          user: { $ref: "#/components/schemas/User" },
          code: { type: "string", example: "EMAIL_NOT_VERIFIED" },
          devOtp: {
            type: "string",
            description: "Only when SMTP not configured (dev mode)",
          },
          devResetToken: {
            type: "string",
            description: "Only when SMTP not configured (dev mode)",
          },
        },
      },
      SignupInput: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 80 },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8, maxLength: 128 },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      EmailInput: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" },
        },
      },
      VerifyEmailInput: {
        type: "object",
        required: ["email", "otp"],
        properties: {
          email: { type: "string", format: "email" },
          otp: {
            type: "string",
            pattern: "^\\d{6}$",
            example: "123456",
          },
        },
      },
      ResetPasswordInput: {
        type: "object",
        required: ["token", "password"],
        properties: {
          token: { type: "string" },
          password: { type: "string", minLength: 8, maxLength: 128 },
        },
      },
      Task: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          title: { type: "string" },
          description: { type: "string", nullable: true },
          type: { type: "string", default: "task" },
          personName: { type: "string", nullable: true },
          amount: { type: "integer", nullable: true },
          dueDateText: { type: "string", nullable: true },
          dueAt: { type: "string", format: "date-time", nullable: true },
          status: { type: "string", enum: ["pending", "done"], default: "pending" },
          sourceText: { type: "string", nullable: true },
          generatedMsg: { type: "string", nullable: true },
          audioPath: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateTaskInput: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          type: { type: "string", default: "task" },
          personName: { type: "string" },
          amount: { type: "integer" },
          dueDateText: { type: "string" },
          dueAt: { type: "string", format: "date-time" },
          sourceText: { type: "string" },
          generatedMsg: { type: "string" },
          audioPath: { type: "string" },
        },
      },
      TestEmailInput: {
        type: "object",
        required: ["to"],
        properties: {
          to: { type: "string", format: "email", example: "test@mailinator.com" },
        },
      },
    },
  },
  paths: {
    "/": {
      get: {
        tags: ["Health"],
        summary: "Root message",
        responses: {
          "200": {
            description: "Server is running",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    app: { type: "string", example: "bol-do-backend" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/config": {
      get: {
        tags: ["Auth"],
        summary: "Email delivery mode",
        responses: {
          "200": {
            description: "Config",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthConfig" },
              },
            },
          },
        },
      },
    },
    "/api/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Create account",
        description: "Sends a 6-digit OTP to email. Returns devOtp in console mode.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignupInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Account created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "400": { description: "Invalid input" },
          "409": { description: "Email already registered" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "JWT issued",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "401": { description: "Invalid email or password" },
          "403": { description: "Email not verified (code: EMAIL_NOT_VERIFIED)" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Current user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "User profile",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          "401": { description: "Missing or invalid token" },
        },
      },
    },
    "/api/auth/verify-email": {
      get: {
        tags: ["Auth"],
        summary: "Verify email via link token",
        parameters: [
          {
            name: "token",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Verified — returns JWT",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "400": { description: "Invalid or expired token" },
        },
      },
      post: {
        tags: ["Auth"],
        summary: "Verify email via OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyEmailInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "Verified — returns JWT",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "400": { description: "Invalid or expired OTP" },
        },
      },
    },
    "/api/auth/resend-verification": {
      post: {
        tags: ["Auth"],
        summary: "Resend verification OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/EmailInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "OTP sent (or devOtp in console mode)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request password reset email",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/EmailInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "Generic success message",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password with token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResetPasswordInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "Password updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Message" },
              },
            },
          },
          "400": { description: "Invalid or expired reset link" },
        },
      },
    },
    "/api/tasks": {
      get: {
        tags: ["Tasks"],
        summary: "List my tasks",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Task array",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Task" },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
      post: {
        tags: ["Tasks"],
        summary: "Create task",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateTaskInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Task created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Task" },
              },
            },
          },
          "400": { description: "Title required" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/tasks/{id}": {
      get: {
        tags: ["Tasks"],
        summary: "Get task by id",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Task",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Task" },
              },
            },
          },
          "404": { description: "Task not found" },
        },
      },
    },
    "/api/tasks/{id}/done": {
      patch: {
        tags: ["Tasks"],
        summary: "Mark task as done",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Updated task",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Task" },
              },
            },
          },
          "404": { description: "Task not found" },
        },
      },
    },
    "/api/test-email": {
      post: {
        tags: ["Email"],
        summary: "Send SMTP test email",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TestEmailInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "Email sent",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    to: { type: "string" },
                    emailDelivery: { type: "string", enum: ["live"] },
                  },
                },
              },
            },
          },
          "503": { description: "SMTP not configured" },
        },
      },
    },
  },
} as const;
