import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import { routerMiddleware } from 'connected-react-router';
import createRootReducer, { reduxActions } from './redux';
import { createHashHistory } from 'history';

// used for react router and router dispatch
// we use hash routing here, but it can work with any other history methods
export const history = createHashHistory();

// export this to enable static typings
export const rootReducer = createRootReducer(history);

// configure the redux store and middleware so it can be exported
const store = configureStore({
    reducer: rootReducer,
    middleware: [...getDefaultMiddleware(), routerMiddleware(history)],
});

if (process.env.NODE_ENV === 'development') {
    module.hot?.accept('./redux', () => {
        const newRootReducer = require('./redux').default(history);
        store.replaceReducer(newRootReducer);
    });
}

export default store;
export * from './model';
export const storeActions = reduxActions;
