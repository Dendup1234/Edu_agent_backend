import request from "supertest";
import { expect } from "chai";
import app from "../server.js";

//api route for health
describe("GET /health", () => {
  it("should return 200 and ok=true", async () => {
    const res = await request(app).get("/health");

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("ok", true);
  });
});
