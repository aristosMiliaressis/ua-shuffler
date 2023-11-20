document.body.onload = populateOptionsPopup;
optionsButton.onclick = () => window.open("/options/options.html", '_blank').focus();

function populateOptionsPopup() {
    var headerTable = document.querySelector('#header_toggles');
    var queryTable = document.querySelector('#query_toggles');

    chrome.storage.local.get('options', (data) => {
        var options = Object.assign({}, data.options);
               
        for (var name in options.fields.headers) {
            var br = document.createElement('br');
            var button = document.createElement('button');

            button.innerText = name;
            button.setAttribute('category', 'headers');
            button.classList.add(options.fields.headers[name].Enabled ? 'enabled' : 'disabled');
            button.onclick = toggleField;

            headerTable.appendChild(button);
            headerTable.appendChild(br);
        }
        
        for (var name in options.fields.query) {
            var br = document.createElement('br');
            var button = document.createElement('button');

            button.innerText = name;
            button.setAttribute('category', 'query');
            button.classList.add(options.fields.query[name].Enabled ? 'enabled' : 'disabled');
            button.onclick = toggleField;

            queryTable.appendChild(button);
            queryTable.appendChild(br);
        }
    });
}

function toggleField() {
    chrome.storage.local.get('options', (data) => {
        var options = Object.assign({}, data.options);

        category = this.getAttribute('category')
        
        options.fields[category][this.innerText].Enabled = !options.fields[category][this.innerText].Enabled;
        this.classList.add(options.fields[category][this.innerText].Enabled ? 'enabled' : 'disabled');
        this.classList.remove(options.fields[category][this.innerText].Enabled ? 'disabled' : 'enabled');

        chrome.storage.local.set({options}, () => 
        {
            chrome.runtime.sendMessage("reload");
        });
    });
}
