import app from "./server.js";

// server starting for the testing
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log("Server running on", PORT));
