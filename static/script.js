// let currentThreadId = localStorage.getItem("travel_thread_id") || null;
// let latestAnswerMarkdown = "";

// function setPrompt(text) {
//     document.getElementById("userInput").value = text;
// }

// function setLoading(isLoading) {
//     const sendBtn = document.getElementById("sendBtn");
//     const btnText = document.getElementById("btnText");
//     const btnLoader = document.getElementById("btnLoader");

//     sendBtn.disabled = isLoading;

//     if (isLoading) {
//         btnText.classList.add("hidden");
//         btnLoader.classList.remove("hidden");
//     } else {
//         btnText.classList.remove("hidden");
//         btnLoader.classList.add("hidden");
//     }
// }

// function showError(message) {
//     const errorBox = document.getElementById("errorBox");

//     errorBox.textContent = message;
//     errorBox.classList.remove("hidden");
// }

// function hideError() {
//     const errorBox = document.getElementById("errorBox");

//     errorBox.classList.add("hidden");
//     errorBox.textContent = "";
// }

// function showResult(answer, threadId) {
//     latestAnswerMarkdown = answer;

//     const resultSection = document.getElementById("resultSection");
//     const resultBox = document.getElementById("resultBox");
//     const threadInfo = document.getElementById("threadInfo");

//     if (typeof marked !== "undefined") {
//         resultBox.innerHTML = marked.parse(answer);
//     } else {
//         resultBox.innerText = answer;
//     }

//     threadInfo.textContent = `Thread ID: ${threadId}`;

//     resultSection.classList.remove("hidden");

//     resultSection.scrollIntoView({
//         behavior: "smooth",
//         block: "start"
//     });
// }

// async function sendMessage() {
//     hideError();

//     const input = document.getElementById("userInput");
//     const message = input.value.trim();

//     if (!message) {
//         showError("Please enter your travel request first.");
//         return;
//     }

//     setLoading(true);

//     try {
//         const response = await fetch("/api/travel", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({
//                 message: message,
//                 thread_id: currentThreadId
//             })
//         });

//         const data = await response.json();

//         if (!response.ok || !data.success) {
//             throw new Error(data.error || "Something went wrong.");
//         }

//         currentThreadId = data.thread_id;
//         localStorage.setItem("travel_thread_id", currentThreadId);

//         showResult(data.answer, data.thread_id);

//     } catch (error) {
//         showError(error.message);
//     } finally {
//         setLoading(false);
//     }
// }

// function copyResult() {
//     const resultBox = document.getElementById("resultBox");
//     const text = resultBox.innerText;

//     if (!text) {
//         return;
//     }

//     navigator.clipboard.writeText(text)
//         .then(() => {
//             const copyBtn = document.querySelector(".copy-btn");
//             const oldText = copyBtn.textContent;

//             copyBtn.textContent = "Copied!";

//             setTimeout(() => {
//                 copyBtn.textContent = oldText;
//             }, 1400);
//         })
//         .catch(() => {
//             showError("Could not copy result.");
//         });
// }

// function downloadPDF() {
//     const pdfContent = document.getElementById("pdfContent");

//     if (!latestAnswerMarkdown || !pdfContent) {
//         showError("No travel plan available to download.");
//         return;
//     }

//     const downloadBtn = document.querySelector(".download-btn");
//     const oldText = downloadBtn.textContent;

//     downloadBtn.textContent = "Preparing PDF...";
//     downloadBtn.disabled = true;

//     const options = {
//         margin: 0.5,
//         filename: "ai-travel-plan.pdf",
//         image: {
//             type: "jpeg",
//             quality: 0.98
//         },
//         html2canvas: {
//             scale: 2,
//             useCORS: true,
//             backgroundColor: "#ffffff"
//         },
//         jsPDF: {
//             unit: "in",
//             format: "a4",
//             orientation: "portrait"
//         },
//         pagebreak: {
//             mode: ["avoid-all", "css", "legacy"]
//         }
//     };

//     html2pdf()
//         .set(options)
//         .from(pdfContent)
//         .save()
//         .then(() => {
//             downloadBtn.textContent = oldText;
//             downloadBtn.disabled = false;
//         })
//         .catch(() => {
//             downloadBtn.textContent = oldText;
//             downloadBtn.disabled = false;
//             showError("Could not download PDF.");
//         });
// }

// document.addEventListener("keydown", function(event) {
//     if (event.ctrlKey && event.key === "Enter") {
//         sendMessage();
//     }
// });

















let currentThreadId = localStorage.getItem("travel_thread_id") || null;
let latestAnswerMarkdown = "";
let loadingTimer = null;

function setPrompt(text) {
    document.getElementById("userInput").value = text;
}

