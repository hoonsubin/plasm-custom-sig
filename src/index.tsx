import React from 'react';
import ReactDOM from 'react-dom';
import './assets/styles/style.css';
import 'fontsource-roboto';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import store, { history } from './store';

const render = () => {
    ReactDOM.render(
        <Provider store={store}>
            <React.StrictMode>
                <App history={history} />
            </React.StrictMode>
        </Provider>,
        document.getElementById('root'),
    );
};

render();

if (process.env.NODE_ENV === 'development' && module.hot) {
    module.hot.accept('./App', render);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
