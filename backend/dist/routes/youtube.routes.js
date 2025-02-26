"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const youtube_controller_1 = require("../controllers/youtube.controller");
const router = (0, express_1.Router)();
router.post('/comments', (req, res) => {
    (0, youtube_controller_1.getVideoComments)(req, res);
});
router.get('/test', (req, res) => {
    (0, youtube_controller_1.testAPI)(req, res);
});
exports.default = router;
