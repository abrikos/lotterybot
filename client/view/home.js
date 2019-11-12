import React, {Component, useEffect, useState} from 'react';
import {t} from "client/Translator";
import {Button} from "reactstrap";
import {Link} from "react-router-dom";
const ReactBsTable = require( "react-bootstrap-table")
const BootstrapTable = ReactBsTable.BootstrapTable;
const TableHeaderColumn = ReactBsTable.TableHeaderColumn;

export default (props) => {
    const [lotteries, setLotteries] = useState([]);

    //props.apiData('/lotteries')        .then(res=>setLotteries(res));
    useEffect(()=>{
        props.apiData('/lotteries')        .then(setLotteries);
    }, [])

    function cellFormat(cell, row){
        return <a href={'#'} onClick={()=>props.history.push('/lottery/'+row.id)}>{cell}</a>
    }

    return <div>
        <h1>{t('Active lotteries')}</h1>
        <Link to={'/lottery/zzzzz'}>ERRR</Link>
        <BootstrapTable data={lotteries} striped hover version='4'>
            <TableHeaderColumn isKey dataField='network' width={'20%'} dataFormat={cellFormat}>{t('Network')}</TableHeaderColumn>
            <TableHeaderColumn dataField='coin' width={'10%'}>{t('Coin')}</TableHeaderColumn>
            <TableHeaderColumn dataField='balance' width={'20%'}>{t('Balance')}</TableHeaderColumn>
            <TableHeaderColumn dataField='stopLimit' width={'20%'}>{t('Limit')}</TableHeaderColumn>
            <TableHeaderColumn dataField='date' width={'30%'}>{t('Started')}</TableHeaderColumn>
        </BootstrapTable>
    </div>

}


