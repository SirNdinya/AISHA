const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (file === 'node_modules' || file === 'dist') return;
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Replace uppercase underscore words inside JSX text (> TEXT_HERE <)
    // We match > followed by characters that DO NOT contain <, {, or lowercase letters, then <
    content = content.replace(/>([^<a-z{]+)</g, (match, text) => {
        // Only replace if it contains an underscore
        if (text.includes('_')) {
            return '>' + text.replace(/_/g, ' ') + '<';
        }
        return match;
    });

    // 2. Add spinner animation specifically for the bot in StudentDashboard.tsx
    if (file.includes('StudentDashboard.tsx')) {
        content = content.replace(
            /animate=\{\{ scale: \[1, 1\.1, 1\], opacity: \[0\.5, 1, 0\.5\] \}\}\n\s*transition=\{\{ duration: 2, repeat: Infinity \}\}/,
            `animate={{ rotate: 360 }}\n                                                 transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}`
        );
    }

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Updated', file);
    }
});
