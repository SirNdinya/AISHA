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
adj = ["exceptional", "strong", "professional", "unique", "notable", "significant", "impressive", "clear", "robust", "high-tier"]
n = ["technical foundation", "academic record", "specialization", "profile", "trajectory", "readiness", "potential", "grasp", "aptitude", "alignment"]
c = ["matches perfectly with", "aligns with", "is a mirror of", "provides a bridge to", "is a launchpad for", "complements", "supports", "bolsters", "synced with", "tailored for"]
ext = ["the specific needs of this role", "this opportunity", "this high-performance team", "this technical environment", "this placement", "the company's goals", "this professional opening"]
emo = ["🚀", "🎯", "💡", "⚡", "🌟", "🏆", "📈", "✅", "🔥", "💎", "✨", "💪", "🌈", "🧩", "⚙️", "🏅"]

while len(GENERAL_TEMPLATES) < 505:
    t = f"Your {random.choice(adj)} {random.choice(n)} {random.choice(c)} {random.choice(ext)}. {random.choice(emo)}"
    if t not in GENERAL_TEMPLATES: GENERAL_TEMPLATES.append(t)

# Expand TRANSCRIPT_TEMPLATES to 500+ (Advice focused)
fields = ["System Design", "Automation", "Security", "Analytics", "Infrastructure", "UI/UX", "Application Dev", "Cloud Strategy", "Network Operations", "Research"]
praise = ["excellence in", "mastery of", "strong performance in", "notable grasp of", "distinctive talent in"]
advice_verbs = ["focusing on", "targeting", "exploring", "prioritizing", "specializing in"]
intentisms = ["maximize your potential", "leverage your strengths", "amplify your academic foundation", "align your talent with industry needs"]

while len(TRANSCRIPT_TEMPLATES) < 505:
    f1 = random.choice(fields)
    f2 = random.choice(fields)
    while f2 == f1: f2 = random.choice(fields)
    
    t = (f"Your {random.choice(praise)} **{{unit}}** demonstrates a high level of technical maturity. "
         f"We suggest {random.choice(advice_verbs)} the following interest areas to {random.choice(intentisms)}:\n"
         f"- {f1} Architectural Patterns\n- {f2} Governance and Strategy\n- Technical Leadership in {random.choice(fields)}\n"
         f"Updating your preferences to include these will result in much more accurate placements. {random.choice(emo)}")
    if t not in TRANSCRIPT_TEMPLATES: TRANSCRIPT_TEMPLATES.append(t)

# --- RESERVOIR 3: ACADEMIC-ONLY MATCHING (150+) ---
# Used for students without preferences. Emphasizes advice.
ACADEMIC_MATCH_TEMPLATES = [
    "This match is prioritized based on your exceptional performance in **{unit}**, which suggests you would thrive in roles involving similar technical challenges. We recommend setting this area as a carrer preference. 🎯",
    "Given your high aptitude in **{unit}**, we've identified this placement as your most compatible academic alignment. This serves as advice to consider this field for your long-term preferences. 🚀",
]

# Expand ACADEMIC_MATCH_TEMPLATES to 155+
basis = ["prioritized based on your mastery of", "derived from expertise in", "aligned with your performance in", "selected to leverage your strength in"]
advice_snippets = ["consider this a strong indicator for your preferences", "this field is a logical step for your profile", "we suggest updating your interests to reflect this", "your records point towards excellence here"]

while len(ACADEMIC_MATCH_TEMPLATES) < 160:
    t = f"This placement is {random.choice(basis)} **{{unit}}**. {random.choice(advice_snippets)}. {random.choice(emo)}"
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