/* Used by the destination tiles: fill the prompt, then jump to the planner */
function useDestination(text) {
    setPrompt(text);

    const planner = document.getElementById("planner");
    if (planner) {
        planner.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    setTimeout(() => {
        document.getElementById("userInput").focus({ preventScroll: true });
    }, 450);
}

/* Start a fresh conversation (clears the saved thread) */
function newTrip() {
    currentThreadId = null;
    latestAnswerMarkdown = "";
    localStorage.removeItem("travel_thread_id");

    document.getElementById("resultSection").classList.add("hidden");
    document.getElementById("resultBox").innerHTML = "";
    document.getElementById("threadInfo").textContent = "Thread ID: -";

    const input = document.getElementById("userInput");
    input.value = "";

    document.getElementById("planner").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    input.focus({ preventScroll: true });
}

/* ---------- Loading progress (visual only) ---------- */

function startLoadingSteps() {
    const panel = document.getElementById("loadingPanel");
    const steps = Array.from(document.querySelectorAll("#loadingSteps li"));

    if (!panel || steps.length === 0) {
        return;
    }

    let index = 0;

    const paint = () => {
        steps.forEach((step, i) => {
            step.classList.toggle("done", i < index);
            step.classList.toggle("active", i === index);
        });
    };

    paint();
    panel.classList.remove("hidden");

    panel.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    clearInterval(loadingTimer);
    loadingTimer = setInterval(() => {
        if (index < steps.length - 1) {
            index += 1;
            paint();
        }
    }, 5000);
}

function stopLoadingSteps() {
    clearInterval(loadingTimer);
    loadingTimer = null;

    const panel = document.getElementById("loadingPanel");
    if (panel) {
        panel.classList.add("hidden");
    }
}

/* ---------- Original logic ---------- */

function setLoading(isLoading) {
    const sendBtn = document.getElementById("sendBtn");
    const btnText = document.getElementById("btnText");
    const btnLoader = document.getElementById("btnLoader");

    sendBtn.disabled = isLoading;

    if (isLoading) {
        btnText.classList.add("hidden");
        btnLoader.classList.remove("hidden");
    } else {
        btnText.classList.remove("hidden");
        btnLoader.classList.add("hidden");
    }
}

function showError(message) {
    const errorBox = document.getElementById("errorBox");

    errorBox.textContent = message;
    errorBox.classList.remove("hidden");
}

function hideError() {
    const errorBox = document.getElementById("errorBox");

    errorBox.classList.add("hidden");
    errorBox.textContent = "";
}

function showResult(answer, threadId) {
    latestAnswerMarkdown = answer;

    const resultSection = document.getElementById("resultSection");
    const resultBox = document.getElementById("resultBox");
    const threadInfo = document.getElementById("threadInfo");

    if (typeof marked !== "undefined") {
        resultBox.innerHTML = marked.parse(answer);
    } else {
        resultBox.innerText = answer;
    }

    threadInfo.textContent = `Thread ID: ${threadId}`;

    resultSection.classList.remove("hidden");

    resultSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

async function sendMessage() {
    hideError();

    const input = document.getElementById("userInput");
    const message = input.value.trim();

    if (!message) {
        showError("Please enter your travel request first.");
        return;
    }

    setLoading(true);
    startLoadingSteps();

    try {
        const response = await fetch("/api/travel", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message,
                thread_id: currentThreadId
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || "Something went wrong.");
        }

        currentThreadId = data.thread_id;
        localStorage.setItem("travel_thread_id", currentThreadId);

        stopLoadingSteps();
        showResult(data.answer, data.thread_id);

    } catch (error) {
        stopLoadingSteps();
        showError(error.message);
    } finally {
        stopLoadingSteps();
        setLoading(false);
    }
}

function copyResult() {
    const resultBox = document.getElementById("resultBox");
    const text = resultBox.innerText;

    if (!text) {
        return;
    }

    navigator.clipboard.writeText(text)
        .then(() => {
            const copyBtn = document.querySelector(".copy-btn");
            const oldText = copyBtn.textContent;

            copyBtn.textContent = "Copied!";

            setTimeout(() => {
                copyBtn.textContent = oldText;
            }, 1400);
        })
        .catch(() => {
            showError("Could not copy result.");
        });
}

function downloadPDF() {
    const pdfContent = document.getElementById("pdfContent");

    if (!latestAnswerMarkdown || !pdfContent) {
        showError("No travel plan available to download.");
        return;
    }

    const downloadBtn = document.querySelector(".download-btn");
    const oldText = downloadBtn.textContent;

    downloadBtn.textContent = "Preparing PDF...";
    downloadBtn.disabled = true;

    const options = {
        margin: 0.5,
        filename: "ai-travel-plan.pdf",
        image: {
            type: "jpeg",
            quality: 0.98
        },
        html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff"
        },
        jsPDF: {
            unit: "in",
            format: "a4",
            orientation: "portrait"
        },
        pagebreak: {
            mode: ["avoid-all", "css", "legacy"]
        }
    };

    html2pdf()
        .set(options)
        .from(pdfContent)
        .save()
        .then(() => {
            downloadBtn.textContent = oldText;
            downloadBtn.disabled = false;
        })
        .catch(() => {
            downloadBtn.textContent = oldText;
            downloadBtn.disabled = false;
            showError("Could not download PDF.");
        });
}

document.addEventListener("keydown", function(event) {
    if (event.ctrlKey && event.key === "Enter") {
        sendMessage();
    }
});

/* ---------- Site chrome: header shadow + mobile menu ---------- */

(function initChrome() {
    const header = document.getElementById("siteHeader");
    const toggle = document.getElementById("navToggle");
    const nav = document.getElementById("mainNav");

    function onScroll() {
        if (header) {
            header.classList.toggle("scrolled", window.scrollY > 8);
        }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (toggle && nav) {
        toggle.addEventListener("click", () => {
            const open = nav.classList.toggle("open");
            toggle.setAttribute("aria-expanded", String(open));
        });

        nav.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                nav.classList.remove("open");
                toggle.setAttribute("aria-expanded", "false");
            });
        });
    }
})();