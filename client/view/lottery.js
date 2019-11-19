import React, {Component, useEffect, useState} from 'react';
import {t} from "client/Translator";
import {Button} from "reactstrap";
import NotFound from "client/view/notfound";
import Loader from "client/components/Loader";
import markdown from 'markdown'
import moment from "moment";

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

        <BootstrapTable data={lottery.transactions} striped hover version='4'>
            <TableHeaderColumn isKey dataField='hash' width={'60%'}>{t('TX')}</TableHeaderColumn>
            <TableHeaderColumn dataField='value' width={'20%'}>{t('Value')}</TableHeaderColumn>
            <TableHeaderColumn dataField='coin' width={'10%'}>{t('Coin')}</TableHeaderColumn>
            <TableHeaderColumn dataField='timestamp' dataFormat={v=>moment(v*1000).format('YYYY-MM-DD HH:mm')} width={'20%'}>{t('Date')}</TableHeaderColumn>
        </BootstrapTable>
    </div> : <NotFound/>

};
export default Lottery;

