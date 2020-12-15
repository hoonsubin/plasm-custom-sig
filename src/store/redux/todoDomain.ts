import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Todo } from '..';

const todoSlice = createSlice({
    name: 'todo',
    initialState: [
        {
            id: 0,
            title: 'hello world',
            body: 'hello world from body',
            completed: false,
        },
    ] as Todo[],
    reducers: {
        newItem(state, action: PayloadAction<Todo>) {
            const { title, body } = action.payload;
            // increment the item id here
            const id = state.length + 1;
            state.push({ id, title, body, completed: false });
        },
        remove(state, action: PayloadAction<Todo>) {
            const { id } = action.payload;

            return state.filter((i) => i.id !== id);
        },
        edit(state, action: PayloadAction<Todo>) {
            const newItem = action.payload;
            const currentItemIndex = state.findIndex((i) => i.id === newItem.id);

            if (currentItemIndex >= 0) state[currentItemIndex] = newItem;
        },
        toggleCompleted(state, action: PayloadAction<number>) {
            const todo = state.find((i) => i.id === action.payload);
            if (todo) {
                todo.completed = !todo.completed;
            }
        },
    },
});

// export the actions
export const actions = todoSlice.actions;

// export the reducer
export const reducer = todoSlice.reducer;
