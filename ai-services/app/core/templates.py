import random

# --- RESERVOIR 1: GENERAL MATCHING (500+) ---
# Used for standard matches with preferences
GENERAL_TEMPLATES = [
    "You possess exceptional skill in this domain, making you a top-tier candidate for this attachment. 🚀",
    "Your academic record demonstrates the exact technical foundations required for success here. 🎯",
    "You show strong potential to excel in this specific environment based on your current trajectory. 💡",
    "Your background in your core units aligns perfectly with the technical demands of this role. ⚡",
    "You have shown consistently high performance in areas critical to this specific position. 🌟",
    # ... (Dynamically expanded below)
]

# --- RESERVOIR 2: TRANSCRIPT ANALYSIS (500+) ---
# Advice-focused, help students select preferences. Uses bullets.
TRANSCRIPT_TEMPLATES = [
    "Your mastery in **{unit}** suggests an exceptional aptitude for complex systems. To maximize your potential, you should consider setting your priorities in:\n- Advanced System Architecture\n- Data Infrastructure Engineering\n- Algorithmic Optimization\nFocusing on these areas will align your strongest academic foundations with high-impact career outcomes. 🎓",
    "Performance data for **{unit}** indicates a natural flair for design and user-centric logic. We highly recommend exploring the following interest areas:\n- User Experience (UX) Architecture\n- Interface Design Systems\n- Frontend Engineering Frameworks\nSetting these as your preferences will ensure the matching engine finds roles that resonate with your talent. ✨",
    # ... (Dynamically expanded below)
]

# --- RESERVOIR 3: ACADEMIC-ONLY MATCHING (150+) ---
# For students without preferences
ACADEMIC_MATCH_TEMPLATES = [
    "Match assigned purely based on your top academic performance in **{unit}**. Your excellence in this domain makes this opportunity a high-value fit. 🎓",
    "This placement is a high-confidence match derived from your academic consistency in **{unit}**. No manual preferences were needed to identify this alignment. ⚓",
    "Your verified academic record in **{unit}** acts as the primary driver for this match. You show significant promise for this specific role. 💎",
    # ... (Dynamically expanded below)
]

# --- DYNAMIC EXPANSION LOGIC ---

# Expand GENERAL_TEMPLATES to 500+
adj = [
    "exceptionally deep", "consistent and strong", "highly developed professional", 
    "unique and comprehensive", "notably advanced", "significant and verified", 
    "impressive academic", "clear and focused", "robust technical", "top-tier institutional"
]
n = [
    "technical foundation", "academic record", "field specialization", "professional profile", 
    "career trajectory", "industry readiness", "leadership potential", "conceptual grasp", 
    "technical aptitude", "strategic alignment"
]
c = [
    "matches perfectly with", "aligns seamlessly with", "is a precise mirror of", 
    "provides a robust bridge to", "is a proven launchpad for", "complements at a core level", 
    "supports the long-term goals of", "bolsters the requirements for", "is ideally synced with", 
    "is specifically tailored for"
]
ext = [
    "the specific needs of this role within the organization", 
    "this opportunity and its unique professional challenges", 
    "this high-performance team environment where technical excellence is key", 
    "this complex technical environment that demands precision", 
    "this placement and its associated development goals", 
    "the company's overarching strategic objectives in industry innovation", 
    "this professional opening that requires a dedicated background"
]
emo = ["🚀", "🎯", "💡", "⚡", "🌟", "🏆", "📈", "✅", "🔥", "💎", "✨", "💪", "🏅"]

while len(GENERAL_TEMPLATES) < 505:
    # Use emoji only 60% of the time for more professional variety
    e = random.choice(emo) if random.random() > 0.4 else ""
    t = f"Your {random.choice(adj)} {random.choice(n)} {random.choice(c)} {random.choice(ext)}.{' ' + e if e else ''}"
    if t not in GENERAL_TEMPLATES: GENERAL_TEMPLATES.append(t)

# Expand TRANSCRIPT_TEMPLATES to 500+ (Advice focused)
fields = ["Cloud Security", "Fullstack Engineering", "Machine Learning", "System Architecture", "DevOps Pipeline", "Blockchain Integrity", "Cyber Defense", "Big Data Analytics", "Identity Management", "Embedded Systems"]
praise = ["exceptional mastery in", "distinguished performance in", "notable technical grasp of", "consistently high performance throughout", "proven academic aptitude within"]
foundations = ["establishes a clear technical foundation", "demonstrates a high level of technical maturity", "provides a robust academic background", "highlights a significant technical edge", "indicates a strong readiness for complex implementation"]
advice_verbs = ["focus on", "target", "explore", "prioritize", "specialize in"]
intentisms = ["maximize long-term career growth", "build a unique academic profile", "amplify core technical expertise", "align with emerging industry trends"]
outcomes_trans = [
    "This specialization will yield the highest ROI for your specific academic trajectory.", 
    "Strategically adopting these areas will ensure your profile stands out in a competitive job market.", 
    "Focusing on these sectors allows you to leverage your strongest academic assets for maximum impact.",
    "This proactive approach to your career path ensures that your technical skills are met with the right challenges."
]

