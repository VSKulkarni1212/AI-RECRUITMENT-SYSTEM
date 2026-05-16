import re
from .embedding_engine import get_edu_score

COMMON_SKILLS = [
    "Python", "JavaScript", "React", "Node.js", "TypeScript", "SQL", "Java", 
    "C++", "C#", "Ruby", "PHP", "Swift", "Kotlin", "Go", "Rust", "HTML", "CSS",
    "Angular", "Vue", "Next.js", "Django", "Flask", "Spring", "Express",
    "TensorFlow", "PyTorch", "Keras", "Scikit-Learn", "Pandas", "NumPy",
    "PostgreSQL", "MongoDB", "MySQL", "Redis", "Elasticsearch", "Cassandra",
    "Docker", "AWS", "Kubernetes", "Azure", "GCP", "Linux", "Git", "CI/CD",
    "Machine Learning", "Deep Learning", "Artificial Intelligence", "NLP",
    "Data Analysis", "Data Science", "Data Engineering", "Big Data",
    "Finance", "Accounting", "Marketing", "Sales", "Project Management", "Leadership",
    "Business Analysis", "Risk Management", "Operations", "Strategy", "Agile", "Scrum",
    "Excel", "Tableau", "Power BI", "Communication", "Problem Solving", "Management",
    "Healthcare", "Clinical", "Patient Care", "Nursing", "Diagnosis", "Surgery",
    "Figma", "Design Systems", "UI/UX", "Photoshop", "Illustrator"
]

def analyze_resume(text: str):
    """
    Extracts key features from resume text:
    - Years of experience
    - Education score
    - Skills found
    """
    if not text:
        return {
            "years_exp": 0,
            "edu_score": 0,
            "skills": []
        }
    
    # 1. Extract Years of Experience
    # Matches: "5 years", "10+ yrs", "8 Year", "5+ years of experience"
    years_patterns = [
        r'(\d+)\+?\s*(?:YEARS?|YRS?)\s*(?:OF\s*)?(?:EXPERIENCE|EXP)?',
        r'(?:EXPERIENCE|TOTAL\s*EXPERIENCE|EXP)\s*[:\-]?\s*(\d+)\+?\s*(?:YEARS?|YRS?)',
        r'(?i)(one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)'
    ]
    
    word_to_num = {'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5, 
                   'SIX': 6, 'SEVEN': 7, 'EIGHT': 8, 'NINE': 9, 'TEN': 10}
    
    all_years = []
    for pattern in years_patterns:
        matches = re.findall(pattern, text.upper())
        for match in matches:
            if isinstance(match, str):
                if match in word_to_num:
                    all_years.append(word_to_num[match])
                elif match.isdigit():
                    all_years.append(int(match))
            elif isinstance(match, tuple):
                # If regex has multiple groups, take the first non-empty one
                val = next((m for m in match if m), '')
                if val in word_to_num:
                    all_years.append(word_to_num[val])
                elif val.isdigit():
                    all_years.append(int(val))
                    
    # Also look for date ranges like 2018 - 2022 or 2020 - Present
    import datetime
    current_year = datetime.datetime.now().year
    range_patterns = [
        r'(20\d{2})\s*(?:-|to|–|—)\s*(20\d{2}|PRESENT|CURRENT|NOW)'
    ]
    for pattern in range_patterns:
        matches = re.findall(pattern, text.upper())
        total_range_years = 0
        for start, end in matches:
            start_yr = int(start)
            if end in ['PRESENT', 'CURRENT', 'NOW']:
                end_yr = current_year
            else:
                end_yr = int(end)
            if end_yr >= start_yr:
                total_range_years += (end_yr - start_yr)
        if total_range_years > 0:
            all_years.append(total_range_years)
        
    # Filter out unrealistic years of experience (e.g., matching a year like 2022)
    valid_years = [y for y in all_years if 0 < y < 60]
    years_exp = max(valid_years) if valid_years else 0
    
    # 2. Education Score
    edu_score = get_edu_score(text)
    
    # 3. Skills Extraction
    found_skills = []
    text_upper = text.upper()
    for skill in COMMON_SKILLS:
        pattern = r'(?<![A-Z0-9_])' + re.escape(skill.upper()) + r'(?![A-Z0-9_])'
        if re.search(pattern, text_upper):
            found_skills.append(skill)
            
    return {
        "years_exp": years_exp,
        "edu_score": edu_score,
        "skills": found_skills[:10] # Top 10 skills
    }
