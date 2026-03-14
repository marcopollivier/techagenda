export function isDebugEnv(env: string): boolean {
    return !env || env === 'unknown' || env === 'local';
}

export function debugLog(env: string, ...args: any[]) {
    if (isDebugEnv(env)) {
        console.log('[DEBUG]', ...args);
    }
}
