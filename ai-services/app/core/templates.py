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
# Career-path focused, uses bullets
TRANSCRIPT_TEMPLATES = [
    "Your excellence in **{unit}** indicates a strong foundation for high-level technical roles. Based on your records, your ideal career paths include:\n- Specialized {role} Engineering\n- Technical Systems Architect\n- Industrial R&D Specialist\nOverall, your strong standing suggests a bright professional future. 🎓",
    "Analysis of your performance in **{unit}** reveals a natural aptitude for complex problem solving. You are well-positioned for:\n- Senior {role} Developer\n- Technical Project Manager\n- Innovation Consultant\nYour records show a remarkable technical consistency. 🌟",
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
adj = ["exceptional", "strong", "professional", "unique", "notable", "significant", "impressive", "clear", "robust", "high-tier"]
n = ["technical foundation", "academic record", "specialization", "profile", "trajectory", "readiness", "potential", "grasp", "aptitude", "alignment"]
c = ["matches perfectly with", "aligns with", "is a mirror of", "provides a bridge to", "is a launchpad for", "complements", "supports", "bolsters", "synced with", "tailored for"]
ext = ["the specific needs of this role", "this opportunity", "this high-performance team", "this technical environment", "this placement", "the company's goals", "this professional opening"]
emo = ["🚀", "🎯", "💡", "⚡", "🌟", "🏆", "📈", "✅", "🔥", "💎", "✨", "💪", "🌈", "🧩", "⚙️", "🏅"]

while len(GENERAL_TEMPLATES) < 505:
    t = f"Your {random.choice(adj)} {random.choice(n)} {random.choice(c)} {random.choice(ext)}. {random.choice(emo)}"
    if t not in GENERAL_TEMPLATES: GENERAL_TEMPLATES.append(t)

# Expand TRANSCRIPT_TEMPLATES to 500+ (Career-path focused)
roles = ["Backend", "Software", "Cloud", "Data", "Security", "DevOps", "AI", "Fullstack", "Embedded", "Network"]
praise = ["excellence in", "mastery of", "strong performance in", "notable grasp of", "distinctive talent in"]
outcomes = ["suggests a bright future", "indicates technical readiness", "signals professional maturity", "points to a specialized trajectory"]

while len(TRANSCRIPT_TEMPLATES) < 505:
    r1 = random.choice(roles)
    r2 = random.choice(roles)
    while r2 == r1: r2 = random.choice(roles)
    
    t = (f"Analysis of your {random.choice(praise)} **{{unit}}** reveals a strong alignment with advanced technical fields. "
         f"You are highly competitive for:\n- {r1} Specialist\n- {r2} Engineering Lead\n- Technical Product Consultant\n"
         f"Your academic profile {random.choice(outcomes)}. {random.choice(emo)}")
    if t not in TRANSCRIPT_TEMPLATES: TRANSCRIPT_TEMPLATES.append(t)

# Expand ACADEMIC_MATCH_TEMPLATES to 155+
basis = ["purely based on your academic record in", "derived from your top unit:", "assigned due to your excellence in", "prioritized because of your performance in"]
praise_unit = ["a high-value match", "a logical professional step", "the most compatible placement", "a verified high-potential alignment"]

while len(ACADEMIC_MATCH_TEMPLATES) < 160:
    t = f"Match {random.choice(basis)} **{{unit}}**. Your academic consistency makes this {random.choice(praise_unit)} for you. {random.choice(emo)}"
    if t not in ACADEMIC_MATCH_TEMPLATES: ACADEMIC_MATCH_TEMPLATES.append(t)

class TemplateEngine:
    _gen_idx = 0
    _trans_idx = 0
    _acad_idx = 0
    
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

def get_fallback_reasoning(): return TemplateEngine.get_general()
def get_transcript_reasoning(unit): return TemplateEngine.get_transcript(unit)
def get_academic_only_reasoning(unit): return TemplateEngine.get_academic_match(unit)
