const fs = require("fs");
const path = require("path")
let Colors = {
    Reset: "\x1b[0m",
    Bright: "\x1b[1m",
    Dim: "\x1b[2m",
    Underscore: "\x1b[4m",
    Blink: "\x1b[5m",
    Reverse: "\x1b[7m",
    Hidden: "\x1b[8m",

    FgBlack: "\x1b[30m",
    FgRed: "\x1b[31m",
    FgGreen: "\x1b[32m",
    FgYellow: "\x1b[33m",
    FgBlue: "\x1b[34m",
    FgMagenta: "\x1b[35m",
    FgCyan: "\x1b[36m",
    FgWhite: "\x1b[37m",

    BgBlack: "\x1b[40m",
    BgRed: "\x1b[41m",
    BgGreen: "\x1b[42m",
    BgYellow: "\x1b[43m",
    BgBlue: "\x1b[44m",
    BgMagenta: "\x1b[45m",
    BgCyan: "\x1b[46m",
    BgWhite: "\x1b[47m",
}

let packageJSON = ReadFile("package.json")
let packagelockJSON = ReadFile("package-lock.json")
let nexusDependies = ReadFile("dependies.json")['dependencies']
let dependencies = packagelockJSON["dependencies"]

function ReadFile(filename) {
    let res
    let filePath = path.join(__dirname, `/${filename}`);
    let data = fs.readFileSync(filePath, 'utf8');
    res = JSON.parse(data);
    return res;
}

function makeColor(obj, color) {
    return {Set: obj, color: color, add: obj.add.bind(obj)}
}

let PACKAGE_JSON = "версии не те в package.json"
let REQUIREMENTS = "доп зависимости requirements"
let NOT_IMPORTANT = "Не важно, но проверить"
let NEXUS_ERROR = "Нет в NEXUS ДИТ"

let allCodeNames = {
    [PACKAGE_JSON]: makeColor(new Set(), Colors.FgRed),
    [NEXUS_ERROR]: makeColor(new Set(), Colors.FgCyan),
    [REQUIREMENTS]: makeColor(new Set(), Colors.FgYellow),
    [NOT_IMPORTANT]: makeColor(new Set(), Colors.FgWhite),
}

// Форматирование в виде <packet>@<version>
function formatPacket(packName, version) {
    return `${packName}@${version}`
}

function isInPackageJSON(packName) {
    return packageJSON.dependencies[packName]
}

// Есть ли в нексусе такая версия пакета
function isInNexus(packName, version) {
    return nexusDependies[packName].includes(version)
}

// Функция распределения видов ошибок
function pushInBucket(packName, version) {
    if (nexusDependies[packName]) {
        if (!isInNexus(packName, version)) {
            if (isInPackageJSON(packName)) {
                allCodeNames[PACKAGE_JSON].add(formatPacket(packName, version))
            } else {
                allCodeNames[NOT_IMPORTANT].add(formatPacket(packName, version))
            }
        }
    } else {
        allCodeNames[NEXUS_ERROR].add(formatPacket(packName, version))
    }
}

// Проверка доп.зависимостей
function checkDeepDependencies(v, packName) {
    for (let libName in v.requires) {
        let c = v.requires[libName]
        //TODO: Check ^ version
        if (typeof (c) == "object") {
            if (!isInNexus(libName, c.version)) {
                allCodeNames[REQUIREMENTS].add(formatPacket(libName, c.version))
            }
        }
    }
}
// TODO: Add date check
function runCode(Dep) {
    for (let packName in Dep) {
        if (Dep.hasOwnProperty(packName)) {
            let v = Dep[packName]
            pushInBucket(packName, v.version)
            if (v.requires) {
                checkDeepDependencies(v, packName)
            }
        }
    }

    for (let str in allCodeNames) {
        console.log(Colors.FgBlue, str)
        for (let k of allCodeNames[str].Set) {
            console.log(allCodeNames[str].color, `\t->${k}`)
        }
        console.log(Colors.FgBlue, "\n")
    }

}

runCode(dependencies)
