import React, {Component} from 'react';
import {inject, observer} from "mobx-react";
import {t} from "client/Translator";
import {Button, Form, FormFeedback, FormGroup, Input, Label} from "reactstrap";
import {observable} from "mobx";
import TelegramLogin from "../components/TelegramLogin";

@inject('store') @observer
class ViewRegistration extends Component {
    @observable formData = {};

    login = async (strategy) => {
        const data = await this.props.store.postData('/login/' + strategy);
        console.log(data)
    };

    registration = async () => {
        for(const f of document.forms["reg-form"]){
            this.formData[f.name] = f.value;
        }
        const data = await this.props.store.postData('/registration', this.formData);
        if(data.error) return;
        if(data.ok===200){
            this.props.history.push('/login')
        }
    };

    fillForm = (e) => {
        if(!this.validate(e.target)) return;
        this.formData[e.target.name] = e.target.value;
    };

    validate = (input) => {
        input.classList.remove('is-invalid')
        if(!input.value) return true;
        switch (input.name) {
            case 'email':
                const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
                if (!re.test(input.value)) {

                    input.classList.add('is-invalid');
                    return false;
                }
                break;
            case 'password2':
                const pass1 = document.getElementById('login-password')
                if (input.value !== pass1.value) {
                    input.classList.add('is-invalid');
                    return false;
                }
                break;
            default:
        }
        return true;
    };

    handleTelegramResponse = async response => {
        console.log(response);
        const res = await this.props.store.postData('/login/telegram', response);
        if(res.error) return;
        this.loginSuccess()
    };

    loginSuccess=()=>{
        this.props.history.push(this.props.store.returnUrl || '/cabinet', {authenticated: true})
    };


    render() {

        return <div className={'container py-2'}>
            <div className={'d-flex justify-content-center'}>
                <div className={'card'}>
                    <div className={'card-header'}>{t('Registration')}</div>
                    <div className={'card-body'}>
                        <Form id={'reg-form'}>
                            <FormGroup>
                                <Label for="login-Email">E-mail</Label>
                                <Input type="email" name="email" id="login-Email" onChange={this.fillForm}/>
                                <FormFeedback>{t('Wrong e-mail')}</FormFeedback>
                            </FormGroup>
                            <FormGroup>
                                <Label for="login-password">{t('Password')}</Label>
                                <Input type="password" name="password" id="login-password" onChange={this.fillForm}/>
                            </FormGroup>
                            <FormGroup>
                                <Label for="login-password2">{t('Confirm password')}</Label>
                                <Input type="password" name="password2" id="login-password2" onChange={this.fillForm}/>
                                <FormFeedback>{t('Wrong password confirmation')}</FormFeedback>
                            </FormGroup>
                            {/*<ReferralCode onChange={this.fillForm}/>*/}
                        </Form>
                    </div>

                    <div className={'card-footer d-flex justify-content-end'}>
                        <Button onClick={this.registration} className={'btn-success'}>{t('Send')}</Button>
                    </div>
                    <div className={'card-footer'}>
                        <TelegramLogin/>
                    </div>

                </div>
            </div>


        </div>
    }
}

export default ViewRegistration;
