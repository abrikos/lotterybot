import React, {Component} from 'react';
import loader from 'client/images/loader.gif'

export default class Loader extends Component {
    render(){
        return <img src={loader} alt={'loading...'} width={30}/>
    }
}