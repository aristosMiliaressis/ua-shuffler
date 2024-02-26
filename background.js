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

optionsUpdated();

function beforeRequest(e) {
  let scopeRegex = new RegExp(options.scope)
  if (e.url.match(scopeRegex) == null || Object.getOwnPropertyNames(options.fields.query).length == 0) {
    return { cancel: false };
  }
  
  let url = new URL(e.url);
  let urlParams = new URLSearchParams(url.search);

  for (let name in options.fields.query) {
    var to_modify = options.fields.query[name];
    if (!to_modify.Enabled)
      continue;

    var randomValue = to_modify.Values[Math.floor(Math.random() * to_modify.Values.length)];

    randomValue = interpolate(e, randomValue, undefined, undefined)

    urlParams.set(name, randomValue)
  }
  url.search = urlParams.toString()
  
  return {"redirectUrl": url.toString()};
}

function beforeSendHeaders(e) {
  let scopeRegex = new RegExp(options.scope)
  if (e.url.match(scopeRegex) == null) {
    return { requestHeaders: e.requestHeaders };
  }
  
  var cookie = "", referer, origin = "";
  for (const header of e.requestHeaders) {
    if (header.name.toLowerCase() === "referer") {
      referer = header.value;
    } else if (header.name.toLowerCase() === "origin") {
      origin = header.value;
    } else if (header.name.toLowerCase() === "cookie") {
      cookie = header.value;
    }
  }
  
  for (let name in options.fields.cookies) {
    var to_modify = options.fields.cookies[name];
    if (!to_modify.Enabled)
      continue;
    
      var randomValue = to_modify.Values[Math.floor(Math.random() * to_modify.Values.length)];

      randomValue = interpolate(e, randomValue, referer, origin)
      
      let found = false;
      for (let header of e.requestHeaders) 
      {
        if (header.name.toLowerCase() === "cookie") 
        {
          header.value += ";" + name +"="+ randomValue;
          found = true;
        }
      }

      if (!found)
      {
        e.requestHeaders.push(
          { 
            "name": "cookie", 
            "value": name+"="+randomValue
          });
      }
  }
    
  for (let name in options.fields.headers) {
    var to_modify = options.fields.headers[name];
    if (!to_modify.Enabled)
      continue;

    var randomValue = to_modify.Values[Math.floor(Math.random() * to_modify.Values.length)];

    randomValue = interpolate(e, randomValue, referer, origin)

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

function interpolate(e, value, referer, origin)
{
  var base64Sub = base32.encode(e.url.replace("http://", "").replace("https://", ""));
  if (base64Sub != undefined) {
    base64Sub = base64Sub.replaceAll("=", "").match(/.{1,63}/g)[0];
  }
  
  var normalizedUrl = e.url.substring(0, e.url.indexOf("?") == -1 ? 63 : e.url.indexOf("?"))
      .replace("http://", "")
      .replace("https://", "")
      .replaceAll('.', '-')
      .replaceAll('/', '_')
      .match(/.{1,63}/g)[0]

  while (normalizedUrl.endsWith('-') || normalizedUrl.endsWith('_')) {
    normalizedUrl = normalizedUrl.substring(0, normalizedUrl.length-1);
  }
  
  return value
      .replace("{{URL}}", e.url)
      .replace("{{BASE32_URL_PREFIX}}", base64Sub)
      .replace("{{NORMALIZED_URL}}", normalizedUrl)
      .replace("{{DOCUMENT_URL}}", e.documentUrl)
      .replace("{{ORIGIN_URL}}", e.originUrl)
      .replace("{{INITIATOR_URL}}", e.initiator)
      .replace("{{REFERER_HEADER}}", referer)
      .replace("{{ORIGIN_HEADER}}", origin)
      .replace("{{UNIXTIME}}", Date.now())
}

function optionsUpdated() 
{
  chrome.storage.local.get('options', (data) => {
    options = Object.assign({}, data.options);

    chrome.webRequest.onBeforeSendHeaders.removeListener(beforeSendHeaders);
    if (Object.keys(options.fields.headers).filter(k => !options.fields.headers[k].Disabled)) {  
      chrome.webRequest.onBeforeSendHeaders.addListener(beforeSendHeaders, { urls: [ "<all_urls>"] }, extraInfoSpec);
    }
    
    chrome.webRequest.onBeforeRequest.removeListener(beforeRequest);
    if (Object.keys(options.fields.query).filter(k => !options.fields.query[k].Disabled)) {  
      chrome.webRequest.onBeforeRequest.addListener(beforeRequest,  {"urls":["http://*/*","https://*/*"]}, ["blocking"]);
    }
  });
}

var base32 = {
    a: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
    pad: "=",
    encode: function (s) {
        var a = this.a;
        var pad = this.pad;
        var len = s.length;
        var o = "";
        var w, c, r=0, sh=0;
        for(var i=0; i<len; i+=5) {
            // mask top 5 bits
            c = s.charCodeAt(i);
            w = 0xf8 & c;
            o += a.charAt(w>>3);
            r = 0x07 & c;
            sh = 2;

            if ((i+1)<len) {
                c = s.charCodeAt(i+1);
                // mask top 2 bits
                w = 0xc0 & c;
                o += a.charAt((r<<2) + (w>>6));
                o += a.charAt( (0x3e & c) >> 1 );
                r = c & 0x01;
                sh = 4;
            }

            if ((i+2)<len) {
                c = s.charCodeAt(i+2);
                // mask top 4 bits
                w = 0xf0 & c;
                o += a.charAt((r<<4) + (w>>4));
                r = 0x0f & c;
                sh = 1;
            }

            if ((i+3)<len) {
                c = s.charCodeAt(i+3);
                // mask top 1 bit
                w = 0x80 & c;
                o += a.charAt((r<<1) + (w>>7));
                o += a.charAt((0x7c & c) >> 2);
                r = 0x03 & c;
                sh = 3;
            }

            if ((i+4)<len) {
                c = s.charCodeAt(i+4);
                // mask top 3 bits
                w = 0xe0 & c;
                o += a.charAt((r<<3) + (w>>5));
                o += a.charAt(0x1f & c);
                r = 0;
                sh = 0;
            } 
        }
        // Calculate length of pad by getting the 
        // number of words to reach an 8th octet.
        if (r!=0) { o += a.charAt(r<<sh); }
        var padlen = 8 - (o.length % 8);
        // modulus 
        if (padlen==8) { return o; }
        if (padlen==1) { return o + pad; }
        if (padlen==3) { return o + pad + pad + pad; }
        if (padlen==4) { return o + pad + pad + pad + pad; }
        if (padlen==6) { return o + pad + pad + pad + pad + pad + pad; }
    }
};
