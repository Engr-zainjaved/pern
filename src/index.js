import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import { psql } from './config/db.js';
import productRoutes from './routes/productRoutes.js';
import { aj } from './lib/arcjet.js';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json()); // parse incoming requests with JSON payloads
app.use(cors()); // enable CORS for all requests
app.use(helmet()); // secure your app by setting various HTTP headers
app.use(morgan('dev')); // log only 4xx and 5xx responses to console
app.use(async (req, res, next) => {
    try {
        const decsion = await aj.protect(req, { requested: 1 });

        if (decsion.isDenied) {
            if (decsion.reason.isBot()) {
                return res.status(403).json({ success: false, message: 'Bot detected' });
            } else if (decsion.reason.isRateLimit()) {
                return res.status(429).json({ success: false, message: 'Rate limit exceeded' });
            } else {
                return res.status(403).json({ success: false, message: 'Forbidden' });
            }
        }

        // check for spoofed bots
        if (decsion.results.some((result) => result.reason.isBot() && result.reason.isSpoofed())) {
            return res.status(403).json({ success: false, message: 'Spoofed bot detected' });
        }

        next();
    } catch (error) {
        console.error('Error in Arcjet middleware:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.use('/api/products', productRoutes);

async function initDB() {
    try {
        await psql.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                price NUMERIC(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (error) {
        console.error('Error creating table:', error);
    }
}

initDB().then(() => {
    app.listen(PORT, () => {
        console.log('Server is running on port', PORT);
    });
}).catch((error) => {
    console.error('Error initializing database:', error);
});
