function openOlyMoly() {
    browser.tabs.create({
        "url": "/oly-moly.html"
    });
}

browser.browserAction.onClicked.addListener(openOlyMoly);
