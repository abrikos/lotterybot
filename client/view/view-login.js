import React, {Component} from 'react';
import {inject, observer} from "mobx-react";
import {t} from "client/Translator";
import {Button, Form, FormGroup, Input, Label} from "reactstrap";
import {observable} from "mobx";
import TelegramLoginButton from 'react-telegram-login';
import Loader from "../components/Loader";
import TelegramLogin from "../components/TelegramLogin";


@inject('store') @observer
class ViewLogin extends Component {
    @observable formData = {};
    @observable errorCode;
    @observable isLoading;

    constructor(props) {
        super(props)
        this.init()
    }

    init = async () => {
        if (this.props.store.isAuthenticated) await this.props.history.push('/cabinet');
    };

    login = async (strategy) => {
        const data = await this.props.store.postData('/login/' + strategy, this.formData);
        console.log('LOGIN', data)
        if (!data.error) return this.loginSuccess();

        const email = document.getElementById('login-email')
        const pass = document.getElementById('login-password')
        pass.classList.add('is-invalid');
        email.classList.add('is-invalid');
        this.errorCode = data.error;

    };

    fillForm = (e) => {
        this.formData[e.target.name] = e.target.value;
    };

    sendConfirmationCode = async () => {
        this.isLoading = true;
        const response = await this.props.store.postData('/login/re-confirmation', this.formData);
        if(response.error) return
        this.errorCode = 'email-sent'
        this.isLoading = false;
    };

    loginSuccess=()=>{
        this.props.history.push(this.props.store.returnUrl || '/cabinet', {authenticated: true})
    };

    render() {

        return <div className={'container py-2'}>
            <div className={'d-flex justify-content-center'}>
                <div className={'card'}>
                    <div className={'card-header'}>{t('Log in')}</div>
                    <div className={'card-body'}>
                        <Form>
                            <FormGroup>
                                <Label for="login-Email">E-mail</Label>
                                <Input type="email" name="username" id="login-email" onChange={this.fillForm}/>
                            </FormGroup>
                            <FormGroup>
                                <Label for="login-password">{t('Password')}</Label>
                                <Input type="password" name="password" id="login-password" onChange={this.fillForm}/>
                            </FormGroup>
                        </Form>

                        {this.errorCode === 'password' && <div className={'text-danger'}>{t('Wrong password')}</div>}
                        {this.errorCode === 'username' && <div className={'text-danger'}>{t('Wrong E-mail')}</div>}
                        {this.errorCode === 'email-confirm' && !this.isLoading &&
                        <div className={'text-danger'}>{t('E-mail not confirmed')} <Button onClick={this.sendConfirmationCode}>{t('Send confirmation code')}</Button></div>}
                        {this.isLoading && <Loader/>}
                        {this.errorCode === 'email-sent' && <div className={'text-success'}>{t('Code sent. Please check mail')}</div>}
                    </div>
                    <div className={'card-footer d-flex justify-content-end'}>
                        <Button onClick={e => this.login('local')} className={'btn-success'}>{t('Send')}</Button>
                    </div>
                    <div className={'card-footer d-flex flex-column justify-content-center'}>
                        <TelegramLogin/>
                    </div>

                </div>
            </div>


        </div>
    }
}

export default ViewLogin;
