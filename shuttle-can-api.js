import $ from 'jquery';
import DefineMap from 'can-define/map/';
import DefineList from 'can-define/list/';
import loader from '@loader';
import guard from 'shuttle-guard';
import each from 'can-util/js/each/';

const _defaultUrlProvider = {
    url: function () {
        throw new Error('Use `import {options} from \'shuttle-can-api\';` to get the options call `options.wire(provider)` where `provider` should contain a function `url` that returns the base web-api url.')
    }
};

export const Options = DefineMap.extend({
    _provider: {
        value: _defaultUrlProvider
    },
    wire: function (provider) {
        if (!provider) {
            this._provider = _defaultUrlProvider;
            return;
        }

        if (!provider.url || typeof(provider.url) !== 'function') {
            throw new Error('The `url provider` adapter has to have a `url` function that returns the url to the base web-api.')
        }

        this._provider = provider;
    },

    url: function () {
        return this._provider.url();
    }
});

export let options = new Options({});

let parameterExpression = /\{.*?\}/g;

let Api = DefineMap.extend(
    'Api',
    {
        options: {value: {}},
        working: {type: 'boolean', value: false},

        init(options) {
            guard.againstUndefined(options, 'options');

            this.options = (typeof options === 'string' || options instanceof String)
                ? {endpoint: options}
                : options;

            guard.againstUndefined(this.options.endpoint, 'options.endpoint');

            if (!this.options.cache) {
                this.options.cache = false;
            }
        },

        _call(options) {
            return new Promise((resolve, reject) => {
                try {
                    const o = options || {};
                    const parsedEndpoint = this.parseEndpoint(this.options.endpoint, o.parameters);
                    const ajax = {
                        url: parsedEndpoint.url,
                        type: o.method,
                        async: true,
                        beforeSend: o.beforeSend,
                        timeout: o.timeout || 60000
                    };

                    switch (o.method.toLowerCase()) {
                        case 'get': {
                            ajax.cache = this.options.cache;
                            ajax.dataType = 'json';
                            break;
                        }
                        case 'post':
                        case 'put': {
                            ajax.data = JSON.stringify(o.data || {});
                            ajax.contentType = 'application/json';
                            break;
                        }
                    }

                    $.ajax(ajax)
                        .done(function (response) {
                            resolve(response);
                        })
                        .fail(function (jqXHR, textStatus, errorThrown) {
                            reject(errorThrown);
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
                url = options.url();

                url = url + (!url.endsWith('/') ? '/' : '') + endpoint;
            }
            else {
                url = endpoint;
            }

            each(params,
                function (param) {
                    url = url.replace(`{${param.name}}`, !!p[param.name] ? p[param.name] : '');
                });

            return {
                url: url,
                parameters: params
            };
        },

        post(data) {
            guard.againstUndefined(data, 'data');

            return new Promise((resolve, reject) => {
                try {
                    const self = this;
                    this.working = true;

                    this._call({
                        data: data,
                        method: 'POST'
                    })
                        .then(
                            function (response) {
                                self.working = false;

                                resolve(response);
                            },
                            function (error) {
                                self.working = false;

                                reject(error);
                            });
                }
                catch (e) {
                    reject(e);
                }
            });
        },

        put(data) {
            guard.againstUndefined(data, 'data');

            return new Promise((resolve, reject) => {
                try {
                    const self = this;
                    this.working = true;

                    this._call({
                        data: data,
                        method: 'POST'
                    })
                        .then(function (response) {
                            self.working = false;

                            resolve(response);
                        })
                        .catch(function (error) {
                            self.working = false;

                            reject(error);
                        });
                }
                catch (e) {
                    reject(e);
                }
            });
        },

        item(parameters) {
            const self = this;
            this.working = true;

            return new Promise((resolve, reject) => {
                try {
                    const self = this;
                    this.working = true;

                    this._call({
                        method: 'GET',
                        parameters: parameters
                    })
                        .then(function (response) {
                            self.working = false;

                            resolve(!!self.options.Map
                                ? new self.options.Map(response)
                                : new DefineMap(response));
                        })
                        .catch(function (error) {
                            self.working = false;

                            reject(error);
                        });
                }
                catch (e) {
                    reject(e);
                }
            });
        },

        list(parameters) {
            const self = this;
            this.working = true;

            return new Promise((resolve, reject) => {
                try {
                    const self = this;
                    this.working = true;

                    this._call({
                        method: 'GET',
                        parameters: parameters
                    })
                        .then(function (response) {
                            self.working = false;

                            if (!response.data) {
                                return response;
                            }

                            const result = !!self.options.List
                                ? new self.options.List()
                                : new DefineList();

                            each(response.data,
                                (item) => {
                                    result.push(!!self.options.Map
                                        ? new self.options.Map(item)
                                        : new DefineMap(item));
                                });

                            resolve(result);
                        })
                        .catch(function (error) {
                            self.working = false;

                            reject(error);
                        });
                }
                catch (e) {
                    reject(e);
                }
            });
        },

        'delete'(parameters) {
            guard.againstUndefined(parameters, 'parameters');

            const self = this;
            this.working = true;

            return new Promise((resolve, reject) => {
                try {
                    const self = this;
                    this.working = true;

                    this._call({
                        method: 'DELETE',
                        parameters: parameters
                    })
                        .then(function (response) {
                            self.working = false;

                            resolve(response);
                        })
                        .catch(function (error) {
                            self.working = false;

                            reject(error);
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