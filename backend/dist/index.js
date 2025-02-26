"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const youtube_routes_1 = __importDefault(require("./routes/youtube.routes"));
const database_1 = require("./utils/database");
(0, database_1.connectDB)();
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/youtube', youtube_routes_1.default);
app.get('/', (req, res) => {
    res.send('YouTube Comment Analysis API');
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
