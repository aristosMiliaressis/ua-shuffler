document.body.onload = loadSettingsFromStorage;
window.optionsButton.onclick= function() { window.open("options.html", '_blank').focus(); };

function loadSettingsFromStorage() {
    var header_toggles = document.querySelector('#header_toggles');

    chrome.storage.local.get('options', (data) => {
        var options = Object.assign({}, data.options);

        for (var index in options) {
            var button = document.createElement('button');
            button.innerText = options[index].HeaderName;
            button.setAttribute('index', index)
            button.onclick = toggleHeader;
            var br = document.createElement('br');
            button.classList.add(options[index].Disabled ? 'disabled' : 'enabled');

            header_toggles.appendChild(button);
            header_toggles.appendChild(br);
        }
    });
}

function toggleHeader() {
    chrome.storage.local.get('options', (data) => {
        var options = Object.assign({}, data.options);

        var index = this.getAttribute('index');

        options[index].Disabled = !options[index].Disabled;
        updateOptions(options);
        this.classList.add(options[index].Disabled ? 'disabled' : 'enabled');
        this.classList.remove(options[index].Disabled ? 'enabled' : 'disabled');
    });
}

function updateOptions(options)
{
    chrome.storage.local.set({options}, () => 
    {
        chrome.runtime.sendMessage("reload");
    });
}