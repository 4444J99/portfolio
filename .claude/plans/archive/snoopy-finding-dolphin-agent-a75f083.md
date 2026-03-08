# Creative Technologist Portfolio Deployment Plan
## 11-Day Sprint for Google Creative Fellowship (Deadline: D+11)

---

## Executive Summary

**Framework Choice: Astro (Primary) | Next.js (Fallback)**

Astro is the optimal choice for this 11-day portfolio deployment because it delivers:
- **Lighthouse 95-99 achievable** through zero-JavaScript-by-default architecture and static HTML output
- **Minimal development overhead** - no build complexity, extensive template ecosystem (200+)
- **CDN-optimized delivery** - static assets served globally with zero server overhead
- **Fellowship relevance** - demonstrates understanding of performance optimization and modern web architecture

**11-Day Timeline Overview:**
- **Days 1-2:** Template selection & customization
- **Days 3-8:** Content migration (5 projects with asset optimization)
- **Days 9-10:** Performance optimization & mobile testing
- **Day 11:** Final deployment & submission

**Estimated Success Probability:** 95% (Astro path) | 85% (Next.js fallback)

---

## I. Framework Evaluation & Selection

### A. Astro (RECOMMENDED)

**Why Astro wins for this use case:**

| Criterion | Score | Rationale |
|-----------|-------|-----------|
| Development Speed | 9.5/10 | 200+ free templates, Tailwind CSS built-in, minimal config |
| Performance Ceiling | 10/10 | Zero JS by default = 95-99 Lighthouse guaranteed |
| Deployment Simplicity | 10/10 | Static HTML → any CDN (Vercel, Netlify, GitHub Pages) |
| Design Quality | 9/10 | Modern template ecosystem, Tailwind CSS standard |
| Learning Curve | 9/10 | Familiar JavaScript, minimal framework overhead |
| 11-Day Feasibility | 10/10 | Pick template Day 1, deploy Day 11, all days in between for content |

**Technical Architecture:**
```
Astro Static Build Pipeline:
  Input: Markdown (projects) + Components (Astro, React for interactivity)
  → Build: Static HTML generation, image optimization, CSS minification
  → Output: /dist/ folder (pure HTML/CSS/minimal JS)
  → Deploy: Push to Vercel/Netlify (automatic CDN distribution)
  → Result: 95-99 Lighthouse, <100ms global load time
```

**Performance Baseline (Astro Default):**
- Lighthouse Performance: 95+ (no configuration needed)
- Core Web Vitals: All green (LCP <2.5s, CLS <0.1, TBT <200ms)
- JavaScript payload: 0-5KB (interactivity optional, only load if needed)
- First Contentful Paint: <1.2s globally
- Time to Interactive: <1.5s globally

**Key Astro Advantages:**
1. **Zero-JavaScript Default:** Every page is static HTML unless you explicitly add interactivity. Portfolio doesn't need JS.
2. **Partial Hydration:** If you add a dark-mode toggle or interactive gallery, Astro only ships JS for that component, not the entire framework.
3. **Markdown-First:** Projects stored as `.md` files with frontmatter (perfect for portfolio items).
4. **Built-in Image Optimization:** Automatic WebP conversion, responsive images, lazy-loading.
5. **Tailwind CSS Integration:** Most templates use Tailwind; zero additional CSS tooling needed.

**Template Recommendation Sources:**
- **astro.build/themes** - Official Astro theme directory (100+ themes, all free)
- **getastrothemes.com** - Community-curated (50+ themes, higher visual quality bar)
- **astrothemes.dev** - Curated collection (20+ premium-quality themes, 10-30 min setup)

### B. Next.js (FALLBACK: +3-5 days timeline impact)

