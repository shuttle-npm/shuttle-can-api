# shuttle-can-api

Provides a mechanism to interact with your web/rest api.

## Installation

```
npm install shuttle-can-api
```

## Options

### url

You can set a default base url for all your calls; this url can be overridden in individual call by using a full url that start with `http|https`.

```javascript
import {options} from 'shuttle-can-api';
``` 

Once you have retrieved the `options` you set the values:

```javascript
options.url = 'http://endpoint';
```

## Instantiation

You need to access the `Api` and create an instance for the relevant endpoint that you will be using.  Since this is a `DefineMap` you instance using an object to set the attributes:

```javascript
var api = new Api({endpoint: 'users'});
```

The above would append `users` to the `options.url` in order to obtain the full url to interact with.

```javascript
var api = new Api({endpoint: 'http://another-location/users'});
```

The above already has the full url to interact with so the `options.url` would not be used.

Other options that you can set are:

### Options

```javascript
var api = new Api({
        endpoint: 'http://another-location/users',
        cache: true|false,
        Map: DefineMap,
        List: DefineList
    });
```

#### cache

By default caching is disabled for all calls.

#### Map

If you'd like responses to coerce individual objects to a specific `DefineMap` you can set it in the `Map` attribute.

#### List

To change an entire list into a specific `DefineList` you can specify it using the `List` attribute. 

## Usage

### parseEndpoint(endpoint, parameters)

Although this method would typically not be called directly it is used in other calls to get the full url to use in the ajax call.

The `parameters` is an object that contains the parameter values that should be named as they are in the `endpoint`.

For instance, an endpoint such as `users/{action}/{id}` would require a `parameter` object such as this:

```javascript
{
    id: 1,
    action: 'disable'
}
``` 

This would result in the endpoint parsed to `users/disable/1`.

### list(parameters)

Returns a promise that will resolve to a `DefineList` or the specified `List` attribute:

```javascript
api.list()
    .then(function (list) {
        list.ForEach(function(item) {
           // do something 
        });
    })
```

### item(parameters)

Returns a promise that will resolve to a `DefineMap` or the specified:

```javascript
api.item({id: 2})
    .then(function (item) {
        // do something
    })
```

### post(data, parameters)

Send data to the endpoint.

```javascript
api.post({ message: 'success' })
    .then(function (response) {
        // do something
    });
```

### put(data, parameters)

Replaces data on the endpoint.

```javascript
api.put({ message: 'success' }, { id: 2 })
    .then(function (response) {
        // do something
    });
```

### delete(parameters)

Removes the request resource.

```javascript
api.delete({id: 2})
    .then(function (response) {
        // do something
    });
```