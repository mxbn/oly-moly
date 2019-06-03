function saveOptions(e) {
    e.preventDefault();
    browser.storage.sync.set({
        ipaddress: document.getElementById("ip-address").value
    });
}

function restoreOptions() {

    function setCurrentChoice(result) {
        document.getElementById("ip-address").value= result.ipaddress || "192.168.0.10";
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    var getting = browser.storage.sync.get("color");
    getting.then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
