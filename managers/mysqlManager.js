var mysql = require('mysql');

//MYSQL LOGIN
//host: mysql.fabiandingemans.nl
//username: InsaneEditor
//database: InsaneEditor
//password: aHjhWTU8YR6zP2mC

var pool  = mysql.createPool({
    connectionLimit : 10,
    host            : 'mysql.fabiandingemans.nl',
    user            : 'InsaneEditor',
    password        : 'aHjhWTU8YR6zP2mC',
    database        : 'InsaneEditor'
});

export function executeQuery(sqlQuery){
    pool.query(sqlQuery, (error, results, fields) => {
        if (error) throw error;
    });
}

export function saveClient(token){

}

export function deleteClient(token){

}

export function getClient(token){

}
