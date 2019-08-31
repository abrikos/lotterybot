import React, {Component} from 'react';
import TopMenu from "client/components/TopMenu";
import {withRouter} from "react-router";
import Routes from "client/Routes";
//import {t} from "client/Translator";
import {inject} from "mobx-react";
import 'bootstrap/dist/css/bootstrap.css';
import "client/css/minter.css"
import 'client/css/App.sass';
import Footer from "../components/Footer";

@withRouter @inject('store')
class Layout extends Component {


    render() {
        let {rootPath, ...props} = this.props;
        return <div>
            <TopMenu app={props.app}/>
            {/*<div className={'alert alert-warning'}>{t("The system is in test mode. All purchases are made in TESTNET. When switching to MAINNET, active testers will be transferred their areas (within reasonable limits of course)")}</div>*/}
            <Routes key={new Date().valueOf()} store={this.store} {...props}/>
            <Footer/>
        </div>
    }
}

export default Layout;
