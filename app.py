from flask import Flask, render_template, jsonify
import pandas as pd
import os

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/data')
def get_data():
    csv_path = 'students_data.csv'
    if not os.path.exists(csv_path):
        return jsonify({"error": "Data file nahi mili"}), 404
        
    try:
        df = pd.read_csv(csv_path)
        metrics = {
            "total_students": int(len(df)),
            "average_gpa": float(round(df['gpa'].mean(), 2)),
            "mean_attendance": float(round(df['attendance'].mean(), 1))
        }
        return jsonify(metrics)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
