import store, { rootReducer } from '.';

export interface Todo {
    id: number; // should be unique and auto-increment
    title: string;
    body: string; // markdown text
    completed?: boolean;
}

export enum NetworkFetchState {
    loading,
    error,
    success,
}

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
