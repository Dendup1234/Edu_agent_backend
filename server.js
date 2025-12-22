//Imports
import express from 'express';
import dotenv from 'dotenv';

//config
dotenv.config();

const app = express();
app.use(express.json());
const port = 3000;

app.get('/', (request, response) => {
	response.send('Hello world from the nodemon');
})

app.listen(port, () => {
	console.log('Server is running on the nodemon');
});
