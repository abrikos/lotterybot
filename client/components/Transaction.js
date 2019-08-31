import React, {Component} from 'react';
import {observable} from "mobx";
import config from "../lib/config";
import PropTypes from "prop-types";

const hostConfig = require("client/lib/host.config.local")

export default
class Transaction extends Component {
    static propTypes = {
        hash: PropTypes.string.isRequired,
    };

    @observable showPopOver = false;

    constructor(props) {
        super(props);
        this.linkToAddress = config[hostConfig.net].explorerUrl + '/transactions/' + this.props.hash;
    }


    render() {

        return <span>
            <a href={this.linkToAddress} className={'red'} target={'_blank'}><code>{this.props.hash.substring(0,8)}...</code></a>
        </span>
    }
}

