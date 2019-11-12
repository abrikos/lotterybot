import React, {useEffect, useState} from 'react';
import {t} from "client/Translator";
import TelegramLoginButton from "react-telegram-login";
import {Button} from "reactstrap";
import {Link} from "react-router-dom";

export default (props) => {
    const [botName, setBotName] = useState();

    const handleTelegramResponse = async response => {
        const res = await props.apiData('/login/telegram', response);
        if (res.error) return;
        props.logIn();
    };

    useEffect(() => {
        props.apiData('/bot-name')
            .then(res => setBotName(res.botName))
    }, []);

    return <div>
        <Link to={'/cabinet'}>CAB</Link>
        <div className={'d-flex justify-content-center'}>
            <div className={'card'}>
                <div className={'card-header'}>{t('Log in')}</div>
                <div className={'card-body'}>
                    <Button onClick={() => handleTelegramResponse()}>Test</Button>
                    <TelegramLoginButton dataOnauth={handleTelegramResponse} buttonSize={'small'} botName={botName}/>
                </div>

            </div>
        </div>


    </div>

}


