import React, {Component} from 'react';
import {inject} from "mobx-react";
import {withRouter} from "react-router";
import {t} from "client/Translator";


export default  @inject('store') @withRouter
class CreateFromCookie extends Component {

    constructor(props) {
        super(props);
        this.points = this.props.store.getCookie('polygon');
        console.log(this.points)
        this.init()
    }

    init = async () => {
        const area = await this.props.store.postData('/area/create', JSON.parse(this.points));
        if (area.error) return;
        this.props.history.push(`/area/edit/${area.id}`)

    };

    render() {

        return <span>{t('Please wait')}</span>
    }
}

