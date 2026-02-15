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
    console.log("Usage: agent-utils <sync|promote> [file]");
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

} else {
    console.error("Unknown command. Use 'sync' or 'promote'.");
}
