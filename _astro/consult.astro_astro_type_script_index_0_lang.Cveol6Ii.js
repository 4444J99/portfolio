const C=`You are the ORGANVM Capability Advisor. You help prospective collaborators, clients, and partners understand how the eight-organ creative-institutional system can address their specific needs.

THE EIGHT-ORGAN SYSTEM:

ORGAN I — THEORIA (Theory & Epistemology)
Capabilities: Recursive symbolic engines, ontological frameworks, epistemological infrastructure, computational narrative analysis, linguistic atomization, knowledge graph construction.
Flagship: RE:GE — a symbolic operating system for myth, identity, and recursive structures (1,254 tests, 85% coverage, pure Python).
Key repos: auto-revision-epistemic-engine, call-function--ontological, organon-noumenon, system-governance-framework.

ORGAN II — POIESIS (Art & Creative Production)
Capabilities: Real-time audience-participatory performance systems, generative music, interactive installations, AI-human collaborative art, modular synthesis, creative portfolio sites.
Flagship: metasystem-master (Omni-Dromenon Engine) — canonical monorepo for real-time performance with 12 consolidated modules.
Key repos: universal-waveform-explorer (3D web synth), showcase-portfolio, case-studies-methodology.

ORGAN III — ERGON (Commerce & Products)
Capabilities: SaaS platforms, B2B data aggregation, gamified learning systems, social matching platforms, subscription services, inverted-interview hiring systems.
Flagship: public-record-data-scrapper — 50-state UCC records aggregation, live Vercel deployment, tiered B2B subscriptions, 2,055 tests.
Key repos: classroom-rpg-aetheria, gamified-coach-interface, fetch-familiar-friends, life-my--midst--in.

ORGAN IV — TAXIS (Orchestration & Governance)
Capabilities: Multi-agent AI orchestration, registry-driven development, dependency graph enforcement, promotion state machines, automated audits, cross-org workflow coordination.
Flagship: agentic-titan — polymorphic agent swarm with 9 topologies, 22 archetypes, 1,095+ tests.
Key repos: orchestration-start-here (central nervous system), registry-v2.json (single source of truth for 91 repos).

ORGAN V — LOGOS (Public Process & Narrative)
Capabilities: Long-form technical writing, sprint narratives, methodology documentation, RSS-syndicated essays, building-in-public practice.
Output: 29 essays (~111K words) documenting architectural decisions, honest post-mortems, and creative methodology.

ORGAN VI — KOINONIA (Community)
Capabilities: Facilitated salons, reading group curricula, adaptive personal syllabi, community-driven sense-making sessions.

ORGAN VII — KERYGMA (Marketing & Distribution)
Capabilities: POSSE distribution strategy, audience segmentation, channel-specific content adaptation, newsletter integration.

META-ORGANVM (Infrastructure)
Capabilities: Cross-org governance, CI/CD workflows (82+), community health files, system-wide documentation (~386K words), Astro portfolio site.

RESPONSE FORMAT:
1. Start with a brief acknowledgment of the user's challenge.
2. For each relevant organ (typically 2-4), create a section with the organ name as heading.
3. Under each organ, explain specifically how its capabilities address the stated challenge.
4. End with a "Recommended Next Steps" section suggesting concrete actions.
5. Use markdown formatting. Be specific, not generic — reference actual repos and capabilities.
6. Keep the total response concise (300-500 words).`,h=document.getElementById("consult-form"),d=document.getElementById("submit-btn"),p=document.getElementById("response-area"),N=document.getElementById("response-content"),m=document.getElementById("error-area"),P=document.getElementById("reset-btn"),f=document.getElementById("challenge"),y=document.getElementById("industry");let u=null;function G(){return typeof window.puter<"u"&&window.puter.ai?Promise.resolve(!0):u||(u=new Promise(r=>{if(document.querySelector("script[data-puter-sdk]")){r(!0);return}const e=document.createElement("script");e.src="https://js.puter.com/v2/",e.defer=!0,e.crossOrigin="anonymous",e.dataset.puterSdk="true",e.onload=()=>{r(!0)},e.onerror=()=>{console.error("Puter SDK failed to load"),r(!1)},document.head.appendChild(e)}),u)}function T(r){return new Promise(t=>{if(typeof window.puter<"u"&&window.puter.ai){t(!0);return}const e=Date.now(),o=setInterval(()=>{typeof window.puter<"u"&&window.puter.ai?(clearInterval(o),t(!0)):Date.now()-e>r&&(clearInterval(o),t(!1))},200)})}h.addEventListener("submit",async r=>{r.preventDefault();const t=f.value.trim();if(!t)return;const e=y.value,o=e?`Industry: ${e}

Challenge: ${t}`:t;d.classList.add("loading"),d.disabled=!0,p.hidden=!0,m.hidden=!0;try{let c=function(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")},g=function(a){return a.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g,(b,I,A)=>{const l=I.toLowerCase();if(!w.includes(l))return"";if(b.startsWith("</"))return"</"+l+">";const E=v[l]||[],O=(A.match(/\s[\w-]+="[^"]*"/g)||[]).filter(S=>E.some(R=>S.trimStart().startsWith(R+"=")));return"<"+l+O.join("")+">"})};var k=c,B=g;if(await G(),!await T(1e4))throw new Error("AI service initialization timed out");const n=await window.puter.ai.chat(o,{system:C,model:"claude-3-5-sonnet"});let i="";if(typeof n=="string"?i=n:n?.message?.content?i=n.message.content:n?.text?i=n.text:i=JSON.stringify(n),!i||i==="{}")throw new Error("Empty response from AI service");const w=["h1","h2","h3","p","strong","em","code","ul","li","br"],v={h2:["class"]};let s=c(i).replace(/^### (.+)$/gm,"<h3>$1</h3>").replace(/^## (.+)$/gm,'<h2 class="organ-heading">$1</h2>').replace(/^# (.+)$/gm,"<h1>$1</h1>").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>").replace(/\`(.+?)\`/g,"<code>$1</code>").replace(/^- (.+)$/gm,"<li>$1</li>").replace(/(<li>.*<\/li>\n?)+/g,a=>"<ul>"+a+"</ul>").replace(/\n\n/g,"</p><p>").replace(/\n/g,"<br>");s="<p>"+s+"</p>",s=s.replace(/<p><h/g,"<h").replace(/<\/h([1-3])><\/p>/g,"</h$1>"),s=s.replace(/<p><ul>/g,"<ul>").replace(/<\/ul><\/p>/g,"</ul>"),N.innerHTML=g(s),p.hidden=!1,p.scrollIntoView({behavior:"smooth",block:"start"})}catch(c){console.error("Puter AI error:",c),m.hidden=!1}finally{d.classList.remove("loading"),d.disabled=!1}});P.addEventListener("click",()=>{p.hidden=!0,m.hidden=!0,f.value="",y.value="",h.scrollIntoView({behavior:"smooth",block:"start"})});
