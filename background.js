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

chrome.webRequest.onBeforeSendHeaders.addListener(beforeSendHeaders, { urls: [ "<all_urls>"] }, extraInfoSpec);

function beforeSendHeaders(e) 
{
  for (let name in options.headers) 
  {
    var to_modify = options.headers[name];
    if (!to_modify.Enabled)
      continue;

    var randomValue = to_modify.Values[Math.floor(Math.random() * to_modify.Values.length)];

    randomValue = interpolate(e, randomValue)

    let found = false;
    for (let header of e.requestHeaders) 
    {
      if (header.name.toLowerCase() === name.toLowerCase()) 
      {
        header.value = randomValue;
        found = true;
      }
    }

    if (!found)
    {
      e.requestHeaders.push(
        { 
          "name": name, 
          "value": randomValue
        });
    }
  }
  return { requestHeaders: e.requestHeaders };
}

function interpolate(e, value)
{
  var base64Sub = window.btoa(e.url.substring(0, 145)).replaceAll("=", "");
  var chunks = base64Sub.match(/.{1,62}/g) ?? [];
  var base64url = chunks.join('.');
  
  return value
  .replace("{BASE64URL}", base64url)
  .replace("{DOCUMENT_URL}", e.documentUrl)
  .replace("{UNIXTIME}", Date.now())
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
