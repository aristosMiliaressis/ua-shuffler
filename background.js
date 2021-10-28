"use strict";

let options;
const isChrome = (navigator.userAgent.toLowerCase().indexOf("chrome") !== -1);

chrome.storage.local.get(['options'], function (result) 
{
  options = result.options;

  addListener();
});


function rewriteRequestHeader(e) 
{
  for (let key in options) 
  {
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

function updateOptions(message) 
{
  chrome.storage.local.get(['options'], function (result) 
  {
    options = result.options;
    removeListener();
      if (Object.keys(options).filter(k => !options[k].Disabled))
        addListener();
  });
}

function addListener() 
{
  // need to have "extraHeaders" option for chrome https://developer.chrome.com/extensions/webRequest#life_cycle_footnote
  var extraInfoSpec = isChrome
                    ? ["blocking", "requestHeaders", "extraHeaders"]
                    : ["blocking", "requestHeaders"];

  chrome.webRequest.onBeforeSendHeaders.addListener(rewriteRequestHeader, { urls: [ "<all_urls>"] }, extraInfoSpec);

  chrome.runtime.onMessage.addListener(updateOptions);
}

function removeListener() 
{
  chrome.webRequest.onBeforeSendHeaders.removeListener(rewriteRequestHeader);
}
