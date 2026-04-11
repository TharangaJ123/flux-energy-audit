const jwt = require('jsonwebtoken');
const { execSync, spawn } = require('child_process');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const runTest = async () => {
    console.log('--- Setting up Performance Test ---');

    // 1. Generate Token
    const payload = {
        id: '60d5ecb8b39d1c0015f1a234', // Predictable test ID
        name: 'Perf Test User',
        email: 'perf@example.com',
        role: 'user'
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Generated Test Token.');

    // 2. Start Server
    console.log('Starting server...');
    const server = spawn('node', ['src/server.js'], {
        env: { ...process.env, PORT: '5000', NODE_ENV: 'production' },
        cwd: path.join(__dirname, '../../')
    });

    server.stdout.on('data', (data) => {
        if (data.toString().includes('Server running')) {
            console.log('Server is ready. Starting Artillery...');
            
    try {
                // 3. Run Artillery
                const artilleryBin = path.join(__dirname, '../../node_modules/.bin/artillery.cmd');
                const artilleryCmd = `"${artilleryBin}" run tests/performance/appliance-load.yml`;
                
                console.log(`Executing: ${artilleryCmd}`);
                execSync(artilleryCmd, {
                    stdio: 'inherit',
                    env: { ...process.env, AUTH_TOKEN: token },
                    cwd: path.join(__dirname, '../../')
                });
                console.log('Performance test completed successfully.');
            } catch (err) {
                console.error('Performance test failed:', err.message);
            } finally {
                // 4. Cleanup
                console.log('Tearing down...');
                server.kill();
                process.exit(0);
            }
        }
    });

    server.stderr.on('data', (data) => {
        console.error(`Server Error: ${data}`);
    });

    // Timeout if server fails to start
    setTimeout(() => {
        console.error('Server startup timed out.');
        server.kill();
        process.exit(1);
    }, 15000);
};

runTest();
