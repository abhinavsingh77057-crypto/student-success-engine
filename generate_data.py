import pandas as pd
import numpy as np

# 500 students ka random data generate karne ke liye
np.random.seed(42)
data = {
    'student_id': range(1001, 1501),
    'gpa': np.round(np.random.uniform(2.0, 4.0, 500), 2),
    'attendance': np.round(np.random.uniform(60, 100, 500), 1),
    'risk_level': np.random.choice(['Low', 'Medium', 'High'], size=500, p=[0.6, 0.25, 0.15])
}

df = pd.DataFrame(data)
df.to_csv('students_data.csv', index=False)
print("✅ 500 Students ka data 'students_data.csv' mein save ho gaya hai!")
