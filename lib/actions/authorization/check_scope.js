'use strict';

const _ = require('lodash');
const errors = require('../../helpers/errors');
const instance = require('../../helpers/weak_cache');
/*
 * Validates that all requested scopes are supported by the provider, that openid is amongst them
 * and that offline_access prompt is requested together with consent scope
 *
 * @throws: invalid_request
 */
module.exports = provider => function* checkScope(next) {
  const scopes = _.intersection(this.oidc.params.scope.split(' '), instance(provider).configuration('scopes'));
  const responseType = this.oidc.params.response_type;
  const prompts = this.oidc.prompts;

  this.assert(scopes.indexOf('openid') !== -1,
    new errors.InvalidRequestError('openid is required scope'));

  /*
   * Upon receipt of a scope parameter containing the offline_access value, the Authorization Server
   *
   * MUST ensure that the prompt parameter contains consent
   * MUST ignore the offline_access request unless the Client is using a response_type value that
   *  would result in an Authorization Code being returned,
   */

  if (scopes.indexOf('offline_access') !== -1) {
    if (!responseType.includes('code') || prompts.indexOf('consent') === -1) {
      _.pull(scopes, 'offline_access').join(' ');
    }
  }

  this.oidc.params.scope = scopes.join(' ');


  yield next;
};
