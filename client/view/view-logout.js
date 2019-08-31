import React, {Component} from 'react';
import {inject, observer} from "mobx-react";
import {t} from "client/Translator";
import {Button} from "reactstrap";

export default @inject('store') @observer
class ViewLogout extends Component {

    constructor(props){
        super(props)
        this.props.store.postData('/logout');
        console.log('LOGOUT VIEW')
    }

    render() {

        return <div className={'container py-2'}>
            <div className={'d-flex justify-content-center'}>
                <Button onClick={e=>this.props.history.goBack()}>{t('Go back')}</Button>
                <Button onClick={e=>this.props.history.push('/login')}>{t('Log in')}</Button>
                <Button onClick={e=>this.props.history.push('/registration')}>{t('Registration')}</Button>

            </div>


        </div>
    }
}


