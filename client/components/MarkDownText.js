import React, {Component} from 'react';

const markdown = require("markdown").markdown;

export default class MarkDownText extends Component {


    render() {
        return <span dangerouslySetInnerHTML={{__html: this.props.text ? markdown.toHTML(this.props.text) : ''}}/>
    }
}

