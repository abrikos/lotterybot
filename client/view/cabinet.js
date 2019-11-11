import React, {Component, useEffect, useState} from 'react';
import {t} from "client/Translator";
import {Button} from "reactstrap";

export default (props) => {
    if(!props.auth){
        props.history.push('/login');
        return <div/>
    }
    const [count, setCount] = useState(0);

    useEffect(
        () => {
            document.title = `${count} Вы нажали  раз`;
        }
    )
    return <div>
        CABINET
        <Button onClick={() => setCount(count + 1)}>CLL</Button>
    </div>

}


