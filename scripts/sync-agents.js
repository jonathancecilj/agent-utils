#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const AGENT_UTILS_ROOT = path.resolve(__dirname, '..');
const AGENTS_STUDIO_DIR = path.join(AGENT_UTILS_ROOT, 'agents-studio');
const PERSONAS_DIR = path.join(AGENTS_STUDIO_DIR, 'personas');
const WORKFLOWS_DIR = path.join(AGENTS_STUDIO_DIR, 'workflows');
const SKILLS_DIR = path.join(AGENTS_STUDIO_DIR, 'skills');
const CONFIG_DIR = path.join(AGENTS_STUDIO_DIR, 'config');

const command = process.argv[2];
const target = process.argv[3];
const isForce = process.argv.includes('--force'); // Simple force flag check for future use if needed

if (!command) {
    console.log("Usage: agent-utils <command> [args]");
    console.log("Run 'agent-utils help' for more information.");
    process.exit(1);
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Helper: Recursively get all files
function getFiles(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(filePath));
        } else {
            if (file.endsWith('.md') && file.toLowerCase() !== 'readme.md') { // Only check markdown files, excluding README.md
                results.push(filePath);
            }
        }
    });
    return results;
}

// Helper: Jaccard Similarity
function getJaccardSimilarity(str1, str2) {
    const set1 = new Set(str1.toLowerCase().split(/\s+/));
    const set2 = new Set(str2.toLowerCase().split(/\s+/));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
}

// Helper: Load Central Repo Files
function loadCentralFiles(dir) {
    const files = {};
    if (fs.existsSync(dir)) {
        const allFiles = getFiles(dir);
        allFiles.forEach(f => {
            const content = fs.readFileSync(f, 'utf8');
            files[path.relative(dir, f)] = content;
        });
    }
    return files;
}

async function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

