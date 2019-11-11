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
            this.isLoading = false;
            if (res.data.error) {
                console.warn('WARN', res.data, path);
                this.alert = {isOpen: true, path, color: "warning", ...res.data};
                if (res.data.error)
                    return {error: res.data.error}
            }
            this.alert = {isOpen: false};
            //const stop = new Date().valueOf();
            //console.log(path, stop - start);
            return res.data;

        } catch (e) {

            if (!e.response){
                this.alert = {isOpen: true, path, color: "danger",  message: e.toJSON().message};
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
                    this.alert = {isOpen: true, error: e.response.status, message: e.response.statusText, color: "danger", path};
            }
            this.isLoading = false;
            return {error: e.response.status}
        }

    }

}

//window.APP_STORE = new API();
export default new API();