import { callClaudeJSON } from '../claude-client';
import { BusinessProfile } from '../../types';
import { ProjectFile } from './project-store';

interface FileSpec {
    path: string;
    purpose: string;
    code: string;
}

interface ArchitecturePlan {
    scope: 'landing' | 'multipage' | 'dashboard' | 'ecommerce' | 'saas';
    pages: string[];
    components: string[];
    colorScheme: { primary: string; secondary: string; accent: string; bg: string; text: string };
    typography: { heading: string; body: string };
    features: string[];
}

// ===== STEP 1: Plan Architecture =====
export async function planArchitecture(
    profile: BusinessProfile,
    userRequest?: string
): Promise<ArchitecturePlan> {
    const prompt = `You are a senior web architect. Analyze this business and plan a website.

Business: ${profile.summary}
Industry: ${profile.industry}
Stage: ${profile.business_stage}
Geography: ${profile.geography}
${userRequest ? `User request: ${userRequest}` : ''}

Respond with JSON:
{
  "scope": "landing or multipage or dashboard",
  "pages": ["index.html", "about.html"],
  "components": ["Navbar", "Hero", "Features", "Pricing", "Footer"],
  "colorScheme": {"primary": "#hex", "secondary": "#hex", "accent": "#hex", "bg": "#hex", "text": "#hex"},
  "typography": {"heading": "font name", "body": "font name"},
  "features": ["responsive", "animations", "contact form"]
}`;

    return callClaudeJSON<ArchitecturePlan>(
        'You are a web architect. Be concise. All values under 100 chars.',
        prompt,
        { maxTokens: 2048, temperature: 0.5 }
    );
}

// ===== PREMIUM DESIGN SYSTEM (injected into every file generation) =====
const PREMIUM_DESIGN_GUIDELINES = `
PREMIUM DESIGN SYSTEM — Follow these rules for EVERY file:

TYPOGRAPHY:
- Import Google Fonts: "Inter" for body, "Space Grotesk" for headings
- Body font-size: 16px, line-height: 1.7
- h1: 48px bold, h2: 36px bold, h3: 24px semibold
- Color: headings #111827, body text #374151

COLORS & THEME (LIGHT THEME — MANDATORY):
- Background: #ffffff (white) for body
- Surface/cards: #f9fafb with 1px solid #e5e7eb border
- Primary text: #111827 (near black) — MUST be clearly readable
- Secondary text: #6b7280
- Primary accent: vibrant blue #2563eb
- Accent gradient: linear-gradient(135deg, #2563eb, #7c3aed)
- CTA buttons: solid accent bg, white text
- DO NOT use dark backgrounds for the page body
- ALL text must have strong contrast against its background

LAYOUT:
- Max content width: 1200px, centered with margin: 0 auto
- Sections: padding 80px 20px
- Use CSS Grid and Flexbox
- Clean whitespace between sections

HERO SECTION:
- White or very light gradient background
- Large bold heading in #111827
- Subheading in #6b7280
- Prominent CTA button with accent gradient background and white text
- MUST have visible content — no empty hero

COMPONENTS:
- Cards: white bg, border-radius 12px, border 1px solid #e5e7eb, box-shadow: 0 1px 3px rgba(0,0,0,0.1), padding 24px
- Buttons: primary=gradient bg white text, border-radius 8px, padding 12px 24px, font-weight 600
- Navigation: white bg, border-bottom 1px solid #e5e7eb, sticky top
- Footer: bg #111827, text white/gray

ANIMATIONS:
- Smooth scroll: html { scroll-behavior: smooth }
- Hover on cards: translateY(-2px), box-shadow increase
- Button hover: opacity 0.9
- Keep animations subtle and professional

RESPONSIVE:
- Mobile-first with min-width media queries
- Stack columns on mobile
- Hamburger menu on mobile

CRITICAL: Every section MUST have visible text content. Use color #111827 for headings and #374151 for body text on white/light backgrounds.
`;

