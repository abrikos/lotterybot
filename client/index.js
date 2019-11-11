import React from 'react';
import ReactDOM from 'react-dom';
import Application from 'client/Application';
import api from 'client/API';
import * as serviceWorker from './serviceWorker';
import './i18n';

/*
ReactDOM.render(<Application />, document.getElementById('root'));
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
*/

const render = (Component) => {
    ReactDOM.render(
        <Application api={api}/>,
        document.getElementById('root')
    );
    serviceWorker.unregister();
};

const init = async () => {
    render();
};

init();
