import random

# A collection of 500+ unique, professionally styled match justifications.
# These serve as the high-variety fallback reservoir for AISHA.

TEMPLATES = [
    # 1-50: Achievement & Performance Focused
    "You possess exceptional skill in this domain, making you a top-tier candidate for this attachment. 🚀",
    "Your academic record demonstrates the exact technical foundations required for success here. 🎯",
    "You show strong potential to excel in this specific environment based on your current trajectory. 💡",
    "Your background in your core units aligns perfectly with the technical demands of this role. ⚡",
    "You have shown consistently high performance in areas critical to this specific position. 🌟",
    "Your technical mastery of the required stack is evident from your verified academic records. 🏆",
    "You show a remarkable aptitude for the challenges presented by this professional opportunity. 📈",
    "Your verified skills provide a solid bridge to the responsibilities of this attachment. 🌉",
    "You possess a unique combination of theory and potential that fits this role's profile. 🧬",
    "Your academic journey has prepared you thoroughly for the complexities of this specific role. 🎓",
    "You demonstrate clear technical leadership in the topics most relevant to this company. 👑",
    "Your performance trend suggests you will be a high-impact addition to this technical team. 💥",
    "You show a deep understanding of the core principles required for this specific project. 🧠",
    "Your background represents a high-confidence match for the technical requirements listed. ✅",
    "You possess the exact blend of drive and academic excellence this role demands. 🔥",
    "Your verified transcripts highlight a specialization that is highly valued by this employer. 💎",
    "You show exceptional readiness to tackle the sophisticated tasks in this attachment. 🛠️",
    "Your academic trajectory is a mirror image of the skills this opportunity prioritizes. 🪞",
    "You possess a robust technical foundation that makes you an ideal fit for this team. 🏗️",
    "Your background in specialized units gives you a competitive edge for this specific role. ⚔️",
    "You demonstrate an impressive grasp of the tools and methodologies used at this company. 🧰",
    "Your academic excellence in related units confirms your readiness for this placement. 🏅",
    "You show a significant alignment between your skills and the company's technical goals. 🤝",
    "Your trajectory indicates a high probability of success in this challenging environment. 🔮",
    "You possess the precision and technical depth required for this specialized attachment. 📐",
    "Your verified performance data indicates you are ready for this professional leap. 🦘",
    "You show a natural affinity for the technical challenges this role encompasses. 🌊",
    "Your background provides the perfect launchpad for a successful career in this field. 🛫",
    "You demonstrate the kind of technical rigor that this high-performance team values. 🏎️",
    "Your academic records show you have already mastered the prerequisites for this role. 🗝️",
    "You possess the specialized knowledge necessary to contribute value from day one. 🌅",
    "Your trajectory shows a clear path toward excellence in this specific domain. 🛤️",
    "You show a level of preparedness that sets you apart for this professional opening. 🌈",
    "Your background in core technical units is specifically tailored for this project. 🧵",
    "You possess a strong analytical mindset that aligns with this role's requirements. 🔍",
    "Your academic journey has been strategically focused on the skills needed here. 🗺️",
    "You show an exceptional ability to apply theoretical knowledge to practical tasks. 🧮",
    "Your profile reflects a deep commitment to technical excellence in this field. 🖋️",
    "You possess a versatile skill set that handles the multidisciplinary needs of this role. 🌀",
    "Your background confirms you are a high-caliber candidate for this attachment. 🦅",
    "You show a professional maturity that complements your technical academic strength. 🍷",
    "Your trajectory is perfectly synchronized with the evolving needs of this industry. ⏱️",
    "You possess the technical stamina required for this fast-paced professional role. 🏃",
    "Your verified skills act as a direct gateway to the opportunities in this company. 🚪",
    "You show a significant technical overlap with the team's current primary projects. overlap 🧩",
    "Your academic record is a testament to your readiness for this specific placement. 📜",
    "You possess a foundational depth that will allow you to scale quickly in this role. 🪜",
    "Your background shows a concentrated focus on the technologies used in this role. 🔦",
    "You demonstrate a clear technical vision that aligns with this company's mission. 🔭",
    "Your profile is a high-resolution match for the technical specifications provided. 🖥️",

    # 51-100: Growth & Potential Focused
    "You show a dynamic capacity for growth in the specific technologies used here. 🌱",
    "Your academic foundations provide the perfect soil for a flourishing career here. 🌻",
    "You possess an unshakeable base in the principles that drive this specific role. 🧱",
    "Your background indicates you are a fast-learner ready for this technical challenge. ⚡",
    "You show the kind of intellectual curiosity that leads to innovation in this role. 💡",
    "Your trajectory suggests a rapid ascent within the technical hierarchy of this team. 🧗",
    "You possess the raw talent and academic discipline this attachment requires. 💎",
    "Your profile is a beacon of potential for the specific needs of this company. 🗼",
    "You show a proactive approach to mastering the skills needed for this placement. 🏃‍♂️",
    "Your background reflects a consistent desire to excel in this specific field. 🎯",
    "You demonstrate an evolving skill set that is perfect for this forward-looking role. 🚀",
    "Your academic records are a blueprint for success in this professional environment. 🗺️",
    "You possess the foundational agility needed to pivot into this specialized role. 🤸",
    "Your profile shows a vibrant collection of skills that will grow in this role. 🎨",
    "You show a dedicated focus on the upcoming technologies relevant to this role. 🪐",
    "Your academic journey has been a steady climb toward this professional peak. 🏔️",
    "You possess the spark of technical creativity this innovation-led team seeks. ✨",
    "Your background is a solid foundation for the specialized training offered here. 🏗️",
    "You show the discipline and academic depth needed to master this role quickly. 📚",
    "Your profile is a high-potential match for the long-term goals of this company. 🔭",
    "You possess a resilient technical mindset that handles complex problems with ease. 🛡️",
    "Your trajectory shows you are on the verge of a significant professional breakthrough. 🔓",
    "You show a natural talent for the core responsibilities of this specific role. 🌟",
    "Your background indicates a high level of adaptability for this technical team. 🦎",
    "You demonstrate a refreshing technical perspective that will benefit this project. 🍀",
    "Your academic excellence provides the confidence needed for this first placement. 💪",
    "You possess a well-rounded profile that touches on every requirement for this role. 🎡",
    "Your trajectory shows a clear alignment with the future of this technical field. 🛸",
    "You show the analytical power needed to deconstruct the challenges in this role. 🔋",
    "Your background is a masterclass in the prerequisites for this specific role. 📖",
    "You possess the technical DNA that this company's engineering team values. 🧬",
    "Your profile is a bright signal of readiness for this professional opportunity. 📡",
    "You show a consistent ability to exceed academic expectations in related units. 📈",
    "Your background provides the technical context needed to excel in this team. 🖼️",
    "You demonstrate a strong sense of technical integrity that fits this company. ⚖️",
    "Your academic journey has been a targeted preparation for this specific role. 🏹",
    "You possess the technical focus required to specialize quickly in this field. 🔬",
    "Your profile shows a harmonious blend of academic theory and practical potential. 🎶",
    "You show a persistent drive to understand the 'how' behind technical systems. ⚙️",
    "Your background is a solid bridge between your education and this attachment. 🌉",
    "You possess the technical courage to take on the advanced tasks in this role. 🦁",
    "Your trajectory indicates you are a high-value prospect for this specific team. 💎",
    "You show a focused academic interest that aligns with this role's domain. 🧭",
    "Your background reflects a technical sophistication beyond your current level. 🎩",
    "You demonstrate the kind of logical precision this specific role prioritizes. 🧩",
    "Your academic records are a strong indicator of your future impact here. 🌠",
    "You possess the technical curiosity to explore the deep layers of this role. 🤿",
    "Your profile is a clear endorsement of your readiness for this placement. 🏅",
    "You show an exceptional technical empathy for the problems this company solves. ❤️",
    "Your background provides the technical anchors needed for a stable placement. ⚓",

    # 101-500: Variation Generator Fallback
    # (We will generate 400 more by combining patterns to avoid literal repetition)
]

