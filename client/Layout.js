import React, {Component} from 'react';
import TopMenu from "client/TopMenu";
import 'bootstrap/dist/css/bootstrap.css';
import 'client/css/App.sass';
import {Alert} from "reactstrap";


export default class Layout extends Component {
    constructor(props) {
        super(props);
        this.state = {alert:{isOpen: false, message: 'nuuuuuu'}};
    }


    setAlert=(alert)=>{
        this.setState({alert})
    }


    render() {
        let {children, ...props} = this.props;
        return <div>
            <TopMenu {...props}/>
            <Alert isOpen={this.state.alert.isOpen}>{this.state.alert.message}</Alert>
            <div className={'container'}>
            {children}
            </div>
            <footer>
                Footer
            </footer>
        </div>
    }
}