// ===== STEP 2: Generate Individual Files =====
async function generateFile(
    profile: BusinessProfile,
    plan: ArchitecturePlan,
    filePath: string,
    purpose: string,
    existingFiles: { path: string; summary: string }[]
): Promise<FileSpec> {
    const existingContext = existingFiles.length > 0
        ? `\nExisting files:\n${existingFiles.map(f => `- ${f.path}: ${f.summary}`).join('\n')}`
        : '';

    const prompt = `Generate the file: ${filePath}
Purpose: ${purpose}

Business: ${profile.summary} | Industry: ${profile.industry}
Color scheme: primary=${plan.colorScheme.primary}, secondary=${plan.colorScheme.secondary}, accent=${plan.colorScheme.accent}
Fonts: heading=${plan.typography.heading}, body=${plan.typography.body}
Components: ${plan.components.join(', ')}
${existingContext}

${PREMIUM_DESIGN_GUIDELINES}

CRITICAL RULES:
- Generate COMPLETE, production-ready code — NO placeholders, NO TODOs
- LIGHT THEME: white/light backgrounds, dark text (#111827). This is MANDATORY.
- All text MUST be clearly visible — dark text on light backgrounds
- If HTML: include Google Fonts via <link>, link to styles.css and script.js, use semantic HTML5 tags
- If CSS: complete styles for ALL components, responsive breakpoints, hover effects
- If JS: mobile menu toggle, smooth scroll, Intersection Observer for fade-in animations
- Hero section MUST have a large visible heading and CTA button
- Every section must have real content, not empty divs

Respond with JSON: {"path": "${filePath}", "purpose": "brief purpose", "code": "full file content"}`;

    return callClaudeJSON<FileSpec>(
        'You are a frontend designer. Generate a clean, modern, LIGHT-THEMED website. White backgrounds, dark text, vibrant accent colors. Every element must be clearly visible. No dark themes.',
        prompt,
        { maxTokens: 16384, temperature: 0.6 }
    );
}

// ===== STEP 3: Generate Full Project =====
export async function generateProject(
    profile: BusinessProfile,
    plan: ArchitecturePlan,
    onProgress?: (file: string, index: number, total: number) => void
): Promise<ProjectFile[]> {
    // Build file list from plan
    const fileList: { path: string; purpose: string }[] = [];

    // Main page
    fileList.push({ path: 'index.html', purpose: 'Main landing/home page with all sections' });

    // Additional pages
    for (const page of plan.pages) {
        if (page !== 'index.html') {
            fileList.push({ path: page, purpose: `${page.replace('.html', '')} page` });
        }
    }

    // CSS
    fileList.push({ path: 'styles.css', purpose: 'Complete stylesheet with design system, components, responsive, animations' });

    // JS
    fileList.push({ path: 'script.js', purpose: 'Interactivity: mobile menu, smooth scroll, animations, form handling' });

    const projectFiles: ProjectFile[] = [];
    const existingFiles: { path: string; summary: string }[] = [];

    // Generate CSS first (design system), then HTML, then JS
    const orderedFiles = [
        ...fileList.filter(f => f.path.endsWith('.css')),
        ...fileList.filter(f => f.path === 'index.html'),
        ...fileList.filter(f => f.path.endsWith('.html') && f.path !== 'index.html'),
        ...fileList.filter(f => f.path.endsWith('.js')),
    ];

    for (let i = 0; i < orderedFiles.length; i++) {
        const file = orderedFiles[i];
        onProgress?.(file.path, i, orderedFiles.length);

        try {
            const generated = await generateFile(profile, plan, file.path, file.purpose, existingFiles);
            const projectFile: ProjectFile = {
                path: generated.path || file.path,
                content: generated.code || '',
                purpose: generated.purpose || file.purpose,
                hash: '',
                version: 1,
            };
            projectFiles.push(projectFile);
            existingFiles.push({ path: projectFile.path, summary: projectFile.purpose });
        } catch (error) {
            console.error(`[CodeGen] Failed to generate ${file.path}:`, (error as Error).message);
            // Generate a placeholder file
            projectFiles.push({
                path: file.path,
                content: file.path.endsWith('.html')
                    ? `<!DOCTYPE html><html><head><title>Error</title></head><body><h1>File generation failed</h1><p>${(error as Error).message}</p></body></html>`
                    : `/* Generation failed: ${(error as Error).message} */`,
                purpose: file.purpose,
                hash: '',
                version: 1,
            });
        }
    }

    return projectFiles;
}
