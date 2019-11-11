import React from 'react';
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
import {t, changeLanguage} from "client/Translator";
import logo from 'client/images/logo.svg'
import API from "client/API";


@withRouter
class TopMenu extends React.Component {

    constructor(props) {
        super(props);
        this.store = props.store;
        this.state = {
            collapsed: true
        };
        document.title = 'Test Application';
    }

    langSwitch = lng => {
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
        return <DropdownItem key={'nav-' + item.path} active={active} onClick={e => this.props.history.push(item.path)}>
            {item.label}
        </DropdownItem>
    };

    render() {

        const menuItems = {
            'Cabinet': [
                {path: '/cabinet', label: t('Cabinet'), show: true},
                {path: '/cabinet/parameters', label: t('Parameters'), show: true},
                {path: '/cabinet/referral', label: t('Referrals'), show: true},
            ]
        };
        return (
            <Navbar color="dark" dark expand="md">
                <NavbarBrand href='#' onClick={e => this.props.history.push('/')} className='mr-auto'><img src={logo} alt={'logo'}/> HOME</NavbarBrand>
                <NavbarToggler onClick={e => this.menuPulled = !this.menuPulled}/>
                <Collapse isOpen={this.menuPulled} navbar>
                    <Nav className="ml-auto" navbar>
                        {this.navItem({path: '/', label: t('Home'), show: true})}
                        {this.navItem({path: '/contacts', label: t('Contacts'), show: true})}
                        {this.navItem({path: '/login', label: t('Login'), show: !this.props.auth})}
                        {this.navItem({path: '/cabinet', label: t('Cabinet'), show: this.props.auth})}
                        {this.navItem({path: '/logout', label: t('Logout'), show: this.props.auth})}


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