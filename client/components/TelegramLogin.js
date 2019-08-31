import React, {Component} from 'react';
import {inject} from "mobx-react";
import {t} from "../Translator";
import TelegramLoginButton from "react-telegram-login";
import hostConfig from "client/lib/host.config.local";
import {withRouter} from "react-router";

export default @inject('store') @withRouter
class TelegramLogin extends Component {
    handleTelegramResponse = async response => {
        console.log(response);
        const res = await this.props.store.postData('/login/telegram', response);
        if(res.error) return;
        this.props.history.push(this.props.store.returnUrl || '/cabinet', {authenticated: true})
    };

    render() {
        return <div>
            {t('Login with Telegram')}*: <TelegramLoginButton dataOnauth={this.handleTelegramResponse} buttonSize={'small'} botName={hostConfig.botName || "MinterEarthBot"} />
            <hr/>
            <small>*{t('If the telegram login button is not visible, then you need to use a proxy')}</small>
        </div>
    }
}


