const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const modulesDir = path.join(srcDir, 'modules');

const layerDirs = {
    model: path.join(srcDir, 'models'),
    controller: path.join(srcDir, 'controllers'),
    route: path.join(srcDir, 'routes'),
    service: path.join(srcDir, 'services'),
    validation: path.join(srcDir, 'validations')
};

// Create dirs
Object.values(layerDirs).forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Gather all files to be moved
const filesToMove = [];
if (fs.existsSync(modulesDir)) {
    const subdirs = fs.readdirSync(modulesDir);
    subdirs.forEach(subdir => {
        const fullSubdir = path.join(modulesDir, subdir);
        if (fs.statSync(fullSubdir).isDirectory()) {
            const files = fs.readdirSync(fullSubdir);
            files.forEach(file => {
                if (file.endsWith('.js')) {
                    const parts = file.split('.');
                    let type = parts[parts.length - 2];
                    if (!layerDirs[type]) {
                        type = 'service';
                    }
                    const oldPath = path.join(fullSubdir, file);
                    const newPath = path.join(layerDirs[type], file);
                    filesToMove.push({ oldPath, newPath, type, oldDir: fullSubdir, newDir: layerDirs[type] });
                }
            });
        }
    });
}

function getNewPathOf(absolutePath) {
    let testPath = absolutePath;
    if (!testPath.endsWith('.js')) {
        testPath += '.js';
    }

    // Try adjusting path separators for comparison 
    const normalizedTestPath = path.normalize(testPath);

    const movingFile = filesToMove.find(f => path.normalize(f.oldPath) === normalizedTestPath);
    if (movingFile) {
        if (!absolutePath.endsWith('.js')) {
            return movingFile.newPath.slice(0, -3); // remove .js
        }
        return movingFile.newPath;
    }
    return absolutePath;
}

// Process each file's contents
filesToMove.forEach(fileObj => {
    let content = fs.readFileSync(fileObj.oldPath, 'utf8');

    content = content.replace(/require\(['"]([^'"]+)['"]\)/g, (match, requirePath) => {
        if (!requirePath.startsWith('.')) return match;

        const absoluteOldRequirePath = path.resolve(fileObj.oldDir, requirePath);
        const absoluteNewRequirePath = getNewPathOf(absoluteOldRequirePath);

        let newRelativeRequirePath = path.relative(fileObj.newDir, absoluteNewRequirePath);
        newRelativeRequirePath = newRelativeRequirePath.replace(/\\/g, '/');

        if (!newRelativeRequirePath.startsWith('.')) {
            newRelativeRequirePath = './' + newRelativeRequirePath;
        }

        return `require('${newRelativeRequirePath}')`;
    });

    fs.writeFileSync(fileObj.newPath, content);
});

// Update server.js
const serverJsPath = path.join(srcDir, 'server.js');
if (fs.existsSync(serverJsPath)) {
    let serverContent = fs.readFileSync(serverJsPath, 'utf8');
    serverContent = serverContent.replace(/require\(['"]([^'"]+)['"]\)/g, (match, requirePath) => {
        if (!requirePath.startsWith('.')) return match;
        const absoluteOldRequirePath = path.resolve(srcDir, requirePath);
        const absoluteNewRequirePath = getNewPathOf(absoluteOldRequirePath);
        let newRelativeRequirePath = path.relative(srcDir, absoluteNewRequirePath);
        newRelativeRequirePath = newRelativeRequirePath.replace(/\\/g, '/');
        if (!newRelativeRequirePath.startsWith('.')) {
            newRelativeRequirePath = './' + newRelativeRequirePath;
        }
        return `require('${newRelativeRequirePath}')`;
    });
    fs.writeFileSync(serverJsPath, serverContent);
}

// Clean up old files
filesToMove.forEach(fileObj => {
    fs.unlinkSync(fileObj.oldPath);
});

if (fs.existsSync(modulesDir)) {
    const subdirs = fs.readdirSync(modulesDir);
    subdirs.forEach(subdir => {
        const fullSubdir = path.join(modulesDir, subdir);
        if (fs.existsSync(fullSubdir) && fs.statSync(fullSubdir).isDirectory()) {
            fs.rmdirSync(fullSubdir);
        }
    });
    fs.rmdirSync(modulesDir);
}

console.log('Migration complete!');
