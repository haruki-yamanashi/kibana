/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { Dispatch } from 'redux';
import { userNavigated } from '../concerns/routing';

/**
 * This must be used for `withPageNavigationStatus`
 */
// TODO: type actionsAndState
export async function routingSaga({
  dispatch,
  actionsAndState,
}: {
  dispatch: Dispatch;
  actionsAndState: any;
}) {
  window.addEventListener('popstate', emit);
  emit();

  for await (const { action } of actionsAndState()) {
    if (action.type === 'LOCATION_CHANGE' && action.payload.action !== 'POP') {
      emit();
    }
  }

  function emit() {
    dispatch(userNavigated(window.location.href));
  }
}

// TODO: Type actionsAndState and isOnPage
export async function* withPageNavigationStatus({
  actionsAndState,
  isOnPage = function() {
    return false;
  },
}: {
  actionsAndState: any;
  isOnPage: (href: any) => boolean;
}) {
  // TODO: do we need userIsLoggedIn?
  let userIsOnPage = false;
  const userIsLoggedIn = true;
  let href = null;
  for await (const { action, state } of actionsAndState()) {
    // TODO: ignore location_change action?
    if (action.type === 'LOCATION_CHANGE') {
      continue;
    }
    const userWasLoggedIn = userIsLoggedIn;
    const userWasOnPageAndLoggedIn = userIsOnPage && userIsLoggedIn;
    const oldHref = href;
    href = hrefFromState(state);
    if (href !== null) {
      userIsOnPage = isOnPage(href);
    }
    const userIsOnPageAndLoggedIn = userIsOnPage && userIsLoggedIn;

    yield {
      action,
      state,
      href,
      previousHref: oldHref,

      // indicates whether the href changed since the last action
      hrefChanged: href !== oldHref,

      authenticationStatusChanged: userWasLoggedIn !== userIsLoggedIn,

      // indicates whether the user is on the page defined by `path` and logged in
      userIsOnPageAndLoggedIn,

      // `true` if `userIsOnPageAndLoggedIn` just became true for this action.
      shouldInitialize: userIsOnPageAndLoggedIn && userWasOnPageAndLoggedIn === false,
    };
  }
}

// TODO: type this properly, Should we use immutable?
function hrefFromState(state: any) {
  return state.saga;
}
