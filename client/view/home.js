import React from "react";
import Clock from "client/components/clock";
import {Button} from "reactstrap";

export default class Home extends React.Component {

    constructor(props){
        super(props)
        this.alert = this.props.alert
    }

    render() {
        return <div>
            HOMe
            <Clock/>
            <Button onClick={()=>this.props.onAlert({message:'zzzzzzzzzz', isOpen:true})}>Alert</Button>
        </div>
    }
}