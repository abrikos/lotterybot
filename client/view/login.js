import React, {useState} from 'react';
import {t} from "client/Translator";
import TelegramLoginButton from "react-telegram-login";
import {Button} from "reactstrap";

export default (props) => {
    if(props.auth){
        props.history.push('/cabinet');
        return <div/>
    }

    const [botName, setBotName] = useState();

    const handleTelegramResponse = async response => {
        const res = await props.api.postData('/login/telegram', response);
        if (res.error) return;
        props.logIn();
        props.history.push('/cabinet', {authenticated: true})
    };


    return <div>
        <div className={'d-flex justify-content-center'}>
            <div className={'card'}>
                <div className={'card-header'}>{t('Log in')}</div>
                <div className={'card-body'}>
                    <Button onClick={()=>handleTelegramResponse()}>Test</Button>
                    <TelegramLoginButton dataOnauth={handleTelegramResponse} buttonSize={'small'} botName={botName}/>
                </div>

            </div>
        </div>


    </div>

}


