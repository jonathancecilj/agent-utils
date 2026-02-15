#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const AGENT_UTILS_ROOT = path.resolve(__dirname, '..');
const AGENTS_DIR = path.join(AGENT_UTILS_ROOT, 'agents-studio');
const SKILLS_DIR = path.join(AGENT_UTILS_ROOT, 'skills-studio');

const command = process.argv[2];
const target = process.argv[3];

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
        conststat = fs.statSync(filePath);
        if (conststat && conststat.isDirectory()) {
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
        // console.warn("No .agent directory found in current project to validate.");
        // process.exit(0);
    }

    const centralAgents = loadCentralFiles(AGENTS_DIR);
    const centralSkills = loadCentralFiles(SKILLS_DIR);
    const localFiles = getFiles(localAgentDir);

    const results = [];

    localFiles.forEach(localFilePath => {
        const localContent = fs.readFileSync(localFilePath, 'utf8');
        const localFileName = path.basename(localFilePath);
        const relativePath = path.relative(localAgentDir, localFilePath);

        // 1. Find all potential candidates with matching filenames
        let candidates = [];

        // Search Agents
        for (const [key, content] of Object.entries(centralAgents)) {
            if (path.basename(key) === localFileName) {
                candidates.push({ key, content, type: 'Agent', dir: AGENTS_DIR });
            }
        }
        // Search Skills
        for (const [key, content] of Object.entries(centralSkills)) {
            if (path.basename(key) === localFileName) {
                candidates.push({ key, content, type: 'Skill', dir: SKILLS_DIR });
            }
        }

        let bestMatch = null;

        if (candidates.length > 0) {
            // Strategy to pick the best match from candidates:
            // 1. Exact Content Match (Highest Priority)
            // 2. Relative Path Match (Medium Priority)
            // 3. Shortest Path (Lowest Priority - prefer root)

            // Normalize local relative path for comparison (remove .agent/personas prefix etc)
            let cleanLocalPath = relativePath.replace(/^(\.agent\/)?(personas|skills)\//, '');

            // Grade matches
            const scoredCandidates = candidates.map(c => {
                let score = 0;
                const isContentExact = localContent.trim() === c.content.trim();
                if (isContentExact) score += 100;

                // Path match?
                if (c.key === cleanLocalPath) score += 50;

                // Penalize depth (prefer root files slightly if ambiguous)
                const depth = c.key.split(path.sep).length;
                score -= depth;

                return { ...c, score, isContentExact };
            });

            // Sort by score desvending
            scoredCandidates.sort((a, b) => b.score - a.score);
            bestMatch = scoredCandidates[0];

            if (bestMatch.isContentExact) {
                results.push({ status: 'Synced', localPath: localFilePath, ...bestMatch });
            } else {
                results.push({ status: 'Modified', localPath: localFilePath, ...bestMatch });
            }

        } else {
            // 2. Fuzzy Search (No filename match found)
            let fuzzyMatch = { score: 0, key: null, type: null, dir: null };

            // Check against Agents
            for (const [key, content] of Object.entries(centralAgents)) {
                const score = getJaccardSimilarity(localContent, content);
                if (score > fuzzyMatch.score) fuzzyMatch = { score, key, type: 'Agent', dir: AGENTS_DIR };
            }
            // Check against Skills
            for (const [key, content] of Object.entries(centralSkills)) {
                const score = getJaccardSimilarity(localContent, content);
                if (score > fuzzyMatch.score) fuzzyMatch = { score, key, type: 'Skill', dir: SKILLS_DIR };
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

        // Sync Agents
        if (manifest.agents) {
            const localAgentsDir = path.resolve(process.cwd(), '.agent/personas');
            ensureDir(localAgentsDir);
            manifest.agents.forEach(agentName => {
                const fileName = agentName.endsWith('.md') ? agentName : `${agentName}.md`;

                // Try finding file in agents-studio recursively or structurally
                // Simple approach: if agentName has slashes, check exact path. 
                // If not, check if it exists at root, or search for it?
                // For now, let's assume manifest path matches central repo structure OR is just a filename at root.

                let src = path.join(AGENTS_DIR, fileName);
                // Check if file exists, if not, maybe it is nested and user only gave name?
                if (!fs.existsSync(src)) {
                    // try finding it
                    const allFiles = loadCentralFiles(AGENTS_DIR);
                    const match = Object.keys(allFiles).find(k => path.basename(k) === path.basename(fileName));
                    if (match) src = path.join(AGENTS_DIR, match);
                }


                const dest = path.join(localAgentsDir, path.basename(fileName)); // Flatten to personas dir for local use? Or keep structure?
                // Flattening is safer for simple consumption unless we want deep structure locally.

                if (fs.existsSync(src)) {
                    ensureDir(path.dirname(dest));
                    fs.copyFileSync(src, dest);
                    console.log(`Synced Agent: ${fileName}`);
                } else {
                    console.warn(`Warning: Agent '${fileName}' not found in agent-utils.`);
                }
            });
        }

        // Sync Skills
        if (manifest.skills) {
            const localSkillsDir = path.resolve(process.cwd(), '.agent/skills');
            ensureDir(localSkillsDir);
            manifest.skills.forEach(skillName => {
                const srcPath = path.join(SKILLS_DIR, skillName);
                const destPath = path.join(localSkillsDir, skillName); // Keep folder name

                if (fs.existsSync(srcPath)) {
                    ensureDir(path.dirname(destPath)); // Ensure parent dir exists
                    execSync(`rm -rf "${destPath}" && cp -R "${srcPath}" "${destPath}"`);
                    console.log(`Synced Skill: ${skillName}`);
                } else {
                    console.warn(`Warning: Skill '${skillName}' not found in agent-utils.`);
                }
            });
        }

    } else if (command === 'promote') {
        // If specific file argument is provided, just promote that one (legacy/specific mode)
        // OTHERWISE, run smart promote.

        let candidates = [];

        if (target) {
            // Single file mode - check what it corresponds to
            const filePath = path.resolve(target);
            if (!fs.existsSync(filePath)) {
                console.error(`Error: File '${filePath}' not found.`);
                process.exit(1);
            }
            // Mock a "New" status for this file to trigger placement logic
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
            let destDir = AGENTS_DIR; // Default

            // Strategic Placement Logic
            if (item.status === 'Modified') {
                destPath = path.join(item.dir, item.key);
                console.log(`\n[Modified] ${fileName} -> ${path.relative(AGENT_UTILS_ROOT, destPath)}`);
            } else if (item.status === 'Duplicate') {
                destPath = path.join(item.dir, item.key);
                console.log(`\n[Duplicate] ${fileName} -> ${path.relative(AGENT_UTILS_ROOT, destPath)} (Will overwrite '${item.key}')`);
            } else {
                // New File
                // 1. Try to infer category from local path (e.g. .agent/personas/engineering/foo.md)
                const localRelative = path.relative(path.resolve(process.cwd(), '.agent'), item.localPath);

                // Heuristic: Is it a skill or persona?
                const isSkill = localRelative.includes('skills') || item.localPath.includes('SKILL.md');
                destDir = isSkill ? SKILLS_DIR : AGENTS_DIR;

                // Remove 'personas' or 'skills' from path if present to get clean category
                let cleanPath = localRelative.replace(/^(personas|skills)\//, '');

                // If cleanPath has a directory structure, check if that structure exists in central
                const subDir = path.dirname(cleanPath);
                if (subDir && subDir !== '.') {
                    // Check if this subdir exists in central
                    if (fs.existsSync(path.join(destDir, subDir))) {
                        destPath = path.join(destDir, cleanPath);
                    }
                }

                if (!destPath) {
                    // Default to parent dir (root of agents-studio or skills-studio)
                    // Or prompts user? For now, default to root.
                    destPath = path.join(destDir, path.basename(item.localPath));
                }

                console.log(`\n[New] ${fileName} -> ${path.relative(AGENT_UTILS_ROOT, destPath)}`);
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

        const centralAgents = loadCentralFiles(AGENTS_DIR);
        const centralSkills = loadCentralFiles(SKILLS_DIR);

        const availableAgents = Object.keys(centralAgents).sort();
        const availableSkills = Object.keys(centralSkills).sort();

        // Load existing manifest
        const manifestPath = path.resolve(process.cwd(), 'agent-manifest.json');
        let manifest = { agents: [], skills: [] };
        if (fs.existsSync(manifestPath)) {
            try {
                manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                manifest.agents = manifest.agents || [];
                manifest.skills = manifest.skills || [];
            } catch (e) {
                console.warn("Could not parse existing agent-manifest.json, starting fresh.");
            }
        }

        // Helper to display list and toggle selections
        function printSelection(title, items, selected) {
            console.log(`\n--- ${title} ---`);
            items.forEach((item, index) => {
                const isSelected = selected.includes(item);
                const mark = isSelected ? '[x]' : '[ ]';
                console.log(`${index + 1}. ${mark} ${item}`);
            });
        }

        // Interact with User
        // Agents
        let doneAgents = false;
        while (!doneAgents) {
            printSelection("Available Agents", availableAgents, manifest.agents);
            console.log("\nEnter numbers to toggle selection (space separated), 'a' for all, 'n' for none, or 'd' when done.");
            const ans = await askQuestion("Select Agents > ");

            if (ans.toLowerCase() === 'd') {
                doneAgents = true;
            } else if (ans.toLowerCase() === 'a') {
                manifest.agents = [...availableAgents];
            } else if (ans.toLowerCase() === 'n') {
                manifest.agents = [];
            } else {
                const indices = ans.split(/\s+/).map(s => parseInt(s, 10)).filter(n => !isNaN(n));
                indices.forEach(i => {
                    if (i > 0 && i <= availableAgents.length) {
                        const item = availableAgents[i - 1];
                        if (manifest.agents.includes(item)) {
                            manifest.agents = manifest.agents.filter(x => x !== item);
                        } else {
                            manifest.agents.push(item);
                        }
                    }
                });
            }
        }

        // Skills
        let doneSkills = false;
        while (!doneSkills) {
            printSelection("Available Skills", availableSkills, manifest.skills);
            console.log("\nEnter numbers to toggle selection (space separated), 'a' for all, 'n' for none, or 'd' when done.");
            const ans = await askQuestion("Select Skills > ");

            if (ans.toLowerCase() === 'd') {
                doneSkills = true;
            } else if (ans.toLowerCase() === 'a') {
                manifest.skills = [...availableSkills];
            } else if (ans.toLowerCase() === 'n') {
                manifest.skills = [];
            } else {
                const indices = ans.split(/\s+/).map(s => parseInt(s, 10)).filter(n => !isNaN(n));
                indices.forEach(i => {
                    if (i > 0 && i <= availableSkills.length) {
                        const item = availableSkills[i - 1];
                        if (manifest.skills.includes(item)) {
                            manifest.skills = manifest.skills.filter(x => x !== item);
                        } else {
                            manifest.skills.push(item);
                        }
                    }
                });
            }
        }

        // Save Manifest
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`\nUpdated ${manifestPath}`);

        // Run Sync
        console.log("Running sync...");
        // Re-run the script with 'sync' command
        // We can't easily recurse run() cleanly because of how it's structured, 
        // but we can spawn a child process or just copy the sync logic. 
        // For simplicity and to avoid code duplication, I'll execute the script itself.
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
            if (r.status === 'Synced') {
                console.log(`✅ [${r.type || 'Synced'}] ${path.basename(r.localPath)}: Synced`);
            } else if (r.status === 'Modified') {
                console.log(`⚠️  [${r.type}] ${path.basename(r.localPath)}: Modified locally (differs from ${r.key})`);
            } else if (r.status === 'Duplicate') {
                console.log(`🤔 [${r.type}] ${path.basename(r.localPath)}: Potential duplicate of '${r.key}' (Similarity: ${(r.score * 100).toFixed(1)}%)`);
            } else {
                console.log(`❓ [New] ${path.basename(r.localPath)}: New local file`);
            }
        });
    } else if (command === 'help') {
        console.log(`
Agent Utils - AI Agent Management CLI
=====================================

Commands:

  1. import
     Interactive setup tool. Scans the central repository for available agents and skills,
     allows you to select them via a menu, updates your 'agent-manifest.json', and
     automatically runs the sync process.
     Usage: agent-utils import

  2. sync
     Downloads and updates agents/skills defined in your 'agent-manifest.json'.
     Use this to fetch the latest versions of your configured agents.
     Usage: agent-utils sync

  3. promote [file]
     Promotes local changes back to the central repository.
     - Without arguments: Scans for modified, new, or duplicate files and asks to promote them.
     - With file argument: Promotes a specific file.
     Usage: agent-utils promote
            agent-utils promote path/to/agent.md

  4. validate
     Checks your local agents against the central repository.
     Identifies synced, modified, duplicate, or completely new files.
     Usage: agent-utils validate

  5. help
     Displays this help message.
     Usage: agent-utils help
`);
    } else {
        console.error("Unknown command. Run 'agent-utils help' to see available commands.");
    }
}

run();
