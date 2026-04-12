const jwt = require('jsonwebtoken');
const { execSync, spawn } = require('child_process');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../../src/models/userManagement.model');
const bcrypt = require('bcryptjs');

const runTest = async () => {
    const testType = process.argv[2] || 'appliance';
    const testFile = testType === 'cost' ? 'tests/performance/costs-load.yml' : 'tests/performance/appliance-load.yml';
    
    console.log(`--- Setting up Performance Test for: ${testType} ---`);

    // 1. Ensure Test User exists in DB
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const testUserId = '60d5ecb8b39d1c0015f1a234';
        let user = await User.findById(testUserId);
        
        if (!user) {
            console.log('Seeding test user...');
            const hashedPassword = await bcrypt.hash('password123', 10);
            await User.create({
                _id: testUserId,
                name: 'Perf Test User',
                email: 'perf@example.com',
                password: hashedPassword,
                role: 'user'
            });
            console.log('Test user created.');
        } else {
            console.log('Test user already exists.');
        }
        await mongoose.connection.close();
    } catch (err) {
        console.error('Failed to seed test user:', err.message);
        process.exit(1);
    }

    // 2. Generate Token
    const payload = { id: '60d5ecb8b39d1c0015f1a234', role: 'user' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Generated Test Token.');

    // 3. Start Server
    console.log('Starting server...');
    const server = spawn('node', ['src/server.js'], {
        env: { ...process.env, PORT: '5000', NODE_ENV: 'production' },
        cwd: path.join(__dirname, '../../')
    });

    server.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Server running')) {
            console.log('Server is ready. Starting Artillery...');
            
            try {
                // 4. Run Artillery
                const artilleryBin = path.join(__dirname, '../../node_modules/.bin/artillery.cmd');
                const artilleryCmd = `"${artilleryBin}" run ${testFile} --output report-${testType}.json`;
                
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
                console.log('Tearing down...');
                server.kill();
                process.exit(0);
            }
        }
    });

    server.stderr.on('data', (data) => {
        console.error(`Server Error: ${data}`);
    });

    setTimeout(() => {
        console.error('Server startup timed out.');
        server.kill();
        process.exit(1);
    }, 20000);
};

runTest();
