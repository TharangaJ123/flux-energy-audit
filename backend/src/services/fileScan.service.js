const axios = require('axios');

const shouldScanFiles = () => process.env.FILE_SCAN_ENABLED === 'true';

const scanFile = async ({ absolutePath, metadata = {} }) => {
    const scanApiUrl = process.env.FILE_SCAN_API_URL;
    if (!scanApiUrl) {
        return { status: 'skipped', reason: 'FILE_SCAN_API_URL is not configured' };
    }

    const endpoint = `${scanApiUrl.replace(/\/$/, '')}/scan`;
    const response = await axios.post(
        endpoint,
        {
            filePath: absolutePath,
            metadata,
        },
        {
            timeout: 5000,
        }
    );

    return response.data || { status: 'unknown' };
};

const enqueueFileScan = ({ absolutePath, metadata = {} }) => {
    if (!shouldScanFiles() || !absolutePath) {
        return;
    }

    // Fire-and-forget scan so uploads are not blocked by scanner latency.
    setImmediate(async () => {
        try {
            const result = await scanFile({ absolutePath, metadata });
            console.log('[FileScan] Completed', {
                path: absolutePath,
                status: result.status || 'unknown',
            });
        } catch (error) {
            console.error('[FileScan] Failed', {
                path: absolutePath,
                message: error.message,
            });
        }
    });
};

module.exports = {
    enqueueFileScan,
};
