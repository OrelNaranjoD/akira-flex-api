// test/setup.ts
import * as dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

// Override NODE_ENV for tests
process.env.NODE_ENV = 'test';
