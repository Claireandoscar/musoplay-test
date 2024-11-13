const chokidar = require('chokidar');
const fs = require('fs-extra');
const path = require('path');

// Paths configuration
const WATCH_DIR = path.join(__dirname, 'public/assets/audio/dailyMelodies');
const CURRENT_JSON_PATH = path.join(__dirname, 'public/data/dailyMelodies/current.json');

// Function to update current.json
function updateCurrentJson() {
    // Read the directory
    const files = fs.readdirSync(WATCH_DIR);
    
    // Filter and organize files
    const barFiles = files
        .filter(file => file.startsWith('bar') && file.endsWith('.mp3'))
        .sort((a, b) => {
            const aNum = parseInt(a.match(/bar(\d)/)[1]);
            const bNum = parseInt(b.match(/bar(\d)/)[1]);
            return aNum - bNum;
        });
    
    const tuneFile = files.find(file => file.includes('tune.mp3'));
    
    // Create the JSON structure
    const currentJson = {
        melodyParts: barFiles.map(file => `/assets/audio/dailyMelodies/${file}`),
        fullTune: `/assets/audio/dailyMelodies/${tuneFile}`
    };
    
    // Write to current.json
    fs.writeJsonSync(CURRENT_JSON_PATH, currentJson, { spaces: 2 });
    console.log('current.json updated at:', new Date().toLocaleString());
}

// Watch for changes
const watcher = chokidar.watch(WATCH_DIR, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true
});

// Add event listeners
watcher
    .on('add', path => {
        console.log(`File ${path} has been added`);
        updateCurrentJson();
    })
    .on('unlink', path => {
        console.log(`File ${path} has been removed`);
        updateCurrentJson();
    })
    .on('change', path => {
        console.log(`File ${path} has been changed`);
        updateCurrentJson();
    });

// Initial update
updateCurrentJson();

console.log('Watching for melody file changes...');