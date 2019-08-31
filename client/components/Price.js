import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {inject} from "mobx-react";


export default @inject('store')
class Price extends Component {
    static propTypes = {
        value: PropTypes.number.isRequired,
    };

    render() {
        return <span><strong className={'red'}>{this.props.value}</strong> {this.props.store.coin}</span>
    }
}


