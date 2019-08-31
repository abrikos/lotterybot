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


const langFile = 'public/locales/ru.json';
const langJson = require('../'+langFile);
const translatedJson = require('../tools/translated.json');


for(let i =0; i < Object.keys(translatedJson).length; i++){
    const sourceKey = Object.keys(translatedJson)[i];
    const targetKey = Object.keys(langJson)[i];
    langJson[targetKey] = translatedJson[sourceKey];

}

fs.writeFileSync(langFile, JSON.stringify(langJson))

