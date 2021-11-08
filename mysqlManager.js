var mysql = require('mysql');

//MYSQL LOGIN
//host: mysql.fabiandingemans.nl
//username: InsaneEditor
//database: InsaneEditor
//password: aHjhWTU8YR6zP2mC

const pool  = mysql.createPool({
    connectionLimit : 10,
    host            : 'mysql.fabiandingemans.nl',
    user            : 'InsaneEditor',
    password        : 'aHjhWTU8YR6zP2mC',
    database        : 'InsaneEditor'
});

function executeQuery(sqlQuery){
    pool.query(sqlQuery, (error, results, fields) => {
        if (error) throw error;
    });
}

//TODO save client
const saveClient = (clientToken, clientId) => {
    pool.query("UPDATE `servers` SET `socketClientId`='"+clientId+"', `socketServerId`='"+clientId+"' WHERE `authKey`='"+clientToken+"'; ", (error, results, fields) => {
        if (error) throw error;
    });
}

//TODO delete client
const deleteClient = (clientToken) => {
    console.log("MYSQL: Delete Client "+clientToken);
}

//TODO get client
const getClient = (clientToken) => {
    console.log("MYSQL: Get Client "+clientToken);
    return "";
}

//TODO client exists
const clientExists = (clientToken) => {
    console.log("MYSQL: check client "+clientToken);
    return true;
}

exports.saveClient = saveClient;
exports.deleteClient = deleteClient;
exports.getClient = getClient;
exports.clientExists = clientExists;