import { EdenClient } from "@edenlabs/eden-sdk";
import dotenv from 'dotenv';
dotenv.config();

// Now you can use the environment variables from your .env file
const apiKey = process.env.EDEN_API_KEY;
const apiSecret = process.env.EDEN_SECRET_KEY;

const eden = new EdenClient({ apiKey, apiSecret });

export default eden