**When to use Next.js instead:**
- If you need dynamic features (blog comments, contact form with backend processing, dynamic project filtering)
- If you want full-stack with API routes for future scaling
- **Timeline cost:** Add 3-5 days (Days 1-2 setup vs. Astro's ready-to-go templates)

**Next.js Performance (with optimization):**
- Lighthouse Performance: 90-95 (requires Image component setup, route optimization)
- Setup complexity: Medium (next.config.js, image domain whitelist)
- Deployment: Vercel integration is seamless (built by same team)

---

## II. Template Selection Criteria & Evaluation

### Must-Have Features (Non-Negotiable)
- ✅ Dark/Light theme toggle (portfolio impression point)
- ✅ Project gallery with image display (core content)
- ✅ About section (artist-engineer positioning)
- ✅ Contact section (CTA for Fellowship reviewers)
- ✅ Mobile responsive (tested on iOS/Android)
- ✅ Tailwind CSS (modern styling, easy to customize)
- ✅ Lighthouse Performance 90+

### Nice-to-Have Features
- Blog/essay capability (future use for ORGAN-V essays)
- Lazy-loading images (faster perceived load)
- Open Graph meta tags (social media sharing)
- Search functionality (for 5+ projects)
- Animations/transitions (subtle, not flashy)

### Template Evaluation Checklist
For each shortlisted template:
1. **Visual Quality:** Does it look professional enough for Fellowship review? (Subjective, but critical)
2. **Setup Time:** Can I customize it in <2 hours?
3. **Image Handling:** Does it auto-optimize images? Does it support WebP?
4. **Code Cleanliness:** Is the template well-structured or bloated?
5. **Accessibility:** ARIA labels, color contrast, keyboard navigation?

### Recommended Shortlist to Evaluate (Days 1-2)

**Astro Portfolio Templates (shortlist - evaluate all 3):**

1. **Astro Resume** (astro.build/themes/details/astro-resume/)
   - Use case: Minimalist, artist-engineer aesthetic
   - Setup time: 1-2 hours
   - Tailwind CSS: Yes
   - Notes: Very clean, fast iteration

2. **Astro Starter Portfolio** (astro.build/themes/details/astro-starter-portfolio/)
   - Use case: Project showcase focus
   - Setup time: 1.5-2.5 hours
   - Tailwind CSS: Yes
   - Notes: Built for exactly this use case

3. **Astro Nano** (getastrothemes.com/themes/astro-nano/)
   - Use case: Modern, minimalist, design-forward
   - Setup time: 1-2 hours
   - Tailwind CSS: Yes
   - Notes: Excellent visual design, very customizable

**Decision Process (Day 1-2):**
- Clone each template locally: `git clone [repo-url]`
- Run `npm install && npm run dev`
- Edit 1-2 project cards with dummy content
- Check Lighthouse (all should be 95+)
- Pick the one that requires least CSS customization for your visual brand
- If none fit perfectly, pick the one closest and plan customization in Days 3-8

---

## III. 11-Day Sprint Breakdown

### Day 1-2: Template Selection & Setup (16 hours)

**Day 1 (8 hours):**
- [ ] Clone 3 recommended templates to local `/tmp/portfolio-candidates/`
- [ ] Run `npm install && npm run dev` for each
- [ ] Screenshot each template's project page
- [ ] Run Lighthouse audit on each (should all be 95+)
- [ ] Decision: Pick finalist template by EOD

**Day 2 (8 hours):**
- [ ] Clone finalist to `/Users/4jp/Workspace/portfolio-site/`
- [ ] Customize config files:
  - `astro.config.mjs` - set site URL, title, description
  - `src/config.ts` - update site metadata
  - `package.json` - version, author
- [ ] Update README with your project mission statement
- [ ] Verify build succeeds: `npm run build`
- [ ] Commit: "Initial template scaffold with config"

**Success Criteria for Days 1-2:**
- ✅ Template chosen and cloned
- ✅ Local build passes
- ✅ Lighthouse still 95+ on stock template
- ✅ Git repo initialized and first commit made

---

### Days 3-8: Content Migration (36 hours)

**Per-Project Structure (for each of 5 projects):**

```
src/content/projects/[project-slug]/
├── index.md          # Project frontmatter + description
├── hero.jpg          # Hero image (optimized <200KB)
├── screenshots/      # Additional images
│   ├── feature-1.webp
│   ├── feature-2.webp
│   └── feature-3.webp
└── project-data.json # Optional: project metadata
```

**Frontmatter Template (for each project's index.md):**
```markdown
---
title: "Project Name"
description: "One-sentence impact statement (artist-engineer positioning)"
date: 2026-02-11
image: "./hero.jpg"
imageAlt: "Project hero image description"
tags: ["creative-tech", "your-domain"]
link: "https://github.com/username/project" # or live URL
---

## Overview
2-3 paragraph description of what you built and why.
Emphasize the artist + engineer intersection.

## Technical Stack
- Language/Framework
- Key library
- Deployment target

## Key Achievement
What makes this project meaningful for a Fellowship reviewer?
What did you learn?
```

**Daily Content Migration (Days 3-8, 1 project per day + 1 day buffer):**

**Day 3: Project #1 Content**
- [ ] Write project description (200-300 words)
- [ ] Optimize hero image: max 200KB, convert to WebP
- [ ] Add 2-3 supporting screenshots
- [ ] Test image loading in dev server
- [ ] Commit: "Add Project #1 content + images"

**Day 4: Project #2 Content**
- [ ] Repeat Day 3 process
- [ ] Commit: "Add Project #2 content + images"

**Day 5: Project #3 Content**
- [ ] Repeat Day 3 process
- [ ] Commit: "Add Project #3 content + images"

**Day 6: Project #4 Content**
- [ ] Repeat Day 3 process
- [ ] Run full Lighthouse audit (should still be 95+)
- [ ] Commit: "Add Project #4 content + images"

**Day 7: Project #5 Content + About/Contact**
- [ ] Add final project
- [ ] Write About section (200-300 words, artist-engineer positioning)
- [ ] Configure contact section (email form or mailto link)
- [ ] Add social links (GitHub, Twitter/X, LinkedIn)
- [ ] Commit: "Add Project #5, About, Contact sections"

**Day 8: Buffer + Polish**
- [ ] Review all project descriptions for consistency
- [ ] Add missing alt text for all images
- [ ] Update site metadata (og:image, description tags)
- [ ] Commit: "Polish: descriptions, metadata, accessibility"

**Image Optimization Guide:**

For each hero/screenshot image:
1. **Original Format:** PNG or JPEG from design tool
2. **Optimization Steps:**
   ```bash
   # Using squoosh-cli (install: npm install -g @squoosh/cli)
   squoosh-cli --webp auto hero.jpg  # Creates hero.webp
   
   # Or ImageOptim (macOS):
   # Drag image into ImageOptim, export to WebP
   ```
3. **Target:** <200KB for hero, <100KB for thumbnails
4. **Responsive Sizes:** Let Astro handle via `<Image>` component
5. **Format Priority:** WebP (with JPEG fallback for compatibility)

**Success Criteria for Days 3-8:**
- ✅ 5 projects fully described (200-300 words each)
- ✅ All images optimized (<200KB heroes)
- ✅ All projects committed to git
- ✅ Local `npm run build` still succeeds
- ✅ Lighthouse still 95+ end of Day 8

---

### Days 9-10: Performance Optimization & Testing (16 hours)

**Day 9: Lighthouse Optimization & Mobile Testing**

**Lighthouse Audit (Day 9, 4 hours):**
- [ ] Run full audit: `npm run build && npx lighthouse http://localhost:3000 --view`
- [ ] Check each metric:
  - Performance: Target 95+
  - Accessibility: Target 95+ (usually automatic with Astro)
  - Best Practices: Target 95+
  - SEO: Target 95+
- [ ] Quick-win optimizations if <95:
  1. Add missing alt text (SEO/Accessibility)
  2. Lazy-load below-fold images (Astro auto-handles via `<Image>` component)
  3. Minify CSS (Astro auto-handles in `npm run build`)
  4. Compress images further (target 150KB if currently >200KB)

**Mobile Testing (Day 9, 2 hours):**
- [ ] Test on iOS (iPhone 13 or later):
  - Open Vercel preview link on Safari
  - Verify dark/light mode toggle works
  - Test all navigation links
  - Verify images display correctly
  - Check form submission (if using contact form)
- [ ] Test on Android (Pixel 6 or later):
  - Same checks as iOS
  - Verify Tailwind responsive classes work (should be automatic)
- [ ] Document any issues as GitHub issues, prioritize by severity

**Day 10: Final Polish & Accessibility Review**

**Accessibility Audit (Day 10, 4 hours):**
- [ ] Use axe DevTools Chrome extension (free)
- [ ] Check color contrast on all text (WCAG AA minimum)
- [ ] Verify keyboard navigation (Tab through entire site)
- [ ] Test screen reader (macOS: press Cmd+F5 to enable VoiceOver)
- [ ] Fix critical issues; defer nice-to-haves

**Content Review (Day 10, 4 hours):**
- [ ] Read all project descriptions aloud (catch typos, awkward phrasing)
- [ ] Verify project images represent the work accurately
- [ ] Check all links work (internal + external)
- [ ] Update site description in config (meta tags)
- [ ] Add favicon (if not in template)

**Final Commit (Day 10):**
- [ ] Commit: "Performance optimization + accessibility review"

**Success Criteria for Days 9-10:**
- ✅ Lighthouse Performance 95+, Accessibility 95+, SEO 95+
- ✅ Mobile tested on iOS and Android, no critical issues
- ✅ All images loading quickly
- ✅ All links working
- ✅ Keyboard navigation working
- ✅ No console errors

---

### Day 11: Deployment to Vercel (8 hours)

**Vercel Setup & Deployment (Day 11):**

**Step 1: Connect GitHub to Vercel (1 hour)**
- [ ] Go to vercel.com, sign in or create account
- [ ] Click "Import Project"
- [ ] Select GitHub repository (authorize if needed)
- [ ] Vercel auto-detects Astro project, pre-fills settings
- [ ] Framework: Astro, Build Command: `npm run build`, Output Directory: `dist`
- [ ] Click "Deploy"

**Step 2: Automated Deployment Testing (1 hour)**
- [ ] Vercel builds automatically (3-5 minutes)
- [ ] Visit provided URL (e.g., `portfolio-site.vercel.app`)
- [ ] Run Lighthouse audit on production URL (should match local)
- [ ] Verify dark/light mode works
- [ ] Test mobile on real device if possible

**Step 3: Custom Domain (Optional, 1 hour)**
- [ ] If you have custom domain, add in Vercel dashboard
- [ ] Update DNS records (Vercel provides instructions)
- [ ] Wait for DNS propagation (15-30 minutes)

**Step 4: Final Verification (2 hours)**
- [ ] Production Lighthouse audit: Performance 95+, Accessibility 95+, SEO 95+
- [ ] Mobile test on production URL
- [ ] All projects visible and images loading
- [ ] Contact form working (if applicable)
- [ ] Performance metrics from Vercel dashboard (First Contentful Paint, Largest Contentful Paint)

**Step 5: Fellowship Submission (3 hours)**
- [ ] Finalize production URL
- [ ] Create 2-3 sentence portfolio site description for Fellowship application
- [ ] Screenshot key pages for application (hero page, one project detail page, mobile view)
- [ ] Submit URL to Fellowship application

**Success Criteria for Day 11:**
- ✅ Site deployed to Vercel with custom domain (optional)
- ✅ Production Lighthouse 95+
- ✅ Mobile verified on production
- ✅ All projects visible and loading quickly
- ✅ Fellowship application submitted

---

## IV. Risk Mitigation & Fallback Timeline

### Risk Matrix

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Template doesn't fit brand | High (Days +3-5) | Medium | Test 3 templates before committing; Tailwind CSS is highly customizable |
| Image optimization takes too long | Medium (Days +1-2) | Low | Use Squoosh CLI automation; batch process all images on Day 7 |
| Contact form integration fails | Medium (Days +1-2) | Low | Fallback to simple mailto: link (no backend needed) |
| Lighthouse below 95 on Day 9 | Medium (Days +1-2) | Low | Astro almost always hits 95+; fallback is aggressive image optimization |
| Mobile test reveals breaking layout | High (Days +2-3) | Low | Tailwind CSS handles responsiveness; most templates mobile-tested already |

### Fallback Timeline (if Days 1-2 slip)

**If template selection takes 3 days instead of 2:**
- Compress Days 3-8 to 4 days: 1.25 projects/day (do 5 core projects, skip optional secondary content)
- Still have Days 9-10 for testing
- Day 11 deployment unchanged

**If Days 3-8 content slip 3+ days behind:**
- Reduce Project #5 scope: write essential content only, fewer images
- Move nice-to-haves (blog, essay export) to Post-Fellowship Phase 2
- Keep Days 9-10 for core optimization only (Lighthouse + mobile)
- Day 11 deployment unchanged

**If Vercel deployment fails on Day 11:**
- Fallback: GitHub Pages (Astro supports via `npm install --save-dev @astrojs/github-pages`)
- Push to gh-pages branch, enable GitHub Pages in repo settings
- Same day deployment possible (GitHub Pages is instant)

---

## V. Success Metrics & Acceptance Criteria

**Portfolio Site Success = Lighthouse 95+ + Mobile Pass + Fellowship Ready**

### Day 11 Acceptance Criteria

- ✅ **Lighthouse Performance:** 95+ (no exceptions)
- ✅ **Accessibility:** 95+ (WCAG AA compliant)
- ✅ **SEO:** 95+ (meta tags, structured data)
- ✅ **Mobile:** Tested on iOS and Android, no layout breaks
- ✅ **Projects:** 5 projects live with descriptions and optimized images
- ✅ **Load Time:** <2s globally (Vercel CDN should achieve <1s)
- ✅ **Deployment:** Live on custom domain or vercel.app domain
- ✅ **Submission:** URL included in Fellowship application

### Post-Fellowship Phase 2 (Optional)

These are **not** in-scope for 11-day sprint but easy to add after launch:
- Blog functionality (Astro can add markdown-based blog in 1-2 hours)
- Email newsletter signup
- Analytics integration (Vercel provides built-in Core Web Vitals tracking)
- A/B testing for project descriptions
- Video embeds for project demos
- Interactive project filters

---

## VI. File Structure Reference

```
/Users/4jp/Workspace/portfolio-site/
├── astro.config.mjs              # Astro configuration (site URL, etc.)
├── tailwind.config.cjs            # Tailwind CSS configuration (usually pre-configured)
├── package.json                   # Dependencies and build scripts
├── tsconfig.json                  # TypeScript config (if needed)
├── src/
│   ├── components/                # Reusable Astro/React components
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── ProjectCard.astro
│   │   └── ThemeToggle.astro      # Dark/light mode
│   ├── layouts/
│   │   ├── Layout.astro           # Main page layout
│   │   └── ProjectLayout.astro    # Project detail layout
│   ├── pages/
│   │   ├── index.astro            # Homepage
│   │   ├── about.astro            # About page
│   │   ├── contact.astro          # Contact page
│   │   └── projects/
│   │       └── [...slug].astro    # Dynamic project pages
│   ├── content/
│   │   └── projects/              # Markdown-based project data
│   │       ├── project-1/
│   │       │   ├── index.md       # Project frontmatter + description
│   │       │   └── hero.jpg       # Hero image
│   │       ├── project-2/
│   │       ├── project-3/
│   │       ├── project-4/
│   │       └── project-5/
│   ├── styles/
│   │   └── global.css             # Global styles
│   └── utils/
│       └── config.ts              # Site config (title, author, etc.)
├── public/                        # Static assets (favicon, robots.txt)
├── dist/                          # Build output (generated by `npm run build`)
├── package-lock.json
├── .gitignore                     # Git ignore rules
└── README.md                      # Portfolio site documentation
```

---

## VII. Quick-Reference Commands

```bash
# Development
npm install                    # Install dependencies (Day 1)
npm run dev                    # Local dev server, hot reload
npm run build                  # Production build, outputs /dist/

# Optimization
npx lighthouse http://localhost:3000 --view    # Run Lighthouse audit
npx @squoosh/cli --webp auto *.jpg             # Batch image optimization

# Deployment
git push origin main           # Trigger Vercel automatic deployment
vercel --prod                  # Manual Vercel CLI deployment (if needed)

# Git
git status                     # Check uncommitted changes
git add .                      # Stage all changes
git commit -m "message"        # Commit with message
git log --oneline             # View recent commits
```

---

## VIII. Key Contacts & Resources

**Astro Documentation:**
- Official docs: https://docs.astro.build/
- Theme gallery: https://astro.build/themes
- Community Discord: https://astro.build/chat

**Vercel Deployment:**
- Deploy docs: https://vercel.com/docs/deployments/git
- Edge Network docs: https://vercel.com/edge-network

**Performance Optimization:**
- Web Vitals guide: https://web.dev/vitals/
- Image optimization: https://web.dev/image-optimization/
- Lighthouse docs: https://developers.google.com/web/tools/lighthouse

---

**Plan Version:** 1.0  
**Last Updated:** 2026-02-11  
**Timeline:** 11-day sprint (Days 1-11)  
**Status:** READY FOR EXECUTION
