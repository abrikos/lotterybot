import React from 'react';
import {inject, observer} from 'mobx-react';
import {observable} from "mobx";
import {
    Collapse,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Nav,
    Navbar,
    NavbarBrand,
    NavbarToggler,
    NavItem,
    UncontrolledDropdown,
} from "reactstrap";
import {Link, withRouter} from "react-router-dom";
import {t, changeLanguage} from "../Translator";
import logo from '../images/logo.svg'
import Loader from "./Loader";


@withRouter @inject('store') @observer
class TopMenu extends React.Component {
    @observable address = '';
    @observable balance = 0;
    @observable menuPulled = false;

    constructor(props) {
        super(props);
        this.store = props.store;
        this.state = {
            collapsed: true
        };
        document.title = this.props.store.config.appName;
    }

    langSwitch = lng=>{
        //this.props.app.changeLanguage(lng);
        changeLanguage(lng)
    };

    navItem = (item) => {
        //const active =  !!this.props.location.pathname.match(item.path);
        const active = this.props.location.pathname === item.path;
        return item.show &&
            <NavItem key={'nav-' + item.path} active={active}>
                <Link to={item.path} className={'nav-link'}>{item.label}</Link>
            </NavItem>
    };

    dropDownItem = (item) => {
        //const active =  !!this.props.location.pathname.match(item.path);
        const active = this.props.location.pathname === item.path;
        return  <DropdownItem key={'nav-' + item.path} active={active} onClick={e=>this.props.history.push(item.path)}>
                {item.label}
            </DropdownItem>
    };

    render() {

        const menuItems = {
            'Cabinet':[
                {path: '/cabinet', label: t('Cabinet'), show: true},
                {path: '/cabinet/parameters', label: t('Parameters'), show: true},
                {path: '/cabinet/referral', label: t('Referrals'), show: true},
            ]
        };
        return (
            <Navbar color="dark" dark expand="md">
                <NavbarBrand href='#' onClick={e => this.props.history.push('/')} className='mr-auto'><img src={logo} alt={'logo'}/> {this.props.store.config.appName}</NavbarBrand>
                <NavbarToggler onClick={e=>this.menuPulled = !this.menuPulled} />
                <Collapse isOpen={this.menuPulled} navbar>
                    <Nav className="ml-auto" navbar>
                        <NavItem>{this.props.store.isLoading && <Loader/>}</NavItem>
                        {this.navItem({path: '/', label: t('Home'), show: true})}
                        {this.navItem({path: '/contacts', label: t('Contacts'), show: true})}



                        {this.props.store.isAuthenticated && Object.keys(menuItems).map((menu,i) => <UncontrolledDropdown nav inNavbar key={i}>
                            <DropdownToggle nav caret>
                                {t(menu)}
                            </DropdownToggle>
                            <DropdownMenu>{menuItems[menu].map(this.dropDownItem)}</DropdownMenu>
                        </UncontrolledDropdown>)}

                        {!this.props.store.isAuthenticated && this.navItem({path: '/login', label: t('Log in'), show: true})}
                        {this.props.store.isAuthenticated ? this.navItem({path: '/logout', label: t('Log out'), show: true})
                            :
                            this.navItem({path: '/registration', label: t('Registration'), show: true})}




                        <UncontrolledDropdown nav inNavbar>
                            <DropdownToggle nav caret>
                                {t('Language')}
                            </DropdownToggle>
                            <DropdownMenu>
                                <DropdownItem onClick={() => this.langSwitch('ru')}>
                                    RU
                                </DropdownItem>
                                <DropdownItem onClick={() => this.langSwitch('en')}>
                                    EN
                                </DropdownItem>

                            </DropdownMenu>
                        </UncontrolledDropdown>

                    </Nav>
                </Collapse>
            </Navbar>
        );
    }
}

export default TopMenu;