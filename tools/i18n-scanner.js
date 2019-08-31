const fs = require('fs');
const walkSync = function(dir, filelist) {
    let files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function(file) {
        if (fs.statSync(dir + '/' + file).isDirectory()) {
            filelist = walkSync(dir + '/' + file, filelist);
        }
        else {
            filelist.push(dir+'/'+file);
        }
    });
    return filelist;
};

const files =walkSync('./client');
const langFile = 'public/locales/ru.json';
let langJson = JSON.parse(fs.readFileSync(langFile, 'utf-8'));
const regexp = /[^\w]t\('(.*?)'[\)|,]/g;
const regexp2 = /label: '(.*?)'/g;
const regexp3 = /title: '(.*?)'/g;

for(const file of files) {
    const content = fs.readFileSync(file)
    let result;
    while (result = regexp.exec(content)) {
        //console.log('found: ',lang[result[1]], result[1]);
        if (!langJson[result[1]]) {
            langJson[result[1]] = result[1];
        }
    }
    while (result = regexp2.exec(content)) {
        //console.log('found: ',lang[result[1]], result[1]);
        //console.log(result[1]);
        if (!langJson[result[1]]) {
            console.log(result[1]);
            langJson[result[1]] = result[1];
        }
    }
    while (result = regexp3.exec(content)) {
        //console.log('found: ',lang[result[1]], result[1]);
        //console.log(result[1]);
        if (!langJson[result[1]]) {
            console.log(result[1]);
            langJson[result[1]] = result[1];
        }
    }
}
fs.writeFileSync(langFile, JSON.stringify(langJson));
//console.log(langJson);