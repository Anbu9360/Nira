// Create Job
async function createJob() {
    const title = document.getElementById("title").value.trim();
    const slots = document.getElementById("slots").value;

    const messageEl = document.getElementById("message");
    const linkEl = document.getElementById("link");

    // Clear old messages
    messageEl.innerText = "";
    linkEl.innerText = "";

    // Basic validation
    if (!title || !slots) {
        messageEl.innerText = "Please fill all fields";
        return;
    }
    const confirmPost =
    confirm("Post this job?");

if (!confirmPost) return;

    try {
        const res = await fetch("/create-job", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ title, slots })
        });

        const data = await res.json();

        messageEl.innerText = data.message;

        // Show link if created
        if (data.link) {
            linkEl.innerHTML =
                `<a href="${data.link}" target="_blank">${data.link}</a>`;
        }

    } catch (error) {
        console.error(error);
        messageEl.innerText = "Something went wrong";
    }
}