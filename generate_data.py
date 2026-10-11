import pandas as pd
import numpy as np

def generate_student_dataset(n_students=500, output_path='students_data.csv'):
    np.random.seed(42)

    student_ids = list(range(1001, 1001 + n_students))
    
    # Generate realistic correlated academic metrics
    gpa = np.round(np.random.uniform(2.0, 4.0, n_students), 2)
    attendance = np.round(np.random.uniform(55.0, 99.5, n_students), 1)
    
    # LMS logins and system interactions correlate somewhat with attendance & GPA
    lms_base = (attendance / 100.0) * 40 + (gpa / 4.0) * 15
    lms_logins = np.clip(np.round(lms_base + np.random.normal(0, 5, n_students)).astype(int), 3, 65)
    
    interact_base = lms_logins * 2.2 + (gpa * 8)
    system_interactions = np.clip(np.round(interact_base + np.random.normal(0, 10, n_students)).astype(int), 10, 150)

    # Risk score calculation
    risk_scores = (4.0 - gpa) * 1.8 + (100.0 - attendance) * 0.05 + (50 - lms_logins) * 0.03
    
    risk_levels = []
    for score in risk_scores:
        if score >= 3.6:
            risk_levels.append('High')
        elif score >= 2.2:
            risk_levels.append('Medium')
        else:
            risk_levels.append('Low')

    df = pd.DataFrame({
        'student_id': student_ids,
        'gpa': gpa,
        'attendance': attendance,
        'risk_level': risk_levels,
        'lms_logins': lms_logins,
        'system_interactions': system_interactions
    })

    df.to_csv(output_path, index=False)
    print(f"✅ {n_students} Students dataset successfully generated and saved to '{output_path}'!")
    print(f"Risk breakdown: High={sum(df['risk_level'] == 'High')}, Medium={sum(df['risk_level'] == 'Medium')}, Low={sum(df['risk_level'] == 'Low')}")
    return df

if __name__ == '__main__':
    generate_student_dataset()
