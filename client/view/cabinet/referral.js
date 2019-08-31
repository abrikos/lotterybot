import React, {Component} from 'react';
import {inject, observer} from "mobx-react";
import {t} from "client/Translator";
import {observable} from "mobx";
import moment from "moment";
import {Breadcrumb, BreadcrumbItem} from "reactstrap";
import {Link} from "react-router-dom";

export default @inject('store') @observer
class Referral extends Component {
    @observable referrals = [];
    @observable seconds = 0;

    constructor(props) {
        super(props);
        if (!this.props.store.isAuthenticated) {
            this.props.store.returnUrl = this.props.match.url;
            return this.props.history.push('/login');
        }
        this.init();
        props.store.setTimer(this)
    }

    init = async () => {
        const response = await this.props.store.postData('/cabinet/referrals');
        if (response.error) return;
        //console.log(response)
        this.referrals = response;
    };

    render() {
        return <div className={'container py-2'}>
            <Breadcrumb>
                <BreadcrumbItem><Link to={'/'}>{t('Home')}</Link></BreadcrumbItem>
                <BreadcrumbItem><Link to={'/cabinet'}>{t('Cabinet')}</Link></BreadcrumbItem>
                <BreadcrumbItem>{t('Referrals')}</BreadcrumbItem>
            </Breadcrumb>
            <h2>{t('Referrals')}</h2>
            <div className={'alert alert-info'}>
                <ul>
                    <li>{t('With each payment of your referral you get {{percent}}%', {percent: this.props.store.config.referralRefund * 100})}*</li>
                    <li>{t('Each of your cards is a referral link')}</li>
                </ul>
                <hr/>
                <small>* {t('Payments from auctions occur p2p and do not participate in the referral system')}</small>
            </div>

            {this.referrals.map((ref, i) => <div key={i} className={'row border-bottom'}>
                <div className={'col-md-6'}>{ref.tx}</div>
                <div className={'col-md-2 text-right'}><span className={'red'}>{ref.amount.toFixed(2)}</span> {this.props.store.coin}</div>
                <div className={'col-md-2'}>{t(ref.type)}</div>
                <div className={'col-md-2'}>{moment(ref.date).format('YYYY-MM-DD HH:mm')}</div>
            </div>)}
            <hr/>

        </div>
    }
}