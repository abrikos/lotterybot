import React, {Component} from 'react';
import {observer} from "mobx-react";
import {observable} from "mobx";
import CopyButton from "./CopyButton";
import config from "../lib/config";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faQrcode} from "@fortawesome/free-solid-svg-icons";
import {Popover, PopoverHeader} from "reactstrap";
import PropTypes from "prop-types";

const hostConfig = require("client/lib/host.config.local")

@observer
class Address extends Component {
    static propTypes = {
        text: PropTypes.string.isRequired,
    };

    @observable showPopOver = false;

    constructor(props) {
        super(props);
        this.linkToAddress = config[hostConfig.net].explorerUrl + '/address/' + this.props.text;
        this.id = 'cpbtnAddr';
    }


    render() {

        return <span>
            <a href={this.linkToAddress} className={'red'} target={'_blank'}><strong>{this.props.text.substring(0,8)}...</strong></a>&nbsp;
            <FontAwesomeIcon size={this.props.size} icon={faQrcode}
                             onClick={e => this.showPopOver = true}
                             title={`QR`}
                             style={{cursor: 'pointer', color: '#555'}} id={this.id + this.props.text}/>&nbsp;

            <Popover placement={'top'} isOpen={this.showPopOver} target={this.id + this.props.text} toggle={this.toggle}>
                <PopoverHeader><img src={'/qr/' + this.props.text} alt={this.props.text}/></PopoverHeader>
            </Popover>
                <CopyButton text={this.props.text} size={'1x'}/>
        </span>
    }
}

export default Address;
