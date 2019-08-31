let path = require('path');

let debug = () => {};
const cwd = process.cwd ();
try {

    debug = require (`debug`)('smartplatform:server:update');
} catch (error) {
    debug = require (`${cwd}/node_modules/debug`)('smartplatform:server:update');
}


let app = require(path.resolve(__dirname, '../server/server'));
let pgSource = app.datasources.postgres;

let updateConstraints = (models, callback) => {
    let constraintsQuery = '';

    Object.keys (models).forEach (modelName => {
        let model = models [modelName];
        let relations = model.relations;
        Object.keys (relations || {}).forEach (relationName => {
            let relation = relations [relationName];

            if (relation.type === 'belongsTo') {
                // Контроль целостности при удалении, возможные значения (от регистра не зависит)
                // relation.onDelete:
                // 'NO ACTION' - возвращает ошибку если есть ссылки на удаляемый объект
                // 'SET NULL' - устанавливает все ссылки на удалаемы объект в NULL (по умолчанию)
                // 'CASCADE' - удаляет все записи которые ссылаются на удаляемый объект
                // 'SET DEFAULT' - устанавливает все ссылки на удаляемый объект значением по умолчанию
                let onDelete = relation.options.onDelete || 'SET NULL';
                constraintsQuery += `
						ALTER TABLE "${modelName}" DROP CONSTRAINT IF EXISTS ${modelName}_${relation.modelTo.modelName}_${relation.keyTo}_fk;
						ALTER TABLE "${modelName}" DROP CONSTRAINT IF EXISTS ${modelName}_${relation.keyFrom}_${relation.keyTo}_fk;
						ALTER TABLE "${modelName}" ADD  CONSTRAINT ${modelName}_${relation.keyFrom}_${relation.keyTo}_fk
							FOREIGN KEY ("${relation.keyFrom}") REFERENCES "${relation.modelTo.modelName.toLowerCase ()}" ("${relation.keyTo}") ON DELETE ${onDelete};
					`.toLowerCase ();
            };
        });
    });
    //console.log(constraintsQuery)
    pgSource.connector.execute (constraintsQuery, callback);
};

console.log ('Updating models...');

pgSource.autoupdate (function (error) {
    console.error (error || 'OK');

    console.log ('Updating constraints...');
    updateConstraints (pgSource.models, (error) => {
        console.error (error || 'OK');
        // NOTE: похоже единственный способ остановить сервер
        process.exit ();
    });
});