import React from 'react';
import {Route, Switch, withRouter} from 'react-router-dom';
import {inject, observer} from 'mobx-react';
import Home from "client/view/home";
import ViewRegistration from "./view/view-registration";
import ViewLogin from "./view/view-login";
import ViewLogout from "./view/view-logout";
import ViewEmailConfirm from "./view/view-email-confirm";
import {Alert} from "reactstrap";
import {t} from "./Translator";
import Referral from "./view/cabinet/referral";
import ViewContacts from "./view/view-contacts";
import CabinetParams from "./view/cabinet/cabinet-params";
import Cabinet from "./view/cabinet/cabinet";


@inject('store') @withRouter @observer
class Routes extends React.Component {

    onDismiss=()=>{
        this.props.store.alert.isOpen = false;
    }

    render() {
        return <div>

            <Alert toggle={this.onDismiss} {...this.props.store.alert} >
                {this.props.store.alert.path}: {this.props.store.alert.error}  {t(this.props.store.alert.message)}
            </Alert>
            <Switch>



                <Route path='/' exact={true} render={props => <Home state={this.props.state} {...props}/>}/>
                <Route path='/cabinet' exact render={props => <Cabinet state={this.props.state} {...props}/>}/>
                <Route path='/cabinet/referral' render={props => <Referral state={this.props.state} {...props}/>}/>
                <Route path='/cabinet/parameters' render={props => <CabinetParams state={this.props.state} {...props}/>}/>
                <Route path='/registration' render={props => <ViewRegistration state={this.props.state} {...props}/>}/>
                <Route path='/login' render={props => <ViewLogin state={this.props.state} {...props}/>}/>
                <Route path='/logout' render={props => <ViewLogout state={this.props.state} {...props}/>}/>
                <Route path='/confirmation-code/:code' render={props => <ViewEmailConfirm state={this.props.state} {...props}/>}/>
                <Route path='/contacts' render={props => <ViewContacts state={this.props.state} {...props}/>}/>

            </Switch>
        </div>;
    };
}

export default Routes