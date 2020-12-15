import { combineReducers } from '@reduxjs/toolkit';
import * as TodoModule from './todoDomain';
import { connectRouter } from 'connected-react-router';
import { History } from 'history';

const createRootReducer = (history: History) => {
    const rootReducer = combineReducers({
        todoReducer: TodoModule.reducer,
        router: connectRouter(history),
    });

    return rootReducer;
};

export default createRootReducer;

export const reduxActions = {
    todoAction: { ...TodoModule.actions },
};
