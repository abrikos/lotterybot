import React, {Component} from 'react';
import {faCopy} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Popover, PopoverHeader} from "reactstrap";
import {observer} from "mobx-react";
import {observable} from "mobx";
import {t} from '../Translator';
import md5 from 'md5';
import PropTypes from "prop-types";


@observer
class CopyButton extends Component {
    static propTypes = {
        text: PropTypes.string.isRequired,
    };

    @observable showPopOver = false;


    copyToClipboard = (text) => {
        this.showPopOver = true;
        const textField = document.createElement('textarea')
        textField.innerText = text
        document.body.appendChild(textField)
        textField.select();
        document.execCommand('copy')
        textField.remove();
        setTimeout(() => {
            this.showPopOver = false;
        }, 2000);
    }


    render() {
        const id='cpbtn'+md5(`${this.props.text}`);
        return <span>
            <FontAwesomeIcon size={this.props.size} icon={faCopy}
                             onClick={e => this.copyToClipboard(this.props.text)}
                             title={`Press to copy: ${this.props.text}`}
                             style={{cursor: 'pointer', color: '#555'}} id={id}/>
            <Popover placement={'right'}
                     isOpen={this.showPopOver}
                     target={id} toggle={this.toggle}>
          <PopoverHeader>{t('Copied')}</PopoverHeader>
        </Popover>
        </span>
    }
}

export default CopyButton;
