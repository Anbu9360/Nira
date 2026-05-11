async function loadJobs() {

    try {

        const res = await fetch("/my-jobs");
        const data = await res.json();

        const container = document.getElementById("jobs");

        container.innerHTML = "";

        // Not logged in
        if (data.message) {

            container.innerHTML = `
                <h2 style="text-align:center;">
                    ${data.message}
                </h2>
            `;

            return;
        }

        // No jobs
        if (data.length === 0) {

            container.innerHTML = `
                <h2 style="text-align:center;">
                    No jobs created yet
                </h2>
            `;

            return;
        }

        // Render jobs
        data.forEach(job => {

            const percent =
                (job.slots_filled / job.slots_total) * 100;

            const color =
                percent > 80
                ? "red"
                : percent > 50
                ? "orange"
                : "green";

            const div = document.createElement("div");

            div.className = "job-card";

            div.innerHTML = `

                <h2>${job.title}</h2>

                <p>
                    <strong>Status:</strong>
                    ${job.status}
                </p>

                <p>
                    <strong>Slots:</strong>
                    ${job.slots_filled} / ${job.slots_total}
                </p>

                <!-- Progress Bar -->
                <div style="
                    width:100%;
                    background:#ddd;
                    height:20px;
                    border-radius:10px;
                    overflow:hidden;
                    margin-bottom:15px;
                ">

                    <div style="
                        width:${percent}%;
                        height:100%;
                        background:${color};
                        transition:0.3s;
                    ">
                    </div>

                </div>

               <div style="display:flex; gap:10px; margin-top:10px;">

    ${
        job.status === "open"
        ?
        `<button onclick="closeJob(${job.id})">
            Close Job
         </button>`
        :
        `<button disabled>
            Closed
         </button>`
    }

    <button 
        onclick="deleteJob(${job.id})"
        style="background:red; color:white;"
    >
        Delete
    </button>

</div>

                <h3>Applicants</h3>

                <ul>
                    ${
                        job.applicants.length > 0
                        ?
                        job.applicants.map(a =>
                            `<li>${a.name} - ${a.phone}</li>`
                        ).join("")
                        :
                        "<li>No applicants yet</li>"
                    }
                </ul>

                <hr>
            `;

            container.appendChild(div);
        });

    } catch (error) {

        console.error(error);

        document.getElementById("jobs").innerHTML = `
            <h2 style="text-align:center;">
                Error loading dashboard
            </h2>
        `;
    }
}

// Close Job
async function closeJob(jobId) {

    try {

        const res = await fetch("/close-job", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ jobId })
        });

        const data = await res.json();

        alert(data.message);

        // Refresh dashboard
        loadJobs();

    } catch (error) {

        console.error(error);

        alert("Something went wrong");
    }
}
async function deleteJob(jobId) {

    const confirmDelete =
        confirm("Delete this job permanently?");

    if (!confirmDelete) return;

    try {

        const res = await fetch(
            `/delete-job/${jobId}`,
            {
                method: "DELETE"
            }
        );

        const data = await res.json();

        alert(data.message);

        // Refresh dashboard instantly
        loadJobs();

    } catch (error) {

        console.error(error);

        alert("Delete failed");
    }
}

// Logout
async function logout() {

    try {

        await fetch("/logout");

        window.location.href = "/login";

    } catch (error) {

        console.error(error);

        alert("Logout failed");
    }
}

// Initial Load
loadJobs();