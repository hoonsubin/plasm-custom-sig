import React, { useState } from 'react';
import { Todo } from '../store';
import { TextField, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

interface Props {
    onClickAdd: (item: Todo) => void;
    onClickCancel: () => void;
}

const useStyles = makeStyles((theme) => ({
    layout: {
        width: 'auto',
        padding: theme.spacing(3),
    },
    inputForm: {
        padding: 'auto',
    },
    textInput: {
        margin: theme.spacing(0, 1),
    },
    buttons: {
        padding: theme.spacing(1),
    },
}));

const TodoInputForm: React.FC<Props> = ({ onClickAdd }) => {
    const classes = useStyles();
    const emptyFormVal = { id: 0, title: '', body: '' };
    const [todoItem, setTodoItem] = useState<Todo>(emptyFormVal);

    const handleAddButton = () => {
        // make a random id. This is not good for production
        const id = Math.round(Math.random() * 100);

        onClickAdd({ ...todoItem, id });

        // reset the form value
        setTodoItem(emptyFormVal);
    };

    return (
        <div className={classes.layout}>
            <form noValidate autoComplete="off" className={classes.inputForm}>
                <TextField
                    label="Title"
                    value={todoItem.title}
                    onChange={(e) => setTodoItem({ ...todoItem, title: e.target.value })}
                    className={classes.textInput}
                />
                <TextField
                    label="Content"
                    value={todoItem.body}
                    onChange={(e) => setTodoItem({ ...todoItem, body: e.target.value })}
                    className={classes.textInput}
                />
                <div className={classes.buttons}>
                    <Button variant="outlined" onClick={handleAddButton}>
                        Add this
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default TodoInputForm;
