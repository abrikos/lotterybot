import React, {Component, useEffect, useState} from 'react';
import {t} from "client/Translator";
import {Button} from "reactstrap";
import NotFound from "client/view/notfound";
import Loader from "client/components/Loader";
import markdown from 'markdown'

const ReactBsTable = require("react-bootstrap-table")
const BootstrapTable = ReactBsTable.BootstrapTable;
const TableHeaderColumn = ReactBsTable.TableHeaderColumn;


const Lottery = (props) => {
    const [lottery, setLottery] = useState({});
    const [loading, setLoading] = useState(true);

    //props.apiData('/lotteries')        .then(res=>setLotteries(res));
    useEffect(() => {
        props.apiData('/lottery/' + props.match.params.id)
            .then(res => {
                setLoading(false)
                setLottery(res)
            });
    }, [])


    return loading ? <Loader/> : lottery.address ? <div>
        <h1>{t('Lottery')} {lottery.name}</h1>

        {props.toHtml(lottery.info)}
        {lottery.transactions.map(tx => <div key={tx.hash}>{tx.hash}</div>)}
        {/*<BootstrapTable data={lotteries} striped hover version='4'>
            <TableHeaderColumn isKey dataField='network' width={'20%'} dataFormat={cellFormat}>{t('Network')}</TableHeaderColumn>
            <TableHeaderColumn dataField='coin' width={'10%'}>{t('Coin')}</TableHeaderColumn>
            <TableHeaderColumn dataField='balance' width={'20%'}>{t('Balance')}</TableHeaderColumn>
            <TableHeaderColumn dataField='stopLimit' width={'20%'}>{t('Limit')}</TableHeaderColumn>
            <TableHeaderColumn dataField='date' width={'30%'}>{t('Started')}</TableHeaderColumn>
        </BootstrapTable>*/}
    </div> : <NotFound/>

};
export default Lottery;

