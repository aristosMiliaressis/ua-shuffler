document.body.onload = populateOptionsPage;

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

function populateOptionsPage()
{
    chrome.storage.local.get('options', (data) =>
    {
        var options = Object.assign({}, data.options);

        var table = document.querySelector('#header_table');

        for (var name in options.headers) {

            addRow();

            var addRowButton = table.lastElementChild.querySelector('button');
            addRowButton.innerText = '-';
            addRowButton.onclick = removeRow;

            var headerNameInput = table.lastElementChild.querySelector('input[name="header_name"]');
            headerNameInput.value = name;

            var headerValueTextArea = table.lastElementChild.querySelector('textarea[name="header_values"]');
            headerValueTextArea.removeAttribute("hidden");
            headerValueTextArea.value = options.headers[name].Values?.join('\r\n') || {};
            headerValueTextArea.style.height = headerValueTextArea.scrollHeight+'px';
        }

        addRow();
    });
}

function updateOptions()
{
    let options = { headers: {} }
    let headerRows = document.querySelectorAll('#header_table tr');
    for (let row of headerRows)
    {
        let headerName = row.querySelector("[name=header_name]");
        let headerValues = row.querySelector("[name=header_values]");
        if (headerName.value == "")
            continue;

        headerName.value = headerName.value.toLowerCase();

        options.headers[headerName.value] = { Enabled: true, Values: headerValues.value.split(/\r?\n/) };
    }

    chrome.storage.local.set({options}, () =>
    {
        chrome.runtime.sendMessage("reload");
    });
}

function toggleButtonAction(addRowButton)
{
    addRowButton.innerText = '-';
    addRowButton.onclick = removeRow;

    addRow();
}

function addRow()
{
    var table = document.querySelector('#header_table');
    var template = document.querySelector('#new_row_template');
    var clone = template.content.cloneNode(true);
    clone.querySelector('button').onclick = function() { toggleButtonAction(this); }
    table.appendChild(clone);

    var headerNameInput = table.lastElementChild.querySelector('input[name="header_name"]');
    if (headerNameInput != null)
    {
        headerNameInput.removeAttribute("hidden");
        headerNameInput.onkeyup = updateOptions;
    }

    var headerValuesInput = table.lastElementChild.querySelector('textarea[name="header_values"]');
    if (headerValuesInput != null)
    {
        headerValuesInput.removeAttribute("hidden");
        headerValuesInput.onkeyup = updateOptions;
    }
}

function removeRow(event)
{
    event.target.parentElement.parentElement.remove();
    updateOptions();
}
