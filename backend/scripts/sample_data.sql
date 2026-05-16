-- SAMPLE JOBS (Ensure job_index matches your local dataset range if testing search)
INSERT INTO jobs (job_index, job_title, company, location, description, skills)
VALUES 
(0, 'Software Engineer', 'Tech Innovators', 'Remote', 'Develop high-quality software solutions using Python and React.', ARRAY['Python', 'React', 'FastAPI']),
(1, 'Data Scientist', 'Insight AI', 'New York', 'Apply machine learning models to solve complex business problems.', ARRAY['Python', 'Scikit-Learn', 'TensorFlow']),
(2, 'DevOps Engineer', 'Cloud Systems', 'Austin', 'Manage cloud infrastructure and CI/CD pipelines.', ARRAY['Docker', 'Kubernetes', 'AWS'])
ON CONFLICT (job_index) DO NOTHING;

-- SAMPLE RECRUITERS
INSERT INTO recruiters (full_name, company_name, email)
VALUES 
('Jane Doe', 'Tech Innovators', 'jane@techinnovators.com'),
('Mark Sloan', 'Insight AI', 'mark@insightai.com')
ON CONFLICT (email) DO NOTHING;

-- SAMPLE CANDIDATES
-- Note: These will have user_id as NULL. 
-- They will be visible to the Backend (Service Role) but hidden from the Frontend (Anon Key) due to RLS policies.
INSERT INTO candidates (full_name, email, resume_text, edu_score, years_exp, skill_score, profile_quality)
VALUES 
('Alice Johnson', 'alice@example.com', 'Experienced Python developer with a focus on web apps.', 2.5, 5, 0.8, 0.9),
('Bob Smith', 'bob@example.com', 'Machine Learning specialist with an MS in CS.', 3.0, 3, 0.9, 0.85)
ON CONFLICT (email) DO NOTHING;
