import React, {Component, useEffect, useState} from 'react';
import {t} from "client/Translator";
import {Button} from "reactstrap";

export default (props) => {
    if(!props.auth){
        props.history.push('/login');
        return <div/>
    }
    const [count, setCount] = useState(0);
    const [refLink, setRefLink] = useState(0);

    props.api.postData('/cabinet/referral-link')
        .then(res=>setRefLink(res.message));

    useEffect(
        () => {
            document.title = `${count} Вы нажали  раз`;
        }
    )
    return <div>



        <Button onClick={() => setCount(count + 1)}>CLL</Button>

        <ul className="nav nav-tabs" id="myTab" role="tablist">
            <li className="nav-item">
                <a className="nav-link active" id="ref-link-tab" data-toggle="tab" href="#ref-link" role="tab" aria-controls="ref-link" aria-selected="true">{t('My referral link')}</a>
            </li>
            <li className="nav-item">
                <a className="nav-link" id="profile-tab" data-toggle="tab" href="#profile" role="tab" aria-controls="profile" aria-selected="false">{t('My referral addresses')}</a>
            </li>
            <li className="nav-item">
                <a className="nav-link" id="contact-tab" data-toggle="tab" href="#contact" role="tab" aria-controls="contact" aria-selected="false">{t('Referrals')}</a>
            </li>
        </ul>
        <div className="tab-content" id="myTabContent">
            <div className="tab-pane fade show active" id="ref-link" role="tabpanel" aria-labelledby="ref-link-tab">{refLink}</div>
            <div className="tab-pane fade" id="profile" role="tabpanel" aria-labelledby="profile-tab">...</div>
            <div className="tab-pane fade" id="contact" role="tabpanel" aria-labelledby="contact-tab">...</div>
        </div>
    </div>

}


