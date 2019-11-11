import React, {Component, useState} from 'react';
import {Route, Router, Switch} from 'react-router-dom';
import {createBrowserHistory as createHistory} from 'history';
import Layout from "client/Layout";
import Home from "client/view/home";
import Contacts from "client/view/contacts";
import Login from "client/view/login";
import Logout from "client/view/logout";
import Cabinet from "client/view/cabinet";
import Denied from "client/view/denied";

export default class Application extends Component {

    constructor(props) {
        super(props);
        this.history = props.history || createHistory(this.props);
        this.state = {auth: true};
        this.checkAuth()
    }

    checkAuth = async () => {
        this.setState({auth: await this.props.api.isAuth()});
        console.log(this.state)
    };

    logOut = () => {
        this.props.api.postData('/logout')
            .then(res => {
                if (res.ok) this.setState({auth: false});
            })
    };

    logIn = response => {
        this.props.api.postData('/login/telegram', response)
            .then(res => {
                if (res.error) return;
                this.setState({auth: true});
                this.history.push('/cabinet');

            });
    };

    render() {
        return (
            <Router history={this.history}>
                <Layout {...this.props} {...this.state}>
                    <RouteSwitch logOut={this.logOut} logIn={this.logIn} {...this.props} {...this.state}/>
                </Layout>
            </Router>

        );
    }
}

class RouteSwitch extends Component {
    render() {
        return <Switch>
            <Route path='/' exact={true} render={props => <Home {...props} {...this.props}/>}/>
            <Route path='/contacts' exact={true} render={props => <Contacts {...props} {...this.props}/>}/>
            <Route path='/login' exact={true} render={props => <Login {...props} {...this.props}/>}/>
            <Route path='/logout' exact={true} render={props => <Logout {...props} {...this.props}/>}/>
            <Route path='/cabinet' exact={true} render={props => <Cabinet {...props} {...this.props}/>}/>
        </Switch>
    }
}