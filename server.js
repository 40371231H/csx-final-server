const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const MongoClient = require('mongodb').MongoClient;
const objectID = require('mongodb').ObjectID;

var url = 'mongodb://127.0.0.1';
var dbName = 'CSX2003_Final_Project';
var mySheet = 'todo';

// 設定預設port為 1377，若系統環境有設定port值，則以系統環境為主
app.set('port', (process.env.PORT || 1377));

// 設定靜態資料夾
app.use(express.static('public'));

var response = {
    result: false,
    data: {
        all: [],
        completed: [],
        todo: []
    }
};

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

// 將資料抓取至 query
app.get('/query', (req, res) => {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    // 從 mongodb 抓取資料
    MongoClient.connect(url, (err, client) => {
        if (err) {
            response.result = false;
            response.message = "資料庫連接失敗，" + err.message;
            res.json(response);
            return;
        }

        const db = client.db(dbName);
        db.collection(mySheet, (err, collection) => {
            if (err) {
                console.log('資料庫內無名為 Todo 的 collection');
                db.createCollection(mySheet);
            }

            collection.find().toArray((error, docs) => {
                if (error) {
                    console.log('查詢 Todo 資料失敗');
                    return;
                }

                if (docs === []) {
                    console.log('目前無資料喔！');
                } else {
                    console.log(docs);
                    response.result = true;
                    response.data.all = docs;
                }
            });

            collection.find({ "complete": false }).toArray((error, docs) => {
                if (error) {
                    console.log('查詢 Todo 資料失敗');
                    return;
                }

                if (docs === []) {
                    console.log('目前無資料喔！');
                } else {
                    console.log(docs);
                    response.result = true;
                    response.data.todo = docs;
                }
            });

            collection.find({ "complete": true }).toArray((error, docs) => {
                if (error) {
                    console.log('查詢 Todo 資料失敗');
                    return;
                }

                if (docs === []) {
                    console.log('目前無資料喔！');
                } else {
                    console.log(docs);
                    response.result = true;
                    response.data.completed = docs;
                }
            });

            res.json(response);
        });
    });
});

// 新增 To-Do 項目
app.post('/insert', (req, res) => {

    // 新增資料
    MongoClient.connect(url, (err, client) => {
        if (err) {
            response.result = false;
            response.message = "資料庫連接失敗，" + err.message;
            res.json(response);
            return;
        }
        const db = client.db(dbName);
        db.collection(mySheet, (error, collection) => {
            if (error) {
                console.log('資料庫查無名為 Todo 的 collection');
            }

            var insert = {
                task: req.body.task,
                complete: false
            };
            // console.log(insert);
            collection.insert(insert, (err, result) => {
                if (err) {
                    console.log('資料插入失敗');
                    return;
                }
            });
            collection.find().toArray((err, docs) => {
                if (err) {
                    console.log('查詢 Todo 資料失敗');
                    return;
                }
                client.close();
                // console.log('資料庫中斷連線');
            });

        });
        res.json(response);
    });
});

// 更新 To-Do 完成狀態
app.post('/update', (req, res) => {
    var data = {
        _id: req.body._id,
        task: req.body.task,
        complete: req.body.complete
    };

    var response = {
        result: true,
        data: {
            all: data
        }
    };

    MongoClient.connect(url, (err, client) => {
        if (err) {
            response.result = false;
            response.message = "資料庫連接失敗，" + err.message;
            res.json(response);
            return;
        }

        // 更新資料

        var filter = {
            _id: objectID(data._id)
        };

        const db = client.db(dbName);
        db.collection(mySheet, (error, collection) => {
            if (error) {
                console.log('資料庫查無名為 Todo 的 collection');
            }
            collection.findOne(filter, (err, docs) => {
                var update = {
                    task: docs.task,
                    completed: !docs.completed
                };
                collection.update(filter, update, (err, result) => {
                    if (err) {
                        console.log('更新資料失敗');
                        return;
                    }
                    console.log('更新 ' + result.modifiedCount + ' 筆資料成功');
                });
                client.close();
                // console.log('資料庫中斷連線');
            });
        });
        res.json(response);
    });
});

// 刪除 To-Do 項目
app.post('/delete', (req, res) => {
    var data = {
        _id: req.body._id,
        task: req.body.task
    };
    var response = {
        result: true,
        data: {
            all: data
        }
    };

    MongoClient.connect(url, (err, client) => {
        if (err) {
            response.result = false;
            response.message = "資料庫連接失敗，" + err.message;
            res.json(response);
            return;
        }

        // 刪除資料
        var filter = {
            _id: objectID(data._id)
        };
        const db = client.db(dbName);
        db.collection(mySheet, (error, collection) => {
            if (error) {
                console.log('資料庫查無名為 Todo 的 collection');
            }
            collection.remove(filter);
            res.json(response);
        });
    });

});

// 啟動且等待連接
app.listen(app.get('port'), () => {
    console.log('Server running at http://127.0.0.1:' + app.get('port'));
});