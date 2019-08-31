import React, {Component} from 'react';
import {inject, observer} from "mobx-react";
import {t} from "client/Translator";
import {observable} from "mobx";
import CopyButton from "../components/CopyButton";

export default @inject('store') @observer
class ViewContacts extends Component {
    @observable referrals = [];


    render() {
        return <div className={'container contacts py-2'}>
            <h1>{t('Contacts')}</h1>
            <ul>
            <li>{t('Support')}: <a href={'mailto:support@minter-earth.ru'} rel="noopener noreferrer">support@minter-earth.ru</a></li>
                <li>{t('Telegram group')} <a href={'https://t.me/minterearth'} target={'_blank'} rel="noopener noreferrer">"Minter Earth"</a> <CopyButton text={'https://t.me/minterearth'}/></li>
                <li><a href="https://t.me/joinchat/EafyEVD-HEOxDcv8YyaqNg" target="_blank" rel="noopener noreferrer">"Minter (Русская группа)"</a> <CopyButton text={'https://t.me/joinchat/EafyEVD-HEOxDcv8YyaqNg'}/></li>
            </ul>
            <h3>{t('Where buy BIP')}</h3>
            <ul>
                <li><a href="https://monsternode.net/wallet/?exchange" target="_blank" rel="noopener noreferrer">MonsterNode Exchange</a></li>
                <li>{t('Telegram group')} <a href="https://t.me/bipstore" target="_blank" rel="noopener noreferrer">"BIPstore.ru OTC"</a> <CopyButton text={'https://t.me/bipstore'}/></li>
                <li>{t('Telegram group')} <a href="https://t.me/LocalMinter" target="_blank" rel="noopener noreferrer">"LocalMinter"</a> <CopyButton text={'https://t.me/LocalMinter'}/></li>
            </ul>
        </div>
    }
}