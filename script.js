photos = [];
selected = {};
lastSelected = null;
ipaddress = "192.168.0.10";
folder = "";

function getFolders() {
    while (document.getElementById("thumbnails").firstChild) {
        document.getElementById("thumbnails").removeChild(document.getElementById("counter").firstChild);
    }
    loading = document.createElement("div");
    loading.style.padding = "20px";
    loading.appendChild(document.createTextNode("loading..."));
    document.getElementById("thumbnails").appendChild(loading);

    var xhttp = new XMLHttpRequest();
    xhttp.timeout = 3000;
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            folders = xhttp.responseText.match(/\/DCIM,.*?,/g);
            folders.sort().reverse();
            reset = true;
            for (f in folders) {
                getPhotos(folders[f], reset);
                reset = false;
            }
        }
    };
    xhttp.addEventListener("timeout", function(e) {
        while (document.getElementById("thumbnails").firstChild) {
            document.getElementById("thumbnails").removeChild(document.getElementById("thumbnails").firstChild);
        }
        loading = document.createElement("div");
        loading.style.padding = "20px";
        loading.appendChild(document.createTextNode("Can't connect to camera."));
        document.getElementById("thumbnails").appendChild(loading);
    });
    xhttp.open("GET", "http://" + ipaddress + "/DCIM", true);
    xhttp.send();
}

function getPhotos(folder, reset) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            photos = xhttp.responseText.match(/\/DCIM\/.*?.JPG/g);
            photos.sort().reverse();

            header = document.createElement("div");
            text = document.createTextNode(folder.replace(",", "/").replace(",", ""));
            header.appendChild(text);

            list = document.createElement("div");

            for (i = 0; i < photos.length; i++) {
                thumbnail = document.createElement("div");
                thumbnail.className = "card";

                checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.id = photos[i];

                thumbnail.appendChild(checkbox);

                label = document.createElement("label");
                label.setAttribute("for", photos[i]);
                label.appendChild(document.createTextNode(photos[i].split(",")[1]));
                label.appendChild(document.createElement("br"));

                thumb_image = document.createElement("img");
                thumb_image.setAttribute("src", "http://" + ipaddress + "/get_thumbnail.cgi?DIR=" + photos[i].replace(",", "/"));
                ref = document.createAttribute("ref");
                ref.value = photos[i];
                thumb_image.setAttributeNode(ref);

                label.appendChild(thumb_image);
                ref = document.createAttribute("ref");
                ref.value = photos[i];
                label.setAttributeNode(ref);

                thumbnail.appendChild(label);
                ref = document.createAttribute("ref");
                ref.value = photos[i];
                thumbnail.setAttributeNode(ref);

                thumbnail.addEventListener("click", function(e) {
                    selectThumbnail(e);
                });

                list.appendChild(thumbnail);
            }
            if (reset) {
                while (document.getElementById("thumbnails").firstChild) {
                    document.getElementById("thumbnails").removeChild(document.getElementById("thumbnails").firstChild);
                }
            }
            document.getElementById("thumbnails").appendChild(header);
            document.getElementById("thumbnails").appendChild(list);
        }
    };
    xhttp.open("GET", "http://" + ipaddress + folder.replace(",", "/").replace(",", ""), true);
    xhttp.send();
}

function selectThumbnail(e) {
    var target = null;
    var id = null;
    if (e.target.getAttribute("ref") == undefined) {
        checkbox = e.target;
        id = checkbox.id;
    } else {
        checkbox = document.getElementById(e.target.getAttribute("ref"));
        id = e.target.getAttribute("ref");
        if (e.shiftKey) {
            checkbox.checked = !checkbox.checked;
            e.stopImmediatePropagation();
        }
    }
    document.getElementById("progress").value = 0;

    if (checkbox.checked) {
        selected[id] = true;
        if (e.shiftKey && lastSelected != null && lastSelected != id) {
            // select range
            select = false;
            for (i in photos) {
                if (select == false && (photos[i] == lastSelected || photos[i] == id)) {
                    select = true;
                } else if (select == true && (photos[i] == lastSelected || photos[i] == id)) {
                    break;
                }
                if (select) {
                    selected[photos[i]] = true;
                    document.getElementById(photos[i]).checked = true;
                }
            }
        }
    } else {
        if (id in selected) {
            delete selected[id];
        }
        if (e.shiftKey && lastSelected != null && lastSelected != id) {
            // deselect range
            select = false;
            for (i in photos) {
                if (select == false && (photos[i] == lastSelected || photos[i] == id)) {
                    select = true;
                } else if (select == true && (photos[i] == lastSelected || photos[i] == id)) {
                    document.getElementById(photos[i]).checked = false;
                    if (photos[i] in selected) {
                        delete selected[photos[i]];
                    }
                    break;
                }
                if (select) {
                    if (photos[i] in selected) {
                        delete selected[photos[i]];
                    }
                    document.getElementById(photos[i]).checked = false;
                }
            }
        }
    }
    lastSelected = id;
    if (document.getElementById("counter").firstChild) {
        document.getElementById("counter").removeChild(document.getElementById("counter").firstChild);
    }
    document.getElementById("counter").appendChild(document.createTextNode(Object.keys(selected).length));
}

