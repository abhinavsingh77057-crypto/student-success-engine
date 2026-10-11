document.addEventListener("DOMContentLoaded", () => {
    function loadDashboardMetrics() {
        // Flask ke updated API endpoint se data fetch karein
        fetch('/api/data')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP Error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Data received successfully:", data);

                // HTML Elements ko data ke hisab se dynamically update karein
                if (document.getElementById('total-students')) {
                    document.getElementById('total-students').innerText = data.total_students;
                }
                if (document.getElementById('avg-gpa')) {
                    document.getElementById('avg-gpa').innerText = data.average_gpa;
                }
                if (document.getElementById('mean-attendance')) {
                    document.getElementById('mean-attendance').innerText = data.mean_attendance + "%";
                }
            })
            .catch(error => {
                console.error("Dashboard data load nahi ho paya:", error);
            });
    }

    loadDashboardMetrics();
});
