import request from "supertest";
import express from "express";
import usersRouter from "../routes/users";
import pool from "../db/connection";

// Mock the database queries
jest.mock("../db/queries-sequelize", () => ({
  getUserById: jest.fn(),
  getUserByCognitoSub: jest.fn(),
  updateUserRole: jest.fn().mockResolvedValue(undefined),
}));

// Mock the auth middleware
jest.mock("../middleware/auth", () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => {
    req.user = {
      id: 1,
      cognitoSub: "test-cognito-sub",
      email: "test@example.com",
      role: "GUEST",
      features: {},
    };
    next();
  }),
}));

const app = express();
app.use(express.json());
app.use("/api/users", usersRouter);

describe("is_fraternity_member verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("should return false if user has no fraternity_member_id", async () => {
    const { getUserById } = require("../db/queries-sequelize");

    // Mock user with no member_id (GUEST role)
    getUserById.mockResolvedValue({
      id: 1,
      cognito_sub: "test-cognito-sub",
      email: "test@example.com",
      role: "GUEST",
      features: {},
    });

    // Mock pool.query to return no member (user has no fraternity_member_id)
    (jest.spyOn(pool, "query") as jest.Mock).mockResolvedValue({
      rows: [],
    });

    const response = await request(app).get("/api/users/me").expect(200);

    expect(response.body.is_fraternity_member).toBe(false);
  });

  it("should return false if user has fraternity_member_id but member is not verified", async () => {
    const { getUserById } = require("../db/queries-sequelize");

    // Mock user with member_id (GUEST role)
    getUserById.mockResolvedValue({
      id: 1,
      cognito_sub: "test-cognito-sub",
      email: "test@example.com",
      role: "GUEST",
      features: {},
    });

    // Mock pool.query: get member by email/cognito_sub with verification_status (PENDING)
    (jest.spyOn(pool, "query") as jest.Mock).mockImplementation(
      (query: string) => {
        if (query.includes("SELECT id, name, verification_status FROM fraternity_members WHERE email")) {
          // Get member with verification_status
          return Promise.resolve({
            rows: [{ id: 1, name: "Test Member", verification_status: "PENDING" }],
          });
        }
        return Promise.resolve({ rows: [] });
      }
    );

    const response = await request(app).get("/api/users/me").expect(200);

    expect(response.body.is_fraternity_member).toBe(false);
  });

  it("should return false if user has fraternity_member_id but member doesn't exist", async () => {
    const { getUserById } = require("../db/queries-sequelize");

    // Mock user with member_id (GUEST role)
    getUserById.mockResolvedValue({
      id: 1,
      cognito_sub: "test-cognito-sub",
      email: "test@example.com",
      role: "GUEST",
      features: {},
    });

    // Mock pool.query: get member by email/cognito_sub (returns empty - member doesn't exist)
    (jest.spyOn(pool, "query") as jest.Mock).mockResolvedValue({
      rows: [],
    });

    const response = await request(app).get("/api/users/me").expect(200);

    expect(response.body.is_fraternity_member).toBe(false);
  });

  it("should return true if user has fraternity_member_id and member is verified", async () => {
    const { getUserById } = require("../db/queries-sequelize");

    // Mock user with member_id (GUEST role)
    getUserById.mockResolvedValue({
      id: 1,
      cognito_sub: "test-cognito-sub",
      email: "test@example.com",
      role: "GUEST",
      features: {},
    });

    // Mock pool.query: get member by email/cognito_sub with verification_status (VERIFIED)
    (jest.spyOn(pool, "query") as jest.Mock).mockImplementation(
      (query: string) => {
        if (query.includes("SELECT id, name, verification_status FROM fraternity_members WHERE email")) {
          // Get member with verification_status
          return Promise.resolve({
            rows: [
              { id: 1, name: "Test Member", verification_status: "VERIFIED" },
            ],
          });
        }
        return Promise.resolve({ rows: [] });
      }
    );

    const response = await request(app).get("/api/users/me").expect(200);

    expect(response.body.is_fraternity_member).toBe(true);
  });

  it("should return false for SELLER role if seller has no fraternity_member_id", async () => {
    const { getUserById } = require("../db/queries-sequelize");

    // Mock user with SELLER role (no seller_id on user - it's on sellers table now)
    getUserById.mockResolvedValue({
      id: 1,
      cognito_sub: "test-cognito-sub",
      email: "test@example.com",
      role: "SELLER",
      features: {},
    });

    // Mock pool.query:
    // 1. First call: get seller id by user_id
    // 2. Second call: get seller details (name, email, status)
    // 3. Third call: get fraternity_member by email (returns empty - no member)
    (jest.spyOn(pool, "query") as jest.Mock).mockImplementation(
      (query: string) => {
        if (query.includes("SELECT id FROM sellers WHERE user_id")) {
          // First call: get seller id by user_id
          return Promise.resolve({
            rows: [{ id: 1 }],
          });
        } else if (query.includes("SELECT name, email, status FROM sellers WHERE id")) {
          // Second call: get seller details
          return Promise.resolve({
            rows: [
              {
                name: "Test Seller",
                email: "seller@example.com",
                status: "APPROVED",
              },
            ],
          });
        } else if (query.includes("SELECT id, verification_status FROM fraternity_members WHERE email")) {
          // Third call: get fraternity_member by email (no member found)
          return Promise.resolve({
            rows: [],
          });
        }
        return Promise.resolve({ rows: [] });
      }
    );

    const response = await request(app).get("/api/users/me").expect(200);

    expect(response.body.is_fraternity_member).toBe(false);
  });

  it("should return false for SELLER role if seller has fraternity_member_id but member is not verified", async () => {
    const { getUserById } = require("../db/queries-sequelize");

    // Mock user with SELLER role (no seller_id on user - it's on sellers table now)
    getUserById.mockResolvedValue({
      id: 1,
      cognito_sub: "test-cognito-sub",
      email: "test@example.com",
      role: "SELLER",
      features: {},
    });

    // Mock pool.query:
    // 1. First call: get seller id by user_id
    // 2. Second call: get seller details (name, email, status)
    // 3. Third call: get fraternity_member by email with verification_status (PENDING)
    (jest.spyOn(pool, "query") as jest.Mock).mockImplementation(
      (query: string) => {
        if (query.includes("SELECT id FROM sellers WHERE user_id")) {
          // First call: get seller id by user_id
          return Promise.resolve({
            rows: [{ id: 1 }],
          });
        } else if (query.includes("SELECT name, email, status FROM sellers WHERE id")) {
          // Second call: get seller details
          return Promise.resolve({
            rows: [
              {
                name: "Test Seller",
                email: "seller@example.com",
                status: "APPROVED",
              },
            ],
          });
        } else if (query.includes("SELECT id, verification_status FROM fraternity_members WHERE email")) {
          // Third call: get fraternity_member by email with verification_status (PENDING)
          return Promise.resolve({
            rows: [{ id: 1, verification_status: "PENDING" }],
          });
        }
        return Promise.resolve({ rows: [] });
      }
    );

    const response = await request(app).get("/api/users/me").expect(200);

    expect(response.body.is_fraternity_member).toBe(false);
  });

  it("should return true for SELLER role if seller has fraternity_member_id and member is verified", async () => {
    const { getUserById } = require("../db/queries-sequelize");

    // Mock user with SELLER role (no seller_id on user - it's on sellers table now)
    getUserById.mockResolvedValue({
      id: 1,
      cognito_sub: "test-cognito-sub",
      email: "test@example.com",
      role: "SELLER",
      features: {},
    });

    // Mock pool.query:
    // 1. First call: get seller id by user_id
    // 2. Second call: get seller details (name, email, status)
    // 3. Third call: get fraternity_member by email with verification_status
    let callCount = 0;
    (jest.spyOn(pool, "query") as jest.Mock).mockImplementation(
      (query: string) => {
        callCount++;
        if (query.includes("SELECT id FROM sellers WHERE user_id")) {
          // First call: get seller id by user_id
          return Promise.resolve({
            rows: [{ id: 1 }],
          });
        } else if (query.includes("SELECT name, email, status FROM sellers WHERE id")) {
          // Second call: get seller details
          return Promise.resolve({
            rows: [
              {
                name: "Test Seller",
                email: "seller@example.com",
                status: "APPROVED",
              },
            ],
          });
        } else if (query.includes("SELECT id, verification_status FROM fraternity_members WHERE email")) {
          // Third call: get fraternity_member by email with verification_status
          return Promise.resolve({
            rows: [{ id: 1, verification_status: "VERIFIED" }],
          });
        }
        return Promise.resolve({ rows: [] });
      }
    );

    const response = await request(app).get("/api/users/me").expect(200);

    expect(response.body.is_fraternity_member).toBe(true);
  });
});
