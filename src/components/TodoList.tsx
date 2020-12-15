import React from 'react';
import { Todo } from '../store';
import {
    List,
    ListItem,
    ListItemText,
    Typography,
    ListItemSecondaryAction,
    IconButton,
    Card,
    CardContent,
    Divider,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import { storeActions } from '../store';
import { useAppDispatch } from '../hooks';

const useStyles = makeStyles((theme) => ({
    listRoot: {
        width: '100%',
        backgroundColor: theme.palette.background.paper,
        position: 'relative',
        overflow: 'auto',
        maxHeight: 300,
    },
}));

interface Props {
    todoItems: Todo[];
}

interface ItemProps {
    item: Todo;
    onClickRemove: (item: Todo) => void;
}

const TodoItem: React.FC<ItemProps> = ({ item, onClickRemove }) => {
    return (
        <>
            <ListItem key={`item-${item.id}-${item.body}`}>
                <ListItemText
                    primary={
                        <>
                            <Typography component="h4" variant="h5">
                                {item.title}
                            </Typography>
                        </>
                    }
                    secondary={item.body}
                />
                <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => onClickRemove(item)}>
                        <DeleteIcon />
                    </IconButton>
                </ListItemSecondaryAction>
            </ListItem>
            <Divider />
        </>
    );
};

const TodoList: React.FC<Props> = ({ todoItems }) => {
    const dispatch = useAppDispatch();
    const { todoAction } = storeActions;

    const classes = useStyles();
    const handleDelete = (item: Todo) => {
        console.log(`Removing item number ${item.id}`);
        dispatch(todoAction.remove(item));
    };

    return (
        <div>
            <Card>
                <CardContent>
                    {todoItems.length > 0 ? (
                        <List className={classes.listRoot}>
                            {todoItems.map((i) => {
                                return <TodoItem item={i} onClickRemove={handleDelete} />;
                            })}
                        </List>
                    ) : (
                        <div>the list is empty</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TodoList;
