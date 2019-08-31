import React, {Component} from 'react';
import {inject, observer} from "mobx-react";
import {t} from "client/Translator";
import {observable} from "mobx";
import {Breadcrumb, BreadcrumbItem, Button, Form, FormFeedback, FormGroup, FormText, Input, Label} from "reactstrap";
import {Link} from "react-router-dom";

export default @inject('store') @observer
class CabinetParams extends Component {
    @observable user;
    @observable addressValid;
    @observable hasChanges;


    constructor(props) {
        super(props);
        if (!this.props.store.isAuthenticated) {
            this.props.store.returnUrl = this.props.match.url;
            return this.props.history.push('/login');
        }
        this.init();
    }

    init = async () => {
        const response = await this.props.store.postData('/cabinet/user');
        console.log(response)
        if (response.error) return this.props.history.push('/login');
        this.user = response;
        this.addressValid = !!this.user.address;
    };

    fillForm = async (e) => {
        this.hasChanges = true;
        this.user[e.target.name] = e.target.value;

        //const response1 = await this.props.store.postData('/cabinet/address/check', this.user);
        //if (response1.error) return
        this.addressValid = this.user.address.match(/^Mx[a-fA-F0-9]{40}$/);
        //if(!response1.valid) return;

    };

    save = async () => {
        const response = await this.props.store.postData('/user/save', this.user);
        if (response.error) return
        this.hasChanges = false;
    };

    getRandom = async () => {
        const response = await this.props.store.postData('/auth/referral/set/random');
        if (response.error) return;
        this.user.referralCode = response.referral;
    };


    render() {
        return <div className={'container py-2'}>
            <Breadcrumb>
                <BreadcrumbItem><Link to={'/'}>{t('Home')}</Link></BreadcrumbItem>
                <BreadcrumbItem><Link to={'/cabinet'}>{t('Cabinet')}</Link></BreadcrumbItem>
                <BreadcrumbItem>{t('Parameters')}</BreadcrumbItem>
            </Breadcrumb>
            <h1>{t('Parameters')}</h1>
            <hr/>
            <Form>
                <FormGroup>
                    <Label for={'email'}>{t('E-mail')}</Label>
                    <Input name={'email'} id={'user-email'} defaultValue={this.user && this.user.username} disabled/>
                </FormGroup>
                <FormGroup>
                    <Label for={'address'}>{t('Address')}</Label>
                    <Input name={'address'} id={'user-address'} onChange={this.fillForm} defaultValue={this.user && this.user.address} invalid={!this.addressValid} placeholder={'Mx.......'}/>
                    {!this.addressValid && <FormFeedback>{t('Address invalid')}</FormFeedback>}
                    <FormText>{t('The address to which You will receive funds from auctions')}</FormText>
                </FormGroup>
                <FormGroup>
                    <Label for={'nickname'}>{t('Nickname')}</Label>
                    <Input name={'nickname'} id={'user-nickname'} onChange={this.fillForm} defaultValue={this.user && this.user.nickname} maxLength={120}/>
                    <FormText>{t('Nickname for communication')}. {t('Limit {{limit}} symbols', {limit: 120})}</FormText>
                </FormGroup>

            </Form>
            <div>{t('Your parent referral')}: {this.user && this.user.referral && (this.user.referral.nickname || this.user.referral.referralCode)}</div>
            {this.user && !this.user.referral && <Button onClick={this.getRandom}>                {t('Set random referral')}            </Button>}
            {this.hasChanges && <Button onClick={this.save} className={'btn-warning'}>{t('Save')}</Button>}
        </div>
    }
}