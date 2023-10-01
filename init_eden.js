import { EdenClient } from "@edenlabs/eden-sdk";

const apiKey = 'YOUR_API_KEY_HERE'; // NEVER PUBLISH YOUR KEY!
const apiSecret = 'YOUR_API_SECRET_HERE'; // NEVER PUBLISH YOUR SECRET!

const eden = new EdenClient({ apiKey, apiSecret });

export default eden
