import React, {Component} from 'react';
import {inject, observer} from "mobx-react";
//import AddButton from "../components/AddButton";

export default @inject('store') @observer
class Home extends Component {

    constructor(props) {
        super(props)
        this.init()
    }

    init = async () => {
        const response = await this.props.store.postData(`/area/last`);
        if (response.error) return;
        const cards = await this.props.store.postData(`/card/all`);
    };



    render() {
        return <div></div>

    }
}


