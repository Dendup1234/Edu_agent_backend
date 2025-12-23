//Imports
import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js'
import userRoute from "./routes/user.auth.route.js";
//config
dotenv.config();

// app config
const app = express();
app.use(express.json());

//routes
app.use("/api/auth/user", userRoute);
// Listening to the port 3000
const PORT = process.env.PORT || 3000;

// connect DB before server  starts
await connectDB();

app.get('/', (request, response) => {
	response.send('Hello world form the nodemon');
})

app.listen(PORT, () => {
	console.log('Server is running on PORT ${PORT}');
});
