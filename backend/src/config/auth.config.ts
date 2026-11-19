export function getAuthConfig() {
    const jwtSecret = process.env.JWT_SECRET_KEY;
    const accessTtlSeconds = Number(process.env.ACCESS_TOKEN_TTL_SECONDS);
    const refreshTtlSeconds = Number(process.env.REFRESH_TOKEN_TTL_SECONDS);

    if (
        !jwtSecret ||
        !Number.isInteger(accessTtlSeconds) ||
        !Number.isInteger(refreshTtlSeconds) ||
        accessTtlSeconds <= 0 ||
        refreshTtlSeconds <= 0
    ) {
        throw new Error('Invalid authentication configuration');
    }

    const envData = {
        jwtSecret,
        accessTtlSeconds,
        refreshTtlSeconds,
    };

    return envData;
}