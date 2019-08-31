import i18n from './i18n';
import { NamespacesConsumer, Trans } from 'react-i18next';
import React from "react";


export function  changeLanguage(lng){
        i18n.changeLanguage(lng);
    }

export function t(key, params) {
        return (
            <NamespacesConsumer>
                {
                    (t, { i18n }) => <>{t(key,params)}</>
                }
            </NamespacesConsumer>
        )
    }

export function _(key) {
        return i18n.t(key)
    }

export function thtml(key, html){
    return (
        <Trans i18nKey={key} children={html}/>
    )
}

