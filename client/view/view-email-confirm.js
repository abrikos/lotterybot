import React, {Component} from 'react';
import {inject, observer} from "mobx-react";
import {t} from "client/Translator";
import {Button} from "reactstrap";
import {withRouter} from "react-router";
import {observable} from "mobx";

export default @inject('store') @withRouter @observer
class ViewEmailConfirm extends Component {
    @observable ok = false;

    constructor(props){
        super(props)
        this.init()
    }

    init =async ()=>{
        const response = await this.props.store.postData(`/confirmation-code/${this.props.match.params.code}`);
        if(response.error) return;
        this.ok = true;
        console.log(this.ok)
    };

    render() {

        return <div className={'container py-2 text-center'}>
           {this.ok && <h1>{t('Email confirmed')} <Button onClick={e=>this.props.history.push('/login')}>{t('Proceed to login')}</Button> </h1>}
        </div>
    }
}

