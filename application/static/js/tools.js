// Slide between the tools
const toolsContainer = document.getElementById("tools-container");
const tool = document.querySelector(".tool");

const prevButton = document.getElementById("control-prev");
const nextButton = document.getElementById("control-next");

nextButton.addEventListener("click", () => {
    const toolWidth = tool.clientWidth;
    toolsContainer.scrollLeft += toolWidth;
});

prevButton.addEventListener("click", () => {
    const toolWidth = tool.clientWidth;
    toolsContainer.scrollLeft -= toolWidth;
});

// Copy the output
function CopyResultsTraversal() {
    var results_text = document.getElementById("results-traversal");

    if (results_text.textContent == '') {
        return;
    }

    navigator.clipboard.writeText(results_text.textContent);

    ShowAlert('Copiado en el portapapeles','info',2000);
}

function CopyResultsPaths() {
    var results_text = document.getElementById("results-path");

    if (results_text.textContent == '') {
        return;
    }

    navigator.clipboard.writeText(results_text.textContent);

    ShowAlert('Copiado en el portapapeles','info',2000);
}