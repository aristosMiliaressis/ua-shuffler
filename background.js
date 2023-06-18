"use strict";

let options;

// need to have "extraHeaders" option for chrome https://developer.chrome.com/extensions/webRequest#life_cycle_footnote
const extraInfoSpec = (navigator.userAgent.toLowerCase().indexOf("chrome") !== -1)
                  ? ["blocking", "requestHeaders", "extraHeaders"]
                  : ["blocking", "requestHeaders"];

chrome.storage.local.get(['options'], function (result) 
{
  options = result.options;

  chrome.runtime.onMessage.addListener(optionsUpdated);
});

function beforeSendHeaders(e) 
{
  for (let key in options) 
  {
    console.log(JSON.stringify(options))
    var to_modify = options[key];
    if (to_modify.Disabled)
      continue;

    var randomValue = to_modify.HeaderValues[Math.floor(Math.random() * to_modify.HeaderValues.length)];

    let found = false;
    for (let header of e.requestHeaders) 
    {
      if (header.name.toLowerCase() === to_modify.HeaderName.toLowerCase()) 
      {
        header.value = randomValue;
        found = true;
      }
    }

    if (!found)
    {
      e.requestHeaders.push(
        { 
          "name": to_modify.HeaderName, 
          "value": randomValue
        });
    }
  }
  return { requestHeaders: e.requestHeaders };
}

function optionsUpdated(message) 
{
  chrome.storage.local.get(['options'], function (result) 
  {
    options = result.options;
    
    chrome.webRequest.onBeforeSendHeaders.removeListener(beforeSendHeaders);
    if (Object.keys(options).filter(k => !options[k].Disabled))
      chrome.webRequest.onBeforeSendHeaders.addListener(beforeSendHeaders, { urls: [ "<all_urls>"] }, extraInfoSpec);
  });
}
