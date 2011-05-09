/*!
 * Redback
 * Copyright(c) 2011 Chris O'Hara <cohara87@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var redis = require('redis'),
    Structure = require('./Structure'),
    Channel = require('./Channel').Channel,
    Cache = require('./Cache').Cache;

/**
 * Define the available structures.
 */

var base = ['Hash','List','Set','SortedSet','Bitfield'],
    advanced = ['KeyPair','DensitySet','CappedList','SocialGraph'];

/**
 * The Redback object wraps the Redis client and acts as a factory
 * for structures.
 *
 * @param {string} host (optional)
 * @param {int} port (optional)
 * @param {Object} options (optional)
 * @api public
 */

var Redback = exports.Redback = function (host, port, options) {
    this.client = redis.createClient.apply(this, arguments);
    this.namespace = '';
    if (typeof options === 'object') {
        this.namespace = options.namespace || '';
    }
}

/**
 * Make a structure available to the client.
 *
 * @param {string} name
 * @param {Function|Object} Structure
 * @api private
 */

Redback.prototype.addStructure = function (name, obj) {
    if (typeof obj !== 'function') {
        obj = Structure.new(obj);
    }
    exports[name] = obj;
    Redback.prototype['create' + name] = function (key) {
        var init_args = Array.prototype.slice.call(arguments, 1);
        return new obj(this.client, key, this.namespace, init_args);
    }
}

/**
 * Create a new Cache.
 *
 * @param {string} namespace (optional)
 * @return Cache
 * @api public
 */

Redback.prototype.createCache = function (namespace) {
    namespace = namespace || 'cache';
    if (this.namespace.length) {
        namespace = this.namespace + ':' + namespace;
    }
    return new Cache(this.client, namespace);
}

/**
 * Create a new Channel.
 *
 * @param {string} channel - the channel name
 * @return Channel
 * @api public
 */

Redback.prototype.createChannel = function (channel) {
    if (this.namespace.length) {
        channel = this.namespace + ':' + channel;
    }
    return new Channel(this.client, channel);
}

/**
 * Send a (BG)SAVE command to Redis.
 *
 * @param {string} background (optional - default is false)
 * @param {Function} callback
 * @return this
 * @api public
 */

Redback.prototype.save = function (background, callback) {
    if (typeof background === 'function') {
        callback = background;
        this.client.save(callback);
    } else {
        this.client.bgsave(callback);
    }
    return this;
}

/**
 * Creating a new Redback client.
 *
 * @param {string} host (optional)
 * @param {int} port (optional)
 * @param {Object} options (optional)
 * @api public
 */

exports.createClient = function (host, port, options) {
    return new Redback(host, port, options);
}

/**
 * Add the base structures from ./base_structures
 */

base.forEach(function (structure) {
    Redback.prototype.addStructure(structure, require('./base_structures/' + structure)[structure]);
});

/**
 * Add the advanced structures from ./advanced_structures
 */

advanced.forEach(function (structure) {
    Redback.prototype.addStructure(structure, require('./advanced_structures/' + structure)[structure]);
});

/**
 * Redis constants.
 */

Redback.prototype.INF  = exports.INF = '+inf';
Redback.prototype.NINF = exports.NINF = '-inf';

/**
 * Export prototypes so that they can be extended.
 */

exports.Client = redis.RedisClient;
exports.Structure = Structure.Structure;
exports.Cache = Cache;
exports.Channel