import React, {Component} from 'react';
import {t} from "../Translator";
import TelegramLoginButton from "react-telegram-login";
import {withRouter} from "react-router";
import API from "client/API";
import {Button} from "reactstrap";

export default @withRouter
class TelegramLogin extends Component {
    constructor(props){
        super(props);
        this.state = {};
        this.init()
    }

    async init(){
        this.setState(await API.postData('/bot-name'))
        const response = await API.postData('/cabinet/user');
        console.log(response)
    }

    handleTelegramResponse = async response => {
        const res = await API.postData('/login/telegram', response);
        console.log(res);
        if(res.error) return;
        this.props.history.push(API.returnUrl || '/cabinet', {authenticated: true})
    };

    render() {
        return <div>
            <Button onClick={()=>this.handleTelegramResponse()}>Test</Button>
            {t('Login with Telegram')}*: <TelegramLoginButton dataOnauth={this.handleTelegramResponse} buttonSize={'small'} botName={this.state.botName} />
            <hr/>
            <small>*{t('If the telegram login button is not visible, then you need to use a proxy')}</small>
        </div>
    }
}


