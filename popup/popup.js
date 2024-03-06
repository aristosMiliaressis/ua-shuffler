document.body.onload = populateOptionsPopup;
optionsButton.onclick = () => window.open("/options/options.html", '_blank').focus();
enableAllHeaders.onclick = () => updateAll('headers', true);
disableAllHeaders.onclick = () => updateAll('headers', false);
enableAllQuery.onclick = () => updateAll('query', true);
disableAllQuery.onclick = () => updateAll('query', false);
enableAllCookies.onclick = () => updateAll('cookies', true);
disableAllCookies.onclick = () => updateAll('cookies', false);
scopeRegex.onchange = () => updateScope();

function populateOptionsPopup() {
    var headerTable = document.querySelector('#header_toggles');
    var queryTable = document.querySelector('#query_toggles');
    var cookieTable = document.querySelector('#cookie_toggles');

    chrome.storage.local.get('options', (data) => {
        var options = Object.assign({}, data.options);
        
        scopeRegex.value = options.scope || "";
               
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
        
        for (var name in options.fields.cookies) {
            var br = document.createElement('br');
            var button = document.createElement('button');

            button.innerText = name;
            button.setAttribute('category', 'cookies');
            button.classList.add(options.fields.cookies[name].Enabled ? 'enabled' : 'disabled');
            button.onclick = toggleField;

            cookieTable.appendChild(button);
            cookieTable.appendChild(br);
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

function updateAll(categoty, state) {
     chrome.storage.local.get('options', (data) => {
        var options = Object.assign({}, data.options);

        for (var fieldName in options.fields[categoty]) {
            options.fields[categoty][fieldName].Enabled = state;
            button = Array.from(document.querySelectorAll(`button[category=${categoty}]`)).find(el => el.textContent === fieldName)

            button.classList.add(state ? 'enabled' : 'disabled');
            button.classList.remove(state ? 'disabled' : 'enabled');

            chrome.storage.local.set({options}, () => 
            {
                chrome.runtime.sendMessage("reload");
            });
        }
    });
}

function updateScope() {
    chrome.storage.local.get('options', (data) => {
        var options = Object.assign({}, data.options);
        options.scope = scopeRegex.value;
        chrome.storage.local.set({options}, () => 
        {
            chrome.runtime.sendMessage("reload");
        });
    });
}