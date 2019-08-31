import React, {Component} from 'react';
import {inject, observer} from "mobx-react";
import {t} from "../Translator";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheckCircle, faTimesCircle} from "@fortawesome/free-solid-svg-icons";


export default @inject('store') @observer
class Footer extends Component {
    render() {
        return <footer className="footer">
            <div className={'d-md-flex justify-content-around align-items-center text-center'}>
                <div>
                    <img src="https://console.minter.network/img/minter-logo-white.svg" alt="Minter"/>
                </div>
                <div>
                    {t('Server status')}: {this.props.store.serverOnline ?
                    <strong className={'text-success'}><FontAwesomeIcon size={'1x'} icon={faCheckCircle}/></strong>
                    :
                    <strong className={'text-danger'}><FontAwesomeIcon size={'1x'} icon={faTimesCircle}/></strong>
                    }
                </div>
                <div className="footer__menu">

                    <div className="footer__menu-item"><a href="https://www.minter.network/"
                                                          target="_blank"
                                                          rel="nofollow noopener noreferrer"
                                                          className="footer__link link--hover">{t('Intro')}</a>
                    </div>
                    <div className="footer__menu-item"><a href="https://about.minter.network/"
                                                          target="_blank"
                                                          rel="nofollow noopener noreferrer"
                                                          className="footer__link link--hover">{t('Network')}</a>
                    </div>
                    <div className="footer__menu-item"><a href="https://console.minter.network/"
                                                          target="_blank"
                                                          rel="nofollow noopener noreferrer"
                                                          className="footer__link link--hover">{t('Console')}</a>
                    </div>
                    <div className="footer__menu-item"><a href="https://status.minter.network/"
                                                          target="_blank"
                                                          rel="nofollow noopener noreferrer"
                                                          className="footer__link link--hover">{t('Status')}</a>
                    </div>
                    <div className="footer__menu-item"><a href="https://explorer.minter.network/"
                                                          target="_blank"
                                                          rel="nofollow noopener noreferrer"
                                                          className="footer__link link--hover">Explorer</a>
                    </div>
                    <div className="footer__menu-item"><a href="https://github.com/MinterTeam"
                                                          target="_blank"
                                                          rel="nofollow noopener noreferrer"
                                                          className="footer__link link--hover">API &amp; SDK</a>
                    </div>
                    <div className="footer__menu-item"><a href="https://docs.minter.network"
                                                          target="_blank"
                                                          rel="nofollow noopener noreferrer"
                                                          className="footer__link link--hover">{t('Docs')}</a>
                    </div>
                </div>
            </div>
        </footer>
    }
}