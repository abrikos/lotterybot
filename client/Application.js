import React, {Component, useState} from 'react';
import {Route, Router, Switch} from 'react-router-dom';
import {createBrowserHistory as createHistory} from 'history';
import Layout from "client/Layout";
import RouteSwitch from "client/RouteSwitch";
import API from 'client/API';
import markdown from "markdown";
import i18n from './i18n';

export default class Application extends Component {

    alert = {isOpen: false};

    constructor(props) {
        super(props);
        this.history = createHistory();
        this.state = {auth: true, alert: this.alert};
        this.functions.checkAuth();
        this.functions.setLanguage()
    }

    functions = {
        setLanguage(){
            this.apiData('/language')
                .then(lng =>i18n.changeLanguage(lng.code) )
        },

        setAlert: (response) => {
            const color = response.error ? 'danger' : 'success';
            this.setState({alert: {isOpen: true, children: response.message, color}})
        },

        clearAlert: () => {
            this.setState({alert: this.alert})
        },

        async apiData(path, data) {
            const res = await API.postData(path, data)
            if (res.error) {
                this.setAlert(res);
            } else {
                this.clearAlert();
            }
            return res;
        },

        checkAuth: () => {
            API.isAuth()
                .then(auth => this.setState({auth}))
        },

        logOut: () => {
            API.postData('/logout')
                .then(res => {
                    if (res.ok) this.setState({auth: false});
                })
        },

        logIn: (response) => {
            API.postData('/login/telegram', response)
                .then(res => {
                    if (res.error) return;
                    this.setState({auth: true});
                    this.history.push('/cabinet');

                });
        },

        linkify(inputText) {
            let replacedText, replacePattern1, replacePattern2, replacePattern3;
            console.log(inputText)
            //URLs starting with http://, https://, or ftp://
            replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
            replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

            //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
            replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
            replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

            //Change email addresses to mailto:: links.
            replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
            replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

            return replacedText;
        },

        toHtml(text){
            return <div dangerouslySetInnerHTML={{__html: this.linkify(markdown.markdown.toHTML(text).split('\n').join('<br/>'))}}/>
        }

    };

    render() {
        return (
            <Router history={this.history}>
                <Layout {...this.props} {...this.state}>
                    <RouteSwitch
                        {...this.functions}
                        {...this.state}/>
                </Layout>
            </Router>

        );
    }
}

