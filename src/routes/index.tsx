import React from 'react';
import { Route, Switch } from 'react-router-dom';
import TodoListView from '../views/TodoListView';
import CustomSigView from '../views/CustomSigView';

const PageRoute: React.FC = () => {
    return (
        <>
            <Switch>
                <Route exact path="/" component={CustomSigView} />
                <Route path="/app" component={TodoListView} />
            </Switch>
        </>
    );
};

export default PageRoute;