while len(TRANSCRIPT_TEMPLATES) < 505:
    f1 = random.choice(fields)
    f2 = random.choice(fields)
    while f2 == f1: f2 = random.choice(fields)
    e = random.choice(emo) if random.random() > 0.5 else ""
    
    t = (f"Your {random.choice(praise)} **{{unit}}** {random.choice(foundations)}. "
         f"We recommend you {random.choice(advice_verbs)} the following specialized areas to {random.choice(intentisms)}:\n"
         f"- {f1} Advanced Design Patterns\n- {f2} Professional Standards\n- Strategic Technical Leadership in {random.choice(fields)}\n"
         f"{random.choice(outcomes_trans)}{' ' + e if e else ''}")
    if t not in TRANSCRIPT_TEMPLATES: TRANSCRIPT_TEMPLATES.append(t)

# --- RESERVOIR 3: ACADEMIC-ONLY MATCHING (200+) ---
# Used for students without preferences (Performance-driven path)
ACADEMIC_MATCH_TEMPLATES = [
    "Your exceptional performance in **{unit}** suggests you will thrive in roles involving similar technical challenges. This area is a primary driver for your current matching profile. 🎯",
    "Given your high aptitude in **{unit}**, this field represents your most compatible academic alignment for long-term career growth. 🚀",
]

basis_phrases = [
    "Your verified mastery of **{unit}**",
    "Your consistent excellence in **{unit}**",
    "The technical proficiency shown in **{unit}**",
    "Your high-tier academic performance in **{unit}**",
    "The depth of knowledge demonstrated in **{unit}**"
]
drivers = [
    "serves as a primary driver for your current matching profile", 
    "indicates you will thrive in roles involving similar technical challenges", 
    "represents your most compatible academic alignment for long-term career growth", 
    "signals a strong aptitude for roles that prioritize technical excellence", 
    "ensures this placement is a natural and high-confidence fit for your skills"
]
guidance = [
    "Since you've opted for a performance-driven path, this match leverages your top academic assets.", 
    "Without manual preferences, our system has prioritized this role based on your proven excellence here.", 
    "This academic-first alignment highlights the roles where your specific successes are most valued.", 
    "By proceeding via academic performance, you are targeting roles that align with your highest grades."
]

while len(ACADEMIC_MATCH_TEMPLATES) < 205:
    e = random.choice(emo) if random.random() > 0.7 else ""
    t = (f"{random.choice(basis_phrases)} {random.choice(drivers)}. "
         f"{random.choice(guidance)}{' ' + e if e else ''}")
    if t not in ACADEMIC_MATCH_TEMPLATES: ACADEMIC_MATCH_TEMPLATES.append(t)



# --- RESERVOIR 4: METADATA-DRIVEN (100+) ---
# Used during AI throttling/fallback
METADATA_MATCH_TEMPLATES = [
    "High-confidence technical alignment based on your academic specialization and institutional performance records.",
]

conf_starts = ["High-confidence", "Proven", "Verified", "Strategic", "Direct", "Established", "Consistent"]
align_adjs = ["technical", "professional", "academic", "field-specific", "skills-based", "career-oriented"]
data_sources = [
    "institutional performance records", 
    "verified academic specialization", 
    "multi-semester trajectory data", 
    "core unit performance metrics", 
    "standardized competency evaluations",
    "advanced course-load analysis",
    "grade-weighted field specialization"
]
intents = [
    "which serves as a primary driver for professional placement", 
    "providing a high-confidence basis for this technical alignment", 
    "ensuring that your core technical strengths are leveraged effectively", 
    "creating a robust bridge between your academic success and industry needs", 
    "highlighting a significant competitive advantage in this specific technical domain"
]
outcomes = [
    "This alignment guarantees that the technical challenges of the role are well-matched to your proven trajectory.", 
    "Your established proficiency in related coursework further bolsters the suitability of this high-value match.", 
    "The synergy between your performance metrics and the role's requirements underscores a strong potential for success.", 
    "By focusing on this data-driven alignment, we ensure a higher ROI for your professional development journey."
]

while len(METADATA_MATCH_TEMPLATES) < 110:
    t = (f"{random.choice(conf_starts)} {random.choice(align_adjs)} alignment based on your {random.choice(data_sources)}, "
         f"{random.choice(intents)}. {random.choice(outcomes)}")
    if t not in METADATA_MATCH_TEMPLATES: METADATA_MATCH_TEMPLATES.append(t)

class TemplateEngine:
    _gen_idx = 0
    _trans_idx = 0
    _acad_idx = 0
    _meta_idx = 0
    
    @classmethod
    def get_general(cls):
        res = GENERAL_TEMPLATES[cls._gen_idx % len(GENERAL_TEMPLATES)]
        cls._gen_idx += 1
        return res

    @classmethod
    def get_transcript(cls, top_unit="Core Units"):
        res = TRANSCRIPT_TEMPLATES[cls._trans_idx % len(TRANSCRIPT_TEMPLATES)]
        cls._trans_idx += 1
        return res.format(unit=top_unit)

    @classmethod
    def get_academic_match(cls, top_unit="Relevant Units"):
        res = ACADEMIC_MATCH_TEMPLATES[cls._acad_idx % len(ACADEMIC_MATCH_TEMPLATES)]
        cls._acad_idx += 1
        return res.format(unit=top_unit)

    @classmethod
    def get_metadata(cls):
        res = METADATA_MATCH_TEMPLATES[cls._meta_idx % len(METADATA_MATCH_TEMPLATES)]
        cls._meta_idx += 1
        return res

def get_fallback_reasoning(): return TemplateEngine.get_general()
def get_transcript_reasoning(unit): return TemplateEngine.get_transcript(unit)
def get_academic_only_reasoning(unit): return TemplateEngine.get_academic_match(unit)
def get_meta_fallback_reasoning(): return TemplateEngine.get_metadata()
