import React, {useState} from 'react';
import {t} from "client/Translator";


const AccessDenied = () => {
    return <div>
        <h1>403 {t('Access denied')}</h1>
    </div>
};

export default AccessDenied;