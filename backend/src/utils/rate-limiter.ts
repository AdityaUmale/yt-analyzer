/**
 * Simple rate limiter for API calls
 */
export async function rateLimitedBatch<T, R>(
    items: T[],
    processFn: (item: T) => Promise<R>,
    batchSize: number = 10,
    delayMs: number = 1000
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(items.length/batchSize)}...`);
      
      const batchPromises = batch.map(processFn);
      
      // Process batch concurrently
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Handle results, including failures
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('Error processing item:', result.reason);
          // You could push a default value or handle the error differently
        }
      });
      
      // Add delay between batches
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    return results;
  }