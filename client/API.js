import {Component} from "react";
import axios from "axios";


class API {

    isAuth = async () => {
        const auth = await this.postData('/isAuth');
        return auth.authenticated;
    };

    getCookie(name) {
        const pattern = "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)";
        const matches = document.cookie.match(new RegExp(pattern, 'g'));
        return matches ? decodeURIComponent(matches[matches.length - 1].split('=')[1]) : undefined;
    }

    setCookie(name, value, options) {
        options = options || {};

        let expires = options.expires;

        if (typeof expires == "number" && expires) {
            let d = new Date();
            d.setTime(d.getTime() + expires * 1000);
            expires = options.expires = d;
        }
        if (expires && expires.toUTCString) {
            options.expires = expires.toUTCString();
        }
        if (typeof value === 'object') value = JSON.stringify(value);
        value = encodeURIComponent(value);

        let updatedCookie = name + "=" + value;
        if (!options.expires) options.expires = 300;
        for (let propName in options) {
            if (propName === 'expires') {
                const date = new Date(new Date().getTime() + options[propName] * 1000);
                options[propName] = date.toUTCString();
            }
            updatedCookie += "; " + propName;
            let propValue = options[propName];
            if (propValue !== true) {
                updatedCookie += "=" + propValue;
            }
        }

        document.cookie = updatedCookie;
    }

    async postData(path = '', data = {}) {
        console.log('POST', path)
        const url = '/api' + path;
        //const start = new Date().valueOf();
        this.isLoading = true;
        try {
            const res = await axios.post(url, data);
            if (res.data.error) {
                console.warn('WARN', res.data, path);
            }
            return res.data;

        } catch (e) {

            if (!e.response){

                return {error: 500, message: e.toJSON().message}
            }
            switch (e.response.status) {
                case 401:
                    //console.error('FETCH ERROR', path);
                    break;
                case 502:
                    this.serverOnline = false;
                    break;
                default:
            }
            return {error: e.response.status, message:e.response.statusText}
        }

    }

}

//window.APP_STORE = new API();
export default new API();