# Dynamically extend to 500+ with varied combinations
adjectives = ["exceptional", "strong", "professional", "unique", "notable", "significant", "impressive", "clear", "robust", "high-tier"]
nouns = ["technical foundation", "academic record", "specialization", "profile", "trajectory", "readiness", "potential", "grasp", "aptitude", "alignment"]
connectors = ["matches perfectly with", "aligns with", "is a mirror of", "provides a bridge to", "is a launchpad for", "complements", "supports", "bolsters", "synced with", "tailored for"]
extras = ["the specific needs of this role", "this opportunity", "this high-performance team", "this technical environment", "this placement", "the company's goals", "this professional opening"]
e_list = ["🚀", "🎯", "💡", "⚡", "🌟", "🏆", "📈", "✅", "🔥", "💎", "✨", "💪", "🌈", "🧩", "⚙️", "🏅"]

while len(TEMPLATES) < 505:
    adj = random.choice(adjectives)
    n = random.choice(nouns)
    c = random.choice(connectors)
    ext = random.choice(extras)
    emo = random.choice(e_list)
    
    t = f"Your {adj} {n} {c} {ext}. {emo}"
    if t not in TEMPLATES:
        TEMPLATES.append(t)

class TemplateEngine:
    _index = 0
    
    @classmethod
    def get_next(cls):
        template = TEMPLATES[cls._index % len(TEMPLATES)]
        cls._index += 1
        return template

def get_fallback_reasoning():
    return TemplateEngine.get_next()
