import React, {Component} from "react";
import {Route, Switch} from "react-router-dom";
import Home from "client/view/home";
import Contacts from "client/view/contacts";
import Login from "client/view/login";
import Logout from "client/view/logout";
import Cabinet from "client/view/cabinet";
import Lottery from "client/view/lottery";
import NotFound from "client/view/notfound";

export default class RouteSwitch extends Component {

    render() {
        return <Switch>
            <Route path='/' exact={true} render={props => <Home {...props} {...this.props}/>}/>
            <Route path='/contacts' onChange={e=>console.log(e)} exact={true} render={props => <Contacts {...props} {...this.props}/>}/>
            <Route path='/login' exact={true} render={props => <Login {...props} {...this.props}/>}/>
            <Route path='/logout' exact={true} render={props => <Logout {...props} {...this.props}/>}/>
            <Route path='/cabinet' exact={true} render={props => <Cabinet {...props} {...this.props}/>}/>
            <Route path='/lottery/:id' render={props => <Lottery {...props} {...this.props}/>}/>
            <Route component={NotFound}/>
        </Switch>
    }
}
