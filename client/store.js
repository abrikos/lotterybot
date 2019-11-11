import qs from 'qs';
import { createBrowserHistory } from 'history';

/**
 * Глобальный контейнер сторов
 */
export class AppStore {
    local; // Локальное хранилище
    model; // Хранилище моделей
    route; // Хранилище маршрута браузера
    api; // API обмена с сервером
    admin; // Хранилище @admin
    ui; // ui


    adminPath = '/admin';
    subscribers = [];

    constructor() {
        this.history = createBrowserHistory();
    }

    init = async () => {
        await this.model.connect();
        this.model.plurals = {};
        Object.values(this.model).forEach(value => {
            if (value && value.INFO && value.INFO.plural) {
                this.model.plurals[value.INFO.plural.toLowerCase()] = value;
                /*
                    value.prototype.downloadNginxFile = function(property) {
                        return this.downloadFile(property)
                            .replace('/api/containers/','/storage/')
                            .replace('/download','');
                    }
                */
            }
        });
    };
}

window.APP_STORE = new AppStore();

export default window.APP_STORE;
