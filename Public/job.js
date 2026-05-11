const jobId = window.location.pathname.split("/").pop();

const titleEl = document.getElementById("jobTitle");
const slotsEl = document.getElementById("slots");
const messageEl = document.getElementById("message");

// Load job details
async function loadJob() {
    try {
        const res = await fetch(`/job-data/${jobId}`);
        const data = await res.json();

        if (data.message) {
            document.body.innerHTML = `<h2>${data.message}</h2>`;
            return;
        }

        titleEl.innerText = data.title;
        slotsEl.innerText = `Remaining Slots: ${data.slots_remaining}`;

    } catch (error) {
        console.error(error);
        document.body.innerHTML = "<h2>Error loading job</h2>";
    }
}

// Apply for job
async function apply() {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();

    messageEl.innerText = "";

    // Validation
    if (!name || !phone) {

    messageEl.innerText =
        "Please enter all details";

    return;
}

// 10-digit validation
const phoneRegex = /^[0-9]{10}$/;

if (!phoneRegex.test(phone)) {

    messageEl.innerText =
        "Phone number must be 10 digits";

    return;
}

        // Refresh slots after applying
        loadJob();

    } catch (error) {
        console.error(error);
        messageEl.innerText = "Something went wrong";
    }
}

// Initial load
const progressBar = document.getElementById("progressBar");

async function loadJob() {
    try {
        const res = await fetch(`/job-data/${jobId}`);
        const data = await res.json();

        if (data.message) {
            document.body.innerHTML = `<h2>${data.message}</h2>`;
            return;
        }

        titleEl.innerText = data.title;
        slotsEl.innerText = `Slots: ${data.slots_filled} / ${data.slots_total}`;

        // Calculate percentage
        const percent = (data.slots_filled / data.slots_total) * 100;
        progressBar.style.width = percent + "%";

        // Change color based on fill
        if (percent > 80) {
            progressBar.style.background = "red";
        } else if (percent > 50) {
            progressBar.style.background = "orange";
        } else {
            progressBar.style.background = "green";
        }

    } catch (error) {
        console.error(error);
        document.body.innerHTML = "<h2>Error loading job</h2>";
    }
}