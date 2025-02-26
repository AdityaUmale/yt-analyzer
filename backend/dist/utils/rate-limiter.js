"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitedBatch = rateLimitedBatch;
function rateLimitedBatch(items_1, processFn_1) {
    return __awaiter(this, arguments, void 0, function* (items, processFn, batchSize = 10, delayMs = 1000) {
        const results = [];
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(items.length / batchSize)}...`);
            const batchPromises = batch.map(processFn);
            // Process batch concurrently
            const batchResults = yield Promise.allSettled(batchPromises);
            // Handle results, including failures
            batchResults.forEach((result) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                }
                else {
                    console.error('Error processing item:', result.reason);
                    // You could push a default value or handle the error differently
                }
            });
            // Add delay between batches
            if (i + batchSize < items.length) {
                yield new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        return results;
    });
}
