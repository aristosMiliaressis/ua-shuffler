document.body.onload = loadOptionsFromStorage;

window.exportButton.onclick = exportOptions;
window.importButton.onclick = importOptions;

function exportOptions() {
    chrome.storage.local.get('options', (data) =>
    {
        var options = Object.assign({}, data.options);

        var a = document.createElement("a");
        var url = window.webkitURL || window.URL || window.mozURL || window.msURL;
        a.download = 'ua-shuffler.json';
        var blob = new Blob([JSON.stringify(options)], {type: "application/json"});
        a.href = url.createObjectURL(blob);
        a.dataset.downloadurl = ['json', a.download, a.href].join(':');
        a.click();
    });
}

function importOptions()
{
    window.optionsImport.onchange = function()
    {
        var reader = new FileReader(this.files[0]);
        reader.onload = function(event)
        {
            chrome.storage.local.set({options: JSON.parse(event.target.result)});
            location = "options.html";
        };
        reader.readAsText(this.files[0]);
    }
    window.optionsImport.click();
}

function syncOptionsToStorage(options)
{
    chrome.storage.local.set({options}, () =>
    {
        chrome.runtime.sendMessage("reload");
    });
}

function loadOptionsFromStorage()
{
    chrome.storage.local.get('options', (data) =>
    {
        var options = Object.assign({}, data.options);

        var table = document.querySelector('#header_table');

        for (var index in options) {
            if (index == undefined)
                continue;

            addRow();

            var addRowButton = table.lastElementChild.querySelector('button');
            addRowButton.innerText = '-';
            addRowButton.onclick = removeRow;

            var headerNameInput = table.lastElementChild.querySelector('input[name="header_name"]');
            headerNameInput.value = options[index].HeaderName;

            var headerValueTextArea = table.lastElementChild.querySelector('textarea[name="header_values"]');
            headerValueTextArea.removeAttribute("hidden");
            headerValueTextArea.value = options[index].HeaderValues?.join('\r\n') || {};
            headerValueTextArea.style.height = headerValueTextArea.scrollHeight+'px';
        }

        addRow();
    });
}

function addRowButtonHandler(addRowButton)
{
    addRowButton.innerText = '-';
    addRowButton.onclick = removeRow;

    addRow();
}

function addRow()
{
    var table = document.querySelector('#header_table');
    var index = 0;
    if (table.lastElementChild != null)
        index = parseInt(table.lastElementChild.getAttribute('index'))+1;

    var template = document.querySelector('#new_row_template');
    var clone = template.content.cloneNode(true);
    clone.querySelector('button').onclick = function() { addRowButtonHandler(this); }
    table.appendChild(clone);

    table.lastElementChild.setAttribute('index', index);

    var headerNameInput = table.lastElementChild.querySelector('input[name="header_name"]');
    if (headerNameInput != null)
    {
        headerNameInput.removeAttribute("hidden");
        headerNameInput.onkeyup = function (event)
        {
            chrome.storage.local.get('options', (data) =>
            {
                var options = Object.assign({}, data.options);
                var rowOption = options[index] || {};
                rowOption.HeaderName = event.target.value;
                options[index] = rowOption;
                syncOptionsToStorage(options);
            });
        }
    }

    var headerValuesInput = table.lastElementChild.querySelector('textarea[name="header_values"]');
    if (headerValuesInput != null)
    {
        headerValuesInput.removeAttribute("hidden");
        headerValuesInput.onkeyup = function (event)
        {
            chrome.storage.local.get('options', (data) =>
            {
                var options = Object.assign({}, data.options);
                var rowOption = options[index] || {};
                rowOption.HeaderValues = event.target.value.split(/\r?\n/);
                options[index] = rowOption;
                syncOptionsToStorage(options);
            });
        }
    }
}

function removeRow(event)
{
    chrome.storage.local.get('options', (data) =>
    {
        var row = event.target.parentElement.parentElement;

        var index = parseInt(row.getAttribute('index'));

        var options = Object.assign({}, data.options);
        options[index] = undefined;

        syncOptionsToStorage(options);

        row.remove();
    });
}
