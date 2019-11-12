import React, {Component, useEffect, useState} from 'react';
import {t} from "client/Translator";
import {Button} from "reactstrap";
import AccessDenied from "client/view/access-denied";
import Loader from "client/components/Loader";

export default (props) => {
    if (!props.auth) {
        //props.history.push('/login');
        return <AccessDenied/>
    }
    const [loading, setLoading] = useState(true);
    const [count, setCount] = useState(0);
    const [refLink, setRefLink] = useState(0);
    const [refAddresses, setRefAddresses] = useState([]);
    const [referrals, setReferrals] = useState('');
    useEffect(() => {
        props.apiData('/cabinet/referral-link')
            .then(res => {
                setRefLink(res.message);
                setLoading(false)
            });

        props.apiData('/cabinet/referral-addresses')
            .then(res => {
                setRefAddresses(res)
            });

        props.apiData('/cabinet/referrals')
            .then(res => setReferrals(res.message));

    }, []);

    return loading ? <Loader/> : <div>
        <Button onClick={() => setCount(count + 1)}>CLL</Button>

        <ul className="nav nav-tabs" id="myTab" role="tablist">
            <li className="nav-item">
                <a className="nav-link" id="ref-link-tab" data-toggle="tab" href="#ref-link" role="tab" aria-controls="ref-link" aria-selected="true">{t('My referral link')}</a>
            </li>
            <li className="nav-item">
                <a className="nav-link active" id="profile-tab" data-toggle="tab" href="#profile" role="tab" aria-controls="profile" aria-selected="false">{t('My referral addresses')}</a>
            </li>
            <li className="nav-item">
                <a className="nav-link" id="contact-tab" data-toggle="tab" href="#contact" role="tab" aria-controls="contact" aria-selected="false">{t('Referrals')}</a>
            </li>
        </ul>
        <div className="tab-content container" id="myTabContent">
            <div className="tab-pane fade" id="ref-link" role="tabpanel" aria-labelledby="ref-link-tab">{props.toHtml(refLink)}</div>
            <div className="tab-pane fade show active" id="profile" role="tabpanel" aria-labelledby="profile-tab">
                {refAddresses.map(a=>
                <div className={'row border-bottom mt-3'} key={a.network}>
                    <div className={'col'}>{a.name}</div>
                    <div className={'col'}>{a.address && a.address.address}</div>
                    <div className={'col'}>{a.coin}</div>
                </div>)}
            </div>
            <div className="tab-pane fade" id="contact" role="tabpanel" aria-labelledby="contact-tab">{props.toHtml(referrals)}</div>
        </div>
    </div>

}


