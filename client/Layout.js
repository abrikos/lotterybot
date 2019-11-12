import React, {Component, useState} from 'react';
import TopMenu from "client/TopMenu";
import 'bootstrap/dist/css/bootstrap.css';
import 'client/css/App.sass';
import {Alert} from "reactstrap";


export default props=> {
    //render() {
        let {children, alert,...rest} = props;
        return <div>
            <TopMenu {...rest}/>
            <Alert {...alert}/>
            <div className={'container'}>
                {children}
            </div>
            <footer>
                Footer
            </footer>
        </div>
    //}
}


