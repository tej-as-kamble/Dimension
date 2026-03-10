const request = require("supertest");
const express = require("express");

jest.mock("../middlewares/requirelogin", () => (req, res, next) => {
    req.value = { _id: "mockUserId123" };
    next();
});

const mockSave = jest.fn();

const mockQuery = (data, error = null) => ({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    then: (cb) => {
        const p = error ? Promise.reject(error) : Promise.resolve(data);
        return p.then(cb);
    },
});

const MockPost = jest.fn().mockImplementation((data) => ({
    ...data,
    save: mockSave,
}));

MockPost.find = jest.fn();
MockPost.findByIdAndUpdate = jest.fn();
MockPost.findOne = jest.fn();
MockPost.deleteOne = jest.fn();

jest.mock("mongoose", () => ({
    model: jest.fn().mockReturnValue(MockPost),
}));

const postRoutes = require("../routes/createpost");
const app = express();
app.use(express.json());
app.use("/", postRoutes);

describe("Post API Endpoints", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /allpost", () => {
        it("should return all posts", async () => {
            const posts = [{ _id: "1", body: "test content" }];
            MockPost.find.mockReturnValue(mockQuery(posts));

            const response = await request(app).get("/allpost");

            expect(response.status).toBe(200);
            expect(response.body).toEqual(posts);
        });
    });

    describe("POST /createpost", () => {
        it("should create a new post", async () => {
            const newPost = { photo: "image.jpg", body: "hello world" };
            mockSave.mockResolvedValue(newPost);

            const response = await request(app).post("/createpost").send(newPost);

            expect(response.status).toBe(200);
            expect(response.body.post).toEqual(newPost);
        });

        it("should return 422 if fields are missing", async () => {
            const response = await request(app)
                .post("/createpost")
                .send({ body: "missing photo" });

            expect(response.status).toBe(422);
            expect(response.body.error).toBe("Please Fill All feilds");
        });
    });

    describe("PUT /like", () => {
        it("should add a like to a post", async () => {
            const updatedPost = { _id: "1", likes: ["mockUserId123"] };
            MockPost.findByIdAndUpdate.mockReturnValue(mockQuery(updatedPost));

            const response = await request(app).put("/like").send({ postid: "1" });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(updatedPost);
        });
    });

    describe("DELETE /deletepost/:postid", () => {
        it("should delete a post if requested by the owner", async () => {
            const post = {
                _id: "1",
                postedby: { _id: "mockUserId123" },
            };

            MockPost.findOne.mockReturnValue(mockQuery(post));
            MockPost.deleteOne.mockResolvedValue({ deletedCount: 1 });

            const response = await request(app).delete("/deletepost/1");

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("post deleted");
        });
    });
});