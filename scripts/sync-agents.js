#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const AGENT_UTILS_ROOT = path.resolve(__dirname, '..');
const AGENTS_DIR = path.join(AGENT_UTILS_ROOT, 'agents-studio');
const SKILLS_DIR = path.join(AGENT_UTILS_ROOT, 'skills-studio');

const command = process.argv[2];
const target = process.argv[3];

if (!command) {
    console.log("Usage: agent-utils <sync|promote|validate> [file]");
    process.exit(1);
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

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
            const src = path.join(AGENTS_DIR, fileName);
            const dest = path.join(localAgentsDir, fileName);
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
            // Skill can be a file or a folder
            const srcPath = path.join(SKILLS_DIR, skillName);
            const destPath = path.join(localSkillsDir, skillName);

            if (fs.existsSync(srcPath)) {
                // Simple copy for now (using cp -r via exec for recursive folder support if needed, or fs.cpSync in newer node)
                // Using execSync for broad compatibility
                execSync(`rm -rf "${destPath}" && cp -R "${srcPath}" "${destPath}"`);
                console.log(`Synced Skill: ${skillName}`);
            } else {
                console.warn(`Warning: Skill '${skillName}' not found in agent-utils.`);
            }
        });
    }

} else if (command === 'promote') {
    if (!target) {
        console.error("Usage: agent-utils promote <path-to-file>");
        process.exit(1);
    }

    const srcPath = path.resolve(target);
    if (!fs.existsSync(srcPath)) {
        console.error(`Error: File '${srcPath}' not found.`);
        process.exit(1);
    }

    const fileName = path.basename(srcPath);

    // Determine if it's an Agent or Skill based on where it is? 
    // Or just default to Agent unless specified?
    // Let's assume .md in .agent/personas is a Persona.

    let destDir = AGENTS_DIR;
    // Simple heuristic: if path contains "skills", go to skills-studio
    if (srcPath.includes('/skills/') || srcPath.includes('SKILL.md')) {
        destDir = SKILLS_DIR;
    }

    const destPath = path.join(destDir, fileName);
    fs.copyFileSync(srcPath, destPath);
    console.log(`Promoted '${fileName}' to ${destDir}`);

} else if (command === 'validate') {
    const localAgentDir = path.resolve(process.cwd(), '.agent');

    if (!fs.existsSync(localAgentDir)) {
        console.warn("No .agent directory found in current project to validate.");
        process.exit(0);
    }

    // Helper: Recursively get all files
    function getFiles(dir) {
        let results = [];
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            const filePath = path.join(dir, file);
            conststat = fs.statSync(filePath);
            if (conststat && conststat.isDirectory()) {
                results = results.concat(getFiles(filePath));
            } else {
                if (file.endsWith('.md')) { // Only check markdown files
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

    console.log("Validating agents and skills...");

    const centralAgents = loadCentralFiles(AGENTS_DIR);
    const centralSkills = loadCentralFiles(SKILLS_DIR);
    const localFiles = getFiles(localAgentDir);

    localFiles.forEach(localFilePath => {
        const localContent = fs.readFileSync(localFilePath, 'utf8');
        const localFileName = path.basename(localFilePath);
        const relativePath = path.relative(localAgentDir, localFilePath);

        // 1. Check for Exact Name Match in Central
        let exactMatch = null;
        let matchType = null; // 'Agent' or 'Skill'

        // Check Agents
        for (const [key, content] of Object.entries(centralAgents)) {
            if (path.basename(key) === localFileName) {
                exactMatch = { key, content, type: 'Agent' };
                break;
            }
        }
        // Check Skills if not found in Agents
        if (!exactMatch) {
            for (const [key, content] of Object.entries(centralSkills)) {
                if (path.basename(key) === localFileName) {
                    exactMatch = { key, content, type: 'Skill' };
                    break;
                }
            }
        }

        if (exactMatch) {
            if (localContent.trim() === exactMatch.content.trim()) {
                console.log(`✅ [${exactMatch.type}] ${localFileName}: Exact match (Synced)`);
            } else {
                console.log(`⚠️  [${exactMatch.type}] ${localFileName}: Content differs from central repo (Modified locally)`);
            }
        } else {
            // 2. Fuzzy Search
            let bestMatch = { score: 0, key: null, type: null };

            // Check against Agents
            for (const [key, content] of Object.entries(centralAgents)) {
                const score = getJaccardSimilarity(localContent, content);
                if (score > bestMatch.score) bestMatch = { score, key, type: 'Agent' };
            }
            // Check against Skills
            for (const [key, content] of Object.entries(centralSkills)) {
                const score = getJaccardSimilarity(localContent, content);
                if (score > bestMatch.score) bestMatch = { score, key, type: 'Skill' };
            }

            if (bestMatch.score > 0.8) {
                console.log(`🤔 [${bestMatch.type}] ${localFileName}: Potential duplicate of '${bestMatch.key}' (Similarity: ${(bestMatch.score * 100).toFixed(1)}%)`);
            } else {
                console.log(`❓ [Unknown] ${localFileName}: No match found in central repo (New local file)`);
            }
        }
    });

} else {
    console.error("Unknown command. Use 'sync', 'promote', or 'validate'.");
}
