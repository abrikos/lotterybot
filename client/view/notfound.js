import React, {useEffect, useState} from 'react';
import {t} from "client/Translator";


const NotFound = (props) => {
    return <div>
        <h1>404 {t('Not found')}</h1>
    </div>

};
export default NotFound;

