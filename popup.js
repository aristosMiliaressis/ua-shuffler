document.body.onload = populateOptionsPopup;
optionsButton.onclick = () => window.open("options.html", '_blank').focus();
cacheBustingToggle.onclick = toggleCacheBusting;

function populateOptionsPopup() {
    var header_toggles = document.querySelector('#header_toggles');

    chrome.storage.local.get('options', (data) => {
        var options = Object.assign({}, data.options);

        cacheBustingToggle.classList.add(options.cacheBusting ? 'enabled' : 'disabled');
                
        for (var name in options.headers) {
            var br = document.createElement('br');
            var button = document.createElement('button');

            button.innerText = name;
            button.classList.add(options.headers[name].Enabled ? 'enabled' : 'disabled');
            button.onclick = toggleHeader;

            header_toggles.appendChild(button);
            header_toggles.appendChild(br);
        }
    });
}

function toggleCacheBusting() {
    chrome.storage.local.get('options', (data) => {
        var options = Object.assign({}, data.options);

        options.cacheBusting = !options.cacheBusting;
        cacheBustingToggle.className = "";
        cacheBustingToggle.classList.add(options.cacheBusting ? 'enabled' : 'disabled')
        
        updateOptions(options);  
    });
}

function toggleHeader() {
    chrome.storage.local.get('options', (data) => {
        var options = Object.assign({}, data.options);

        options.headers[this.innerText].Enabled = !options.headers[this.innerText].Enabled;
        this.classList.add(options.headers[this.innerText].Enabled ? 'enabled' : 'disabled');
        this.classList.remove(options.headers[this.innerText].Enabled ? 'disabled' : 'enabled');

        updateOptions(options);
    });
}

function updateOptions(options)
{
    chrome.storage.local.set({options}, () => 
    {
        chrome.runtime.sendMessage("reload");
    });
}