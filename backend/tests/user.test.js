const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");

jest.mock("../middlewares/requirelogin", () => (req, res, next) => {
    req.value = { _id: "mockUserId123", following: ["mockTargetId"] };
    next();
});

const createMockQuery = (data, error = null) => {
    const promise = error ? Promise.reject(error) : Promise.resolve(data);
    promise.select = jest.fn().mockReturnValue(promise);
    promise.populate = jest.fn().mockReturnValue(promise);
    return promise;
};

const MockPost = {
    find: jest.fn(),
};

const MockUser = {
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
};

jest.mock("mongoose", () => ({
    model: jest.fn((modelName) => {
        if (modelName === "POST") return MockPost;
        if (modelName === "USER") return MockUser;
    }),
}));

const userRoutes = require("../routes/user");
const app = express();
app.use(express.json());
app.use("/", userRoutes);

describe("User API Endpoints", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /user/:id", () => {
        it("should return user details and their posts", async () => {
            const mockUser = { _id: "targetUserId", name: "John" };
            const mockPosts = [{ _id: "post1", title: "Hello" }];

            MockUser.findOne.mockReturnValue(createMockQuery(mockUser));
            MockPost.find.mockReturnValue(createMockQuery(mockPosts));

            const response = await request(app).get("/user/targetUserId");

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ user: mockUser, post: mockPosts });
        });
    });

    describe("PUT /follow", () => {
        it("should add target to following and current user to followers", async () => {
            MockUser.findByIdAndUpdate.mockReturnValue(createMockQuery({}));

            const response = await request(app)
                .put("/follow")
                .send({ followid: "mockTargetId" });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: "following" });
            expect(MockUser.findByIdAndUpdate).toHaveBeenCalledTimes(2);
        });
    });

    describe("PUT /unfollow", () => {
        it("should remove target from following and current user from followers", async () => {
            MockUser.findByIdAndUpdate.mockReturnValue(createMockQuery({}));

            const response = await request(app)
                .put("/unfollow")
                .send({ followid: "mockTargetId" });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: "unfollowing" });
            expect(MockUser.findByIdAndUpdate).toHaveBeenCalledTimes(2);
        });
    });

    describe("GET /myfollowingpost", () => {
        it("should return posts from followed users", async () => {
            const mockPosts = [{ _id: "post1", body: "test" }];
            MockPost.find.mockReturnValue(createMockQuery(mockPosts));

            const response = await request(app).get("/myfollowingpost");

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockPosts);
        });
    });

    describe("PUT /uploadprofilepic", () => {
        it("should update the user profile picture", async () => {
            const updatedUser = { _id: "mockUserId123", photo: "newpic.jpg" };
            MockUser.findByIdAndUpdate.mockReturnValue(createMockQuery(updatedUser));

            const response = await request(app)
                .put("/uploadprofilepic")
                .send({ photo: "newpic.jpg" });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(updatedUser);
        });
    });
});