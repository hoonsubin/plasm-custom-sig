import React from 'react';
import { useSelector } from 'react-redux';
import TodoList from '../components/TodoList';
import TodoInputForm from '../components/TodoInputForm';
import { RootState, storeActions } from '../store';
import { useAppDispatch } from '../hooks';
import { Container, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
    root: {
        marginTop: 10,
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    title: {
        textAlign: 'center',
    },
}));

const TodoListView: React.FC = () => {
    const classes = useStyles();
    // get the global list
    const todoListState = useSelector((state: RootState) => state.todoReducer);
    const dispatch = useAppDispatch();
    const { todoAction } = storeActions;

    return (
        <main className={classes.root}>
            <Container maxWidth="md">
                <Typography variant="h1" component="h2" className={classes.title}>
                    Your Todo List
                </Typography>
                <TodoInputForm
                    onClickAdd={(item) => dispatch(todoAction.newItem(item))}
                    onClickCancel={() => console.log('you clicked cancel')}
                />
                <TodoList todoItems={todoListState} />
            </Container>
        </main>
    );
};

export default TodoListView;
