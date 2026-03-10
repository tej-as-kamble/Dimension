const request = require("supertest");
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const mockSave = jest.fn();
const mockFindOne = jest.fn();

const MockUser = jest.fn().mockImplementation((data) => ({
    ...data,
    save: mockSave,
}));
MockUser.findOne = mockFindOne;

jest.mock("mongoose", () => ({
    model: jest.fn().mockReturnValue(MockUser),
}));
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

const authRoutes = require("../routes/auth");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

describe("Auth API Endpoints", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = "test-secret-key";
    });

    describe("POST /api/auth/signup", () => {
        it("should register a new user successfully", async () => {
            const newUser = {
                name: "John Doe",
                username: "johndoe",
                email: "john@example.com",
                password: "password123",
            };

            MockUser.findOne.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue("hashedPassword123");
            mockSave.mockResolvedValue(newUser);

            const response = await request(app)
                .post("/api/auth/signup")
                .send(newUser);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: "User Registered Succesfully",
            });
        });

        it("should return an error if user already exists", async () => {
            const existingUser = {
                name: "Jane",
                username: "janedoe",
                email: "jane@example.com",
                password: "password",
            };

            MockUser.findOne.mockResolvedValue(existingUser);

            const response = await request(app)
                .post("/api/auth/signup")
                .send(existingUser);

            expect(response.body).toEqual({
                error: "User Already Registered",
            });
        });
    });

    describe("POST /api/auth/signin", () => {
        it("should sign in an existing user and return a token", async () => {
            const loginData = {
                email: "john@example.com",
                password: "password123",
            };

            const dbUser = {
                id: "mock_id_123",
                email: "john@example.com",
                password: "hashedPassword123",
            };

            MockUser.findOne.mockResolvedValue(dbUser);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue("mock_jwt_token");

            const response = await request(app)
                .post("/api/auth/signin")
                .send(loginData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("token", "mock_jwt_token");
            expect(response.body.detail).toEqual(dbUser);
        });

        it("should return an error for invalid password", async () => {
            MockUser.findOne.mockResolvedValue({ email: "test@test.com", password: "hash" });
            bcrypt.compare.mockResolvedValue(false);

            const response = await request(app)
                .post("/api/auth/signin")
                .send({ email: "test@test.com", password: "wrongpassword" });

            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: "Invalid Password" });
        });
    });
});