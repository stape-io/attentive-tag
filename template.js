const sendHttpRequest = require('sendHttpRequest');
const JSON = require('JSON');
const makeTableMap = require('makeTableMap');
const getRequestHeader = require('getRequestHeader');
const getAllEventData = require('getAllEventData');

const logToConsole = require('logToConsole');
const getContainerVersion = require('getContainerVersion');
const containerVersion = getContainerVersion();
const isDebug = containerVersion.debugMode;
const isLoggingEnabled = determinateIsLoggingEnabled();
const traceId = getRequestHeader('trace-id');

const eventData = getAllEventData();
const requestUrl = generateRequestUrl();
const requestHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer ' + data.apiKey
};
const eventName = data.eventType === 'custom' ? data.customEvent : data.eCommerceEvent;
const postBody = generatePostBody();

if (isLoggingEnabled) {
    logToConsole(JSON.stringify({
        'Name': 'Attentive',
        'Type': 'Request',
        'TraceId': traceId,
        'EventName': eventName,
        'RequestMethod': 'POST',
        'RequestUrl': requestUrl,
        'RequestBody': postBody,
    }));
}

sendHttpRequest(requestUrl, (statusCode, headers, body) => {
    if (isLoggingEnabled) {
        logToConsole(JSON.stringify({
            'Name': 'Attentive',
            'Type': 'Response',
            'TraceId': traceId,
            'EventName': eventName,
            'ResponseStatusCode': statusCode,
            'ResponseHeaders': headers,
            'ResponseBody': body,
        }));
    }

    if (statusCode >= 200 && statusCode < 300) {
        data.gtmOnSuccess();
    } else {
        data.gtmOnFailure();
    }
}, {headers: requestHeaders, method: 'POST'}, JSON.stringify(postBody));

function determinateIsLoggingEnabled() {
    if (!data.logType) {
        return isDebug;
    }

    if (data.logType === 'no') {
        return false;
    }

    if (data.logType === 'debug') {
        return isDebug;
    }

    return data.logType === 'always';
}

function generateRequestUrl() {
    const url = 'https://api.attentivemobile.com/v1/events/';

    if (data.eventType === 'custom') {
        return url + 'custom';
    }

    if (data.eCommerceEvent === 'ProductView') {
        return url + 'ecommerce/product-view';
    }

    if (data.eCommerceEvent === 'addToCart') {
        return url + 'ecommerce/add-to-cart';
    }

    return url + 'ecommerce/purchase';
}

function generatePostBody() {
    const postBody = {
        user: {}
    };

    if (data.phone) postBody.user.phone = data.phone;
    if (data.email) postBody.user.email = data.email;

    if (data.eventType === 'custom') {
        postBody.type = data.customEvent;

        if (data.customProperties) {
            postBody.properties = makeTableMap(data.customProperties, 'name', 'value');
        }

        return postBody;
    }


    if (eventData.items) {
        postBody.items = [];

        eventData.items.forEach((d) => {
            let content = {};

            if (d.item_id) content.productId = d.item_id;
            if (d.item_variant) content.productVariantId = d.item_variant;
            if (d.item_name) content.name = d.item_name;
            if (d.item_image) content.productImage = d.item_image;
            if (d.item_url) content.productUrl = d.item_url;
            if (d.quantity) content.quantity = d.quantity;

            if (d.price) {
                content.price = {value: d.price};

                if (eventData.currency) content.price.currency = eventData.currency;
                if (d.currency) content.price.currency = d.currency;
                content.price = [content.price];
            }

            postBody.items.push(content);
        });
    }

    return postBody;
}