function selectAll() {
    document.getElementById("progress").value = 0;
    for (i in photos) {
        document.getElementById(photos[i]).checked = true;
        selected[photos[i]] = true;
    }
    updateCounter();
}

function deselectAll() {
    for (i in photos) {
        document.getElementById(photos[i]).checked = false;
        delete selected[photos[i]];
    }
    updateCounter();
}

function updateCounter() {
    if (document.getElementById("counter").firstChild) {
        document.getElementById("counter").removeChild(document.getElementById("counter").firstChild);
    }
    document.getElementById("counter").appendChild(document.createTextNode(Object.keys(selected).length));
}

async function downloadSelected() {
    if (Object.keys(selected).length == 0) {
        return;
    }

    document.getElementById("download-btn").classList.remove("card");
    document.getElementById("select-all").classList.remove("card");
    document.getElementById("deselect-all").classList.remove("card");
    document.getElementById("folder-name").classList.remove("card");

    document.getElementById("download-btn").classList.add("card-disabled");
    document.getElementById("select-all").classList.add("card-disabled");
    document.getElementById("deselect-all").classList.add("card-disabled");
    document.getElementById("folder-name").classList.add("card-disabled");

    document.getElementById("download-btn-lbl").innerText = "Downloading...";

    document.getElementById("download-btn").removeEventListener("click", downloadSelected);
    document.getElementById("select-all").removeEventListener("click", selectAll);
    document.getElementById("deselect-all").removeEventListener("click", deselectAll);

    document.getElementById("progress").max = Object.keys(selected).length;
    browser.downloads.onChanged.addListener(handleChanged);
    folder = document.getElementById("folder-name").innerText;
    startDownload();
}

function startDownload() {
    p = Object.keys(selected)[0];
    delete selected[p];
    var downloading = browser.downloads.download({
        url : "http://" + ipaddress + p.replace(",", "/"),
        filename : folder + "/" + p.split(",")[1],
        conflictAction : "overwrite"
    });
    downloading.then(onStartedDownload, onFailed);
}

function handleChanged(delta) {
    if (delta.state && delta.state.current === "complete") {
        document.getElementById("progress").value += 1;
        updateCounter();
        if (document.getElementById("progress").value == document.getElementById("progress").max) {
            deselectAll();
            browser.downloads.onChanged.removeListener(handleChanged);

            document.getElementById("download-btn").classList.remove("card-disabled");
            document.getElementById("select-all").classList.remove("card-disabled");
            document.getElementById("deselect-all").classList.remove("card-disabled");
            document.getElementById("folder-name").classList.remove("card-disabled");

            document.getElementById("download-btn").classList.add("card");
            document.getElementById("select-all").classList.add("card");
            document.getElementById("deselect-all").classList.add("card");
            document.getElementById("folder-name").classList.add("card");

            document.getElementById("download-btn-lbl").innerText = "Download";

            document.getElementById("select-all").addEventListener("click", selectAll);
            document.getElementById("deselect-all").addEventListener("click", deselectAll);
            document.getElementById("download-btn").addEventListener("click", downloadSelected);
        } else {
            startDownload();
        }
    }
}

function onStartedDownload(id) {
    // console.log(`Started downloading: ${id}`);
}

function onFailed(error) {
    console.log(`Download failed: ${error}`);
}

function onError(error) {
    console.log(`Error: ${error}`);
}

function onGot(item) {
    if (item.ipaddress) {
        ipaddress = item.ipaddress;
    }
    getFolders();
}

document.addEventListener("DOMContentLoaded", function() {
    var getting = browser.storage.sync.get("ipaddress");
    getting.then(onGot, onError);
    document.getElementById("select-all").addEventListener("click", selectAll);
    document.getElementById("deselect-all").addEventListener("click", deselectAll);
    document.getElementById("download-btn").addEventListener("click", downloadSelected);
});
