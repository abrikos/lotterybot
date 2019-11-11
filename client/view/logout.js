import React, {Component} from 'react';
import {t} from "client/Translator";
import {Button} from "reactstrap";

export default class Logout extends Component {

    constructor(props){
        super(props)
        this.props.logOut();
        console.log('LOGOUT VIEW', props)
    }

    render() {

        return <div className={'container py-2'}>
            <div className={'d-flex justify-content-center'}>
                <Button onClick={e=>this.props.history.goBack()}>{t('Go back')}</Button>
                <Button onClick={e=>this.props.history.push('/login')}>{t('Log in')}</Button>

            </div>


        </div>
    }
}


