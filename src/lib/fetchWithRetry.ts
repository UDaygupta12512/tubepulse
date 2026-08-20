export async function fetchWithRetry(
    url: string,
    options: RequestInit = {},
    maxRetries = 3,
    baseDelay = 1000
): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);

            // If the response is successful, return it immediately
            if (response.ok) {
                return response;
            }

            // Retry on 429 (Rate Limit) or 5xx (Server Errors)
            if (response.status === 429 || response.status >= 500) {
                throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
            }

            // For other errors (400, 401, 403, 404), do NOT retry. Just return the response
            // so the caller can handle the error appropriately.
            return response;
            
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            
            // If we've hit the max retries, throw the last error
            if (attempt === maxRetries) {
                break;
            }

            // Exponential backoff: 1s, 2s, 4s, 8s...
            const delay = baseDelay * Math.pow(2, attempt);
            console.warn(`[Network Retry] Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`, lastError.message);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}