function getValidationStatus() {
    const localAgentDir = path.resolve(process.cwd(), '.agent');

    if (!fs.existsSync(localAgentDir)) {
        return [];
    }

    const centralPersonas = loadCentralFiles(PERSONAS_DIR);
    const centralWorkflows = loadCentralFiles(WORKFLOWS_DIR);
    const centralSkills = loadCentralFiles(SKILLS_DIR);
    const centralConfig = loadCentralFiles(CONFIG_DIR);
    const localFiles = getFiles(localAgentDir);

    const results = [];

    localFiles.forEach(localFilePath => {
        const localContent = fs.readFileSync(localFilePath, 'utf8');
        const localFileName = path.basename(localFilePath);
        const relativePath = path.relative(localAgentDir, localFilePath);

        // 1. Find all potential candidates with matching filenames
        let candidates = [];

        // Search Personas
        for (const [key, content] of Object.entries(centralPersonas)) {
            if (path.basename(key) === localFileName) {
                candidates.push({ key, content, type: 'Persona', dir: PERSONAS_DIR });
            }
        }
        // Search Workflows
        for (const [key, content] of Object.entries(centralWorkflows)) {
            if (path.basename(key) === localFileName) {
                candidates.push({ key, content, type: 'Workflow', dir: WORKFLOWS_DIR });
            }
        }
        // Search Skills
        for (const [key, content] of Object.entries(centralSkills)) {
            if (path.basename(key) === localFileName) {
                candidates.push({ key, content, type: 'Skill', dir: SKILLS_DIR });
            }
        }
        // Search Config
        for (const [key, content] of Object.entries(centralConfig)) {
            if (path.basename(key) === localFileName) {
                candidates.push({ key, content, type: 'Config', dir: CONFIG_DIR });
            }
        }

        let bestMatch = null;

        if (candidates.length > 0) {
            // Strategy to pick the best match from candidates:
            // 1. Exact Content Match (Highest Priority)
            // 2. Relative Path Match (Medium Priority)
            // 3. Shortest Path (Lowest Priority - prefer root)

            // Normalize local relative path for comparison (remove .agent/personas prefix etc)
            let cleanLocalPath = relativePath.replace(/^(\.agent\/)?(personas|workflows|skills)\//, '');

            // Grade matches
            const scoredCandidates = candidates.map(c => {
                let score = 0;
                const isContentExact = localContent.trim() === c.content.trim();
                if (isContentExact) score += 100;

                // Path match?
                if (c.key === cleanLocalPath) score += 50;

                // Generic Filename Protection (SKILL.md, README.md, index.js)
                // If filename is generic and paths DON'T match, severe penalty to avoid false positives.
                const isGeneric = ['skill.md', 'readme.md', 'index.js', 'index.ts', 'main.py'].includes(path.basename(localFileName).toLowerCase());
                if (isGeneric && c.key !== cleanLocalPath) {
                    score -= 1000;
                }

                // Penalize depth (prefer root files slightly if ambiguous)
                const depth = c.key.split(path.sep).length;
                score -= depth;

                return { ...c, score, isContentExact };
            });

            // Sort by score descending
            scoredCandidates.sort((a, b) => b.score - a.score);
            bestMatch = scoredCandidates[0];

            // Validate match quality
            if (bestMatch.score <= 0) {
                bestMatch = null;
            }
        }

        if (bestMatch) {
            if (bestMatch.isContentExact) {
                results.push({ status: 'Synced', localPath: localFilePath, ...bestMatch });
            } else {
                results.push({ status: 'Modified', localPath: localFilePath, ...bestMatch });
            }
        } else {
            // 2. Fuzzy Search (No filename match found OR match rejected)
            let fuzzyMatch = { score: 0, key: null, type: null, dir: null };

            // Check against Personas
            for (const [key, content] of Object.entries(centralPersonas)) {
                const score = getJaccardSimilarity(localContent, content);
                if (score > fuzzyMatch.score) fuzzyMatch = { score, key, type: 'Persona', dir: PERSONAS_DIR };
            }
            // Check against Workflows
            for (const [key, content] of Object.entries(centralWorkflows)) {
                const score = getJaccardSimilarity(localContent, content);
                if (score > fuzzyMatch.score) fuzzyMatch = { score, key, type: 'Workflow', dir: WORKFLOWS_DIR };
            }
            // Check against Skills
            for (const [key, content] of Object.entries(centralSkills)) {
                const score = getJaccardSimilarity(localContent, content);
                if (score > fuzzyMatch.score) fuzzyMatch = { score, key, type: 'Skill', dir: SKILLS_DIR };
            }
            // Check against Config
            for (const [key, content] of Object.entries(centralConfig)) {
                const score = getJaccardSimilarity(localContent, content);
                if (score > fuzzyMatch.score) fuzzyMatch = { score, key, type: 'Config', dir: CONFIG_DIR };
            }

            if (fuzzyMatch.score > 0.8) {
                results.push({ status: 'Duplicate', localPath: localFilePath, ...fuzzyMatch });
            } else {
                results.push({ status: 'New', localPath: localFilePath });
            }
        }
    });

    return results;
}


async function run() {

    if (command === 'sync') {
        const manifestPath = path.resolve(process.cwd(), 'agent-manifest.json');
        if (!fs.existsSync(manifestPath)) {
            console.error("Error: agent-manifest.json not found in current directory.");
            process.exit(1);
        }

        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        // Normalize Manifest
        const allItems = [...(manifest.agents || []), ...(manifest.skills || []), ...(manifest.workflows || []), ...(manifest.config || [])];
        const uniqueItems = [...new Set(allItems)];

        const localPersonasDir = path.resolve(process.cwd(), '.agent/personas');
        const localWorkflowsDir = path.resolve(process.cwd(), '.agent/workflows');
        const localSkillsDir = path.resolve(process.cwd(), '.agent/skills');
        const localConfigDir = path.resolve(process.cwd(), '.agent/config');

        ensureDir(localPersonasDir);
        ensureDir(localWorkflowsDir);
        ensureDir(localSkillsDir);
        ensureDir(localConfigDir);

        // Pre-load file maps
        const availablePersonas = loadCentralFiles(PERSONAS_DIR);
        const availableWorkflows = loadCentralFiles(WORKFLOWS_DIR);
        const availableSkills = loadCentralFiles(SKILLS_DIR);
        const availableConfig = loadCentralFiles(CONFIG_DIR);

        // Helper to find best match
        function findBestMatch(itemName) {
            const searchName = itemName.endsWith('.md') ? itemName : `${itemName}.md`;
            const baseName = path.basename(searchName);
            const searchNameLower = searchName.toLowerCase();
            const baseNameLower = baseName.toLowerCase();

            // Collect all candidates
            const candidates = [];

            const addCandidates = (collection, type, srcDir) => {
                Object.keys(collection).forEach(key => {
                    const keyBase = path.basename(key);
                    const keyLower = key.toLowerCase();
                    const keyBaseLower = keyBase.toLowerCase();

                    let score = 0;

                    // 1. Exact Key Match (e.g. 'software-engineer/staff-engineer.md')
                    if (key === searchName) score += 100;
                    else if (keyLower === searchNameLower) score += 90;

                    // 2. Basename Match (e.g. 'staff-engineer.md')
                    else if (keyBase === baseName) score += 80;
                    else if (keyBaseLower === baseNameLower) score += 70;

                    // 3. Jaccard/Fuzzy on filename
                    else {
                        const sim = getJaccardSimilarity(baseName, keyBase);
                        if (sim > 0.5) score += (sim * 50);
                    }

                    // Bonus: Path overlap?
                    if (searchName.includes(path.dirname(key))) score += 5;

                    if (score > 0) {
                        candidates.push({ key, type, srcDir, score });
                    }
                });
            };

            addCandidates(availablePersonas, 'Persona', PERSONAS_DIR);
            addCandidates(availableWorkflows, 'Workflow', WORKFLOWS_DIR);
            // Skills (files)
            addCandidates(availableSkills, 'Skill', SKILLS_DIR);
            addCandidates(availableConfig, 'Config', CONFIG_DIR);

            // Skills (Directories) - special case
            // If SKILLS_DIR has directories, we should check those too
            if (fs.existsSync(SKILLS_DIR)) {
                const skillDirs = fs.readdirSync(SKILLS_DIR).filter(f => fs.statSync(path.join(SKILLS_DIR, f)).isDirectory());
                skillDirs.forEach(skillDirName => {
                    let score = 0;
                    if (skillDirName === itemName) score += 100;
                    else if (skillDirName.toLowerCase() === itemName.toLowerCase()) score += 90;
                    else {
                        const sim = getJaccardSimilarity(itemName, skillDirName);
                        if (sim > 0.5) score += (sim * 50);
                    }

                    if (score > 0) {
                        candidates.push({ key: skillDirName, type: 'SkillDir', srcDir: SKILLS_DIR, score });
                    }
                });
            }

            candidates.sort((a, b) => b.score - a.score);
            return candidates.length > 0 ? candidates[0] : null;
        }

        // Cleanup Helper
        async function checkAndCleanup(fileName, correctType) {
            const locations = [
                { type: 'Persona', dir: localPersonasDir },
                { type: 'Workflow', dir: localWorkflowsDir },
                { type: 'Skill', dir: localSkillsDir },
                { type: 'Config', dir: localConfigDir }
            ];

            // Filter out the correct location
            const incorrectLocations = locations.filter(l => l.type !== correctType);

            for (const loc of incorrectLocations) {
                const wrongPath = path.join(loc.dir, fileName);

                // Check if it exists
                if (fs.existsSync(wrongPath)) {
                    console.log(`\n⚠️  Found '${fileName}' in incorrect location: ${loc.dir} (Should be in ${correctType}s)`);

                    const ans = await askQuestion(`Do you want to delete this incorrect file? (y/n) > `);
                    if (ans.toLowerCase() === 'y') {
                        fs.rmSync(wrongPath, { recursive: true, force: true });
                        console.log(`✅ Deleted incorrect file.`);
                    } else {
                        console.log("Skipped deletion.");
                    }
                }
            }
        }

        for (const itemName of uniqueItems) {
            const match = findBestMatch(itemName);

            if (match) {
                // Determine destination
                let destDir = localPersonasDir;
                let correctType = 'Persona';

                if (match.type === 'Workflow') {
                    destDir = localWorkflowsDir;
                    correctType = 'Workflow';
                }
                if (match.type === 'Skill' || match.type === 'SkillDir') {
                    destDir = localSkillsDir;
                    correctType = 'Skill';
                }
                if (match.type === 'Config') {
                    destDir = localConfigDir;
                    correctType = 'Config';
                }

                if (match.type === 'SkillDir') {
                    // Sync Directory
                    const srcPath = path.join(match.srcDir, match.key);
                    const destPath = path.join(destDir, match.key);
                    ensureDir(path.dirname(destPath));
                    execSync(`rm -rf "${destPath}" && cp -R "${srcPath}" "${destPath}"`);
                    console.log(`Synced ${match.type}: ${match.key} (Source: ${match.srcDir})`);

                    // Cleanup check (for directory)
                    await checkAndCleanup(match.key, correctType);

                } else {
                    // Sync File
                    const srcPath = path.join(match.srcDir, match.key);

                    // Determine destination path:
                    // For Skills, we MUST preserve folder structure because SKILL.md is generic.
                    let destPath;
                    if (match.type === 'Skill') {
                        destPath = path.join(destDir, match.key);
                    } else {
                        destPath = path.join(destDir, path.basename(match.key));
                    }

                    ensureDir(path.dirname(destPath));
                    fs.copyFileSync(srcPath, destPath);
                    console.log(`Synced ${match.type}: ${match.key} (Matches '${itemName}')`);

                    // Cleanup check (for file)
                    await checkAndCleanup(path.basename(match.key), correctType);
                }
            } else {
                console.warn(`Warning: Could not find agent/skill/workflow '${itemName}' in agent-utils.`);
            }
        }

    } else if (command === 'promote') {
        let candidates = [];

        if (target) {
            const filePath = path.resolve(target);
            if (!fs.existsSync(filePath)) {
                console.error(`Error: File '${filePath}' not found.`);
                process.exit(1);
            }
            candidates = [{ status: 'New', localPath: filePath }];
        } else {
            console.log("Scanning for changes to promote...");
            const validationResults = getValidationStatus();
            candidates = validationResults.filter(r => r.status === 'Modified' || r.status === 'New' || r.status === 'Duplicate');
        }

        if (candidates.length === 0) {
            console.log("No changes detected to promote.");
            process.exit(0);
        }

        console.log(`Found ${candidates.length} candidate(s) for promotion.`);

        for (const item of candidates) {
            const fileName = path.basename(item.localPath);
            let destPath = null;
            let destDir = AGENTS_STUDIO_DIR; // Fallback

            // Strategic Placement Logic
            if (item.status === 'Modified' || item.status === 'Duplicate') {
                destPath = path.join(item.dir, item.key);
                console.log(`\n[${item.status}] ${fileName} -> ${path.relative(AGENT_UTILS_ROOT, destPath)}`);
            } else {
                // New File Logic
                // Infer type from local directory
                const localRelative = path.relative(path.resolve(process.cwd(), '.agent'), item.localPath);

                // Detection
                let detectedType = 'Unknown';
                let targetBaseDir = null;

                if (localRelative.includes('personas')) {
                    detectedType = 'Persona';
                    targetBaseDir = PERSONAS_DIR;
                } else if (localRelative.includes('workflows')) {
                    detectedType = 'Workflow';
                    targetBaseDir = WORKFLOWS_DIR;
                } else if (localRelative.includes('skills')) {
                    detectedType = 'Skill';
                    targetBaseDir = SKILLS_DIR;
                } else if (localRelative.includes('config')) {
                    detectedType = 'Config';
                    targetBaseDir = CONFIG_DIR;
                }

                if (!targetBaseDir) {
                    // Fallback: Ask user or default to Personas? 
                    console.log(`\nCould not automatically determine type for '${fileName}'. Defaulting to Persona.`);
                    detectedType = 'Persona';
                    targetBaseDir = PERSONAS_DIR;
                }

                // Clean matching prefix
                let cleanPath = localRelative.replace(/^(personas|workflows|skills|config)\//, '');

                // If the path had subdirectories locally, try to preserve them?
                // Or check if those subdirectories exist in target to verify category.

                destPath = path.join(targetBaseDir, cleanPath);
                console.log(`\n[New] ${fileName} -> ${path.relative(AGENT_UTILS_ROOT, destPath)} (Type: ${detectedType})`);
            }

            // Interactive Prompt
            const answer = await askQuestion(`Promote this file? (y/n): `);
            if (answer.toLowerCase() === 'y') {
                ensureDir(path.dirname(destPath));
                fs.copyFileSync(item.localPath, destPath);
                console.log(`✅ Promoted to ${path.relative(AGENT_UTILS_ROOT, destPath)}`);
            } else {
                console.log(`Skipped.`);
            }
        }


    } else if (command === 'import') {
        console.log("Fetching available agents and skills...");

        const availablePersonas = Object.keys(loadCentralFiles(PERSONAS_DIR)).map(p => path.basename(p));
        const availableWorkflows = Object.keys(loadCentralFiles(WORKFLOWS_DIR)).map(w => path.basename(w));
        const availableConfig = Object.keys(loadCentralFiles(CONFIG_DIR)).map(c => path.basename(c));

        // For skills, we list directories in skills-studio
        let availableSkills = [];
        if (fs.existsSync(SKILLS_DIR)) {
            availableSkills = fs.readdirSync(SKILLS_DIR).filter(f => fs.statSync(path.join(SKILLS_DIR, f)).isDirectory());
        }

        // Load existing manifest
        const manifestPath = path.resolve(process.cwd(), 'agent-manifest.json');
        let manifest = { agents: [], skills: [], workflows: [], config: [] };
        if (fs.existsSync(manifestPath)) {
            try {
                manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                manifest.agents = manifest.agents || [];
                manifest.skills = manifest.skills || [];
                manifest.workflows = manifest.workflows || [];
                manifest.config = manifest.config || [];
            } catch (e) {
                console.warn("Could not parse existing agent-manifest.json, starting fresh.");
            }
        }

        // Helper to display list and toggle selections
        function printSelection(title, items, selected) {
            console.log(`\n--- ${title} ---`);
            const sortedItems = [...new Set(items)].sort();
            sortedItems.forEach((item, index) => {
                const isSelected = selected.includes(item);
                const mark = isSelected ? '[x]' : '[ ]';
                console.log(`${index + 1}. ${mark} ${item}`);
            });
            return sortedItems;
        }

        async function handleSelection(title, items, currentSelection) {
            let done = false;
            while (!done) {
                const sortedItems = printSelection(title, items, currentSelection);
                console.log("\nEnter numbers to toggle selection, 'a' for all, 'n' for none, or 'd' when done.");
                const ans = await askQuestion(`${title} > `);

                if (ans.toLowerCase() === 'd') {
                    done = true;
                } else if (ans.toLowerCase() === 'a') {
                    // Add all not already present
                    sortedItems.forEach(item => {
                        if (!currentSelection.includes(item)) currentSelection.push(item);
                    });
                } else if (ans.toLowerCase() === 'n') {
                    // Clear all
                    currentSelection.length = 0;
                } else {
                    const indices = ans.split(/\s+/).map(s => parseInt(s, 10)).filter(n => !isNaN(n));
                    indices.forEach(i => {
                        if (i > 0 && i <= sortedItems.length) {
                            const item = sortedItems[i - 1];
                            const idx = currentSelection.indexOf(item);
                            if (idx > -1) {
                                currentSelection.splice(idx, 1);
                            } else {
                                currentSelection.push(item);
                            }
                        }
                    });
                }
            }
        }

        // Interact
        await handleSelection("Available Personas (Agents)", availablePersonas, manifest.agents);
        await handleSelection("Available Workflows", availableWorkflows, manifest.workflows);
        await handleSelection("Available Skills", availableSkills, manifest.skills);
        await handleSelection("Available Configs", availableConfig, manifest.config);

        // Save Manifest
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`\nUpdated ${manifestPath}`);

        // Run Sync
        console.log("Running sync...");
        try {
            execSync(`node "${__filename}" sync`, { stdio: 'inherit' });
        } catch (e) {
            console.error("Sync failed.");
        }

    } else if (command === 'validate') {
        const results = getValidationStatus();
        if (results.length === 0) {
            console.log("No files found to validate.");
            return;
        }

        console.log("Validation Results:");
        results.forEach(r => {
            // Use relative path for clearer identification (e.g. skills/create-stock-chart/SKILL.md)
            const displayPath = path.relative(path.resolve(process.cwd(), '.agent'), r.localPath);

            if (r.status === 'Synced') {
                console.log(`✅ [${r.type || 'Synced'}] ${displayPath}: Synced`);
            } else if (r.status === 'Modified') {
                console.log(`⚠️  [${r.type}] ${displayPath}: Modified locally (differs from ${r.key})`);
            } else if (r.status === 'Duplicate') {
                console.log(`🤔 [${r.type}] ${displayPath}: Potential duplicate of '${r.key}' (Similarity: ${(r.score * 100).toFixed(1)}%)`);
            } else {
                console.log(`❓ [New] ${displayPath}: New local file`);
            }
        });
    } else if (command === 'help') {
        console.log(`
Agent Utils - AI Agent Management CLI
=====================================

Commands:

  1. import
     Interactive setup tool. Scans the central repository for available Personas, Workflows, and Skills.
     Updates 'agent-manifest.json' and runs sync.

  2. sync
     Downloads and updates items defined in 'agent-manifest.json'.
     - Personas -> .agent/personas/
     - Workflows -> .agent/workflows/
     - Skills -> .agent/skills/
     - Config -> .agent/config/

  3. promote [file]
     Promotes local changes back to the central repository.
     - Scans source directory (.agent/personas, etc) to determine destination.

  4. validate
     Checks your local agents against the central repository.

  5. help
     Displays this help message.
`);
    } else {
        console.error("Unknown command. Run 'agent-utils help' to see available commands.");
    }
}

run();
