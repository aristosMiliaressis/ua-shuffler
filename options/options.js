document.body.onload = window.onhashchange = renderTab;

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

function renderTab()
{
    chrome.storage.local.get('options', (data) =>
    {
        var options = Object.assign({}, data.options);

        var tabs = document.querySelectorAll('.tab');
        for (var tab of tabs) {
            tab.classList.remove('active');
        }
        
        var tabId = window.location.hash.substring(1) || "headers";
        tab = document.getElementById(tabId);
        tab.classList.add('active');

        var table = document.querySelector('#field_table');
        table.innerHTML = '';
        
        for (var name in options.fields[tabId]) {

            addRow();

            var addRowButton = table.lastElementChild.querySelector('button');
            addRowButton.innerText = '-';
            addRowButton.onclick = removeRow;

            var fieldNameInput = table.lastElementChild.querySelector('input[name="field_name"]');
            fieldNameInput.value = name;

            var fieldValueTextArea = table.lastElementChild.querySelector('textarea[name="field_values"]');
            fieldValueTextArea.removeAttribute("hidden");
            fieldValueTextArea.value = options.fields[tabId][name].Values?.join('\r\n') || {};
            fieldValueTextArea.style.height = fieldValueTextArea.scrollHeight+'px';
        }
        
        addRow();
    });
}

function updateOptions()
{
    chrome.storage.local.get('options', (data) =>
    {
        var options = Object.assign({}, data.options);
        var oldOptions = JSON.parse(JSON.stringify(options));

        var tab = document.querySelector('.tab.active').id;
        options.fields[tab] = {};
        
        let fieldRows = document.querySelectorAll('#field_table tr');
        for (let row of fieldRows)
        {
            let fieldName = row.querySelector("[name=field_name]");
            let fieldValues = row.querySelector("[name=field_values]");
            if (fieldName.value == "")
                continue;
    
            fieldName.value = fieldName.value.toLowerCase();
            
            enabled = false;
            if (oldOptions.fields[tab][fieldName.value] != undefined)
                enabled = oldOptions.fields[tab][fieldName.value].Enabled
    
            options.fields[tab][fieldName.value] = { Enabled: enabled, Values: fieldValues.value.split(/\r?\n/).filter(l => l.length != 0) };
        }
        
        chrome.storage.local.set({options}, () =>
        {
            chrome.runtime.sendMessage("reload");
        });
    });
}

function addRow()
{
    var table = document.querySelector('#field_table');
    var template = document.querySelector('#new_row_template');
    var clone = template.content.cloneNode(true);
    clone.querySelector('button').onclick = function() {
        this.innerText = '-';
        this.onclick = removeRow;
        addRow();
    }
    table.appendChild(clone);

    var fieldNameInput = table.lastElementChild.querySelector('input[name="field_name"]');
    if (fieldNameInput != null)
    {
        fieldNameInput.removeAttribute("hidden");
        fieldNameInput.onkeyup = updateOptions;
    }

    var fieldValuesInput = table.lastElementChild.querySelector('textarea[name="field_values"]');
    if (fieldValuesInput != null)
    {
        fieldValuesInput.removeAttribute("hidden");
        fieldValuesInput.onkeyup = updateOptions;
    }
}

function removeRow(event)
{
    event.target.parentElement.parentElement.remove();
    updateOptions();
}
