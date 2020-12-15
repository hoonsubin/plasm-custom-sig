import React from 'react';
import { render, screen } from '@testing-library/react';
import TodoListView from '../TodoListView';
import { Provider } from 'react-redux';
import store from '../../store';
// more information about testing can be found from here: https://github.com/testing-library/jest-dom

test('renders todo list', () => {
    render(
        <Provider store={store}>
            <TodoListView />
        </Provider>,
    );
    const linkElement = screen.getByText(/Your Todo List/i);
    expect(linkElement).toBeInTheDocument();
});
