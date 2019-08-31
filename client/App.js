import React, {Component} from 'react';
import {Provider} from 'mobx-react';
import {Router} from 'react-router-dom';
import {createBrowserHistory as createHistory} from 'history';
import Layout from "client/view/Layout";
import i18n from 'i18next';

class App extends Component {

    constructor(props) {
        super(props);
        let language = i18n.language && i18n.language.indexOf('ru') !== -1 ? 'ru' : 'en';
        this.state = {language};
        this.history = props.history || createHistory(this.props);
        this.history.listen((location, action) => {
            if (location.state && location.state.authenticated) props.store.isAuthenticated = true;
            props.store.init();
            console.log(action, location.pathname, location.state)
        });
    }


    changeLanguage = lng => {
        this.setState({language: lng})
    };


    render() {
        return (
            <Provider store={this.props.store}>
                <Router history={this.history}>
                    <Layout app={this} state={this.state}/>
                </Router>
            </Provider>
        );
    }
}

export default App;
