import React, {Component} from 'react';
import {inject, observer} from "mobx-react";
import {t} from "client/Translator";
import {observable} from "mobx";
import {Breadcrumb, BreadcrumbItem} from "reactstrap";
import {Link} from "react-router-dom";

export default @inject('store') @observer
class Cabinet extends Component {
    @observable user;
    @observable addressValid;
    @observable hasChanges;


    constructor(props) {

        super(props);
        if (!this.props.store.isAuthenticated) {
            this.props.store.returnUrl = this.props.match.url;
            return this.props.history.push('/login');
        }
    }


    render() {
        const menuItems = [
                {path: '/cabinet/parameters', label: t('Parameters'), show: true},
                {path: '/cabinet/referral', label: t('Referrals'), show: true},
            ];

        return <div className={'container py-2'}>
            <Breadcrumb>
                <BreadcrumbItem><Link to={'/'}>{t('Home')}</Link></BreadcrumbItem>
                <BreadcrumbItem>{t('Cabinet')}</BreadcrumbItem>
            </Breadcrumb>
            <h1>{t('Cabinet')}</h1>
            <hr/>
            <ul>
                {menuItems.map((m,i)=><li key={i}><Link to={m.path}>{m.label}</Link></li>)}
            </ul>
        </div>
    }
}