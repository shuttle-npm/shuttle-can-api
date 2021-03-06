import $ from 'jquery';
import { DefineMap, DefineList, Reflect } from 'can';
import guard from 'shuttle-guard';

export const ValueMap = DefineMap.extend({
    value: {
        type: '*'
    }
});

export const Options = DefineMap.extend({
    url: {
        type: 'string',
        default: '',
        get(value) {
            if (!value) {
                throw new Error('Use `import {options} from \'shuttle-can-api\';` to get the options and then set the api endpoint url `options.url = \'http://server-endpoint\';`.');
            }

            return value + (!value.endsWith('/') ? '/' : '');
        }
    }
});

export let options = new Options({});

let parameterExpression = /\{.*?\}/g;

let Api = DefineMap.extend(
    'Api',
    {
        endpoint: {
            type: 'string',
            default: ''
        },

        cache: {
            type: 'boolean',
            default: false
        },

        Map: {
            type: '*'
        },

        List: {
            type: '*'
        },

        _call(options) {
            return new Promise((resolve, reject) => {
                try {
                    const o = options || {};
                    const parsedEndpoint = this.parseEndpoint(this.endpoint, o.parameters);
                    const ajax = {
                        url: parsedEndpoint.url,
                        type: o.method,
                        async: true,
                        beforeSend: o.beforeSend,
                        timeout: o.timeout || 60000
                    };

                    if (o.method.toLowerCase() === 'get') {
                        ajax.cache = this.cache;
                    }

                    if (!!o.data) {
                        ajax.data = JSON.stringify(o.data || {});
                        ajax.contentType = 'application/json';
                    }

                    $.ajax(ajax)
                        .done(function (response) {
                            resolve(typeof (response) === 'string' ? response.trim() !== '' ? eval('(' + response + ')') : undefined : response);
                        })
                        .fail(function (jqXHR, textStatus, errorThrown) {
                            reject(new Error(errorThrown));
                        });
                } catch (e) {
                    reject(e);
                }
            });
        },

        parseEndpoint(endpoint, parameters) {
            guard.againstUndefined(endpoint, 'endpoint');

            const p = parameters || {};
            const params = [];
            let match;

            do {
                match = parameterExpression.exec(endpoint);

                if (match) {
                    const name = match[0];

                    if (name.length < 3) {
                        throw new Error($
                            `Endpoint '{endpoint}' contains parameter '{name}' that is not at least 3 characters in length.`);
                    }

                    params.push({
                        name: name.substr(1, name.length - 2),
                        index: match.index
                    });
                }
            } while (match);

            var url;

            if (endpoint.indexOf('http') < 0) {
                if (!this.endpoint) {
                    throw new Error('No \'endpoint\' has been specified.  You either need to use a full url (starting with http/https) or specify the endpoint when instantiating the api: new Api({ endpoint: \'users\' });');
                }

                url = options.url + endpoint;
            }
            else {
                url = endpoint;
            }

            Reflect.each(params,
                function (param) {
                    url = url.replace(`{${param.name}}`, !!p[param.name] ? p[param.name] : '');
                });

            return {
                url: url,
                parameters: params
            };
        },

        post(data, parameters) {
            guard.againstUndefined(data, 'data');

            return new Promise((resolve, reject) => {
                try {
                    const self = this;

                    this._call({
                        data: data,
                        parameters: parameters,
                        method: 'POST'
                    })
                        .then(
                            function (response) {
                                resolve(response);
                            },
                            function (error) {

                                reject(new Error(error));
                            });
                }
                catch (e) {
                    reject(e);
                }
            });
        },

        put(data, parameters) {
            guard.againstUndefined(data, 'data');

            return new Promise((resolve, reject) => {
                try {
                    const self = this;

                    this._call({
                        data: data,
                        parameters: parameters,
                        method: 'PUT'
                    })
                        .then(function (response) {
                            resolve(response);
                        })
                        .catch(function (error) {
                            reject(new Error(error));
                        });
                }
                catch (e) {
                    reject(e);
                }
            });
        },

        map(parameters) {
            const self = this;

            return new Promise((resolve, reject) => {
                try {
                    const self = this;

                    this._call({
                        method: 'GET',
                        parameters: parameters
                    })
                        .then(function (response) {
                            var data;
                            var result;

                            if (!response) {
                                reject(new Error('No response received.'));
                                return;
                            }

                            data = response.data || response;

                            if (typeof (data) == 'object') {
                                result = !!self.Map
                                    ? new self.Map(data)
                                    : new DefineMap(data);
                            } else {
                                result = new ValueMap({
                                    value: data
                                });
                            }

                            resolve(result);
                        })
                        .catch(function (error) {
                            reject(new Error(error));
                        });
                }
                catch (e) {
                    reject(e);
                }
            });
        },

        list(parameters, options) {
            const o = options || {};

            return new Promise((resolve, reject) => {
                try {
                    const self = this;
                    var callOptions =
                        !!o.post
                            ? {
                                method: 'POST',
                                data: parameters,
                                parameters: o.parameters
                            }
                            : {
                                method: 'GET',
                                parameters: parameters
                            };

                    this._call(callOptions)
                        .then(function (response) {
                            if (!response) {
                                reject(new Error('No response received.'));
                                return;
                            }

                            var data = response.data || response;
                            var result;

                            if (!!self.List) {
                                result = new self.List(data);
                            }
                            else {
                                result = new DefineList();

                                Reflect.each(data,
                                    (item) => {
                                        result.push(!!self.Map
                                            ? new self.Map(item)
                                            : new DefineMap(item));
                                    });
                            }

                            resolve(result);
                        })
                        .catch(function (error) {
                            reject(new Error(error));
                        });
                }
                catch (e) {
                    reject(e);
                }
            });
        },

        'delete'(parameters, data) {
            return new Promise((resolve, reject) => {
                try {
                    const self = this;

                    this._call({
                        method: 'DELETE',
                        parameters: parameters,
                        data: data
                    })
                        .then(function (response) {
                            resolve(response);
                        })
                        .catch(function (error) {
                            reject(new Error(error));
                        });
                }
                catch (e) {
                    reject(e);
                }
            });
        }
    }
);

export default Api;