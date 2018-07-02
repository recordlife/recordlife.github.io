"use strict";

// 定义实体
var Status = function (str) {
    if (str) {
        var obj = JSON.parse(str);
        this.from = obj.from;
        this.time = obj.time;
        this.text = obj.text;
    } else {
        this.from = "";
        this.time = "";
        this.text = "";
    }
};
Status.prototype = {
    toString: function () {
        return JSON.stringify(this);
    }
};


// 智能合约开发教程：https://github.com/nebulasio/wiki/tree/master/tutorials
var RecordLife = function () {
    // 定义一些属性
    LocalContractStorage.defineProperties(this, {
        builder: null,
        statusIndex: null,
        dateArray: null
    });

    // 用来存储每天的生活记录id，key为日期，value为对应日期的所有id
    LocalContractStorage.defineMapProperties(this, {
        dateToStatusIds: null //date array to ids
    });

    // 用来存储具体的生活记录，key为记录id，value为具体记录的内容
    LocalContractStorage.defineMapProperty(this, "indexToStatus", {
        // 定义读取时的反序列化方法
        parse: function (text) {
            return new Status(text);
        },

        // 定义存储时的序列化方法
        stringify: function (o) {
            return o.toString();
        }
    });
}

RecordLife.prototype = {
    // 初始化方法
    init: function () {
        this.builder = Blockchain.transaction.from;
        this.statusIndex = 0;
        this.dateArray = [];
    },

    // 定义私有方法，以_开头
    _dateFormat: function (time) {
        var date = new Date(time * 1000);
        return date.getMonth() + 1 + '-' + date.getDate() + '-' + date.getFullYear();
    },

    getStatusByID: function (id) {
        return this.indexToStatus.get(id);
    },

    getDateArray: function () {
        return this.dateArray;
    },

    /**
     *
     * @returns
     * {
            "account": "",
            "data": [
                {
                    "date": "",
                    "statuses": ["", ""]
                },
                {
                    "date": "",
                    "statuses": ["", ""]
                }
            ]
        };
     *
     */
    getBaseData: function () {
        var from = Blockchain.transaction.from;
        var result = {};
        result['data'] = [];

        // 获取所有日期
        var dateArray = this.dateArray;

        // 按日期获取数据
        if (dateArray.length > 0) {
            dateArray.forEach(date => {
                var d = {};
                d["date"] = date;
                var arr = [];
                // 获取对应日期的所有id，然后通过id获取具体记录
                var ids = this.dateToStatusIds.get(date)
                ids.forEach(id => {
                    var status = this.indexToStatus.get(id);

                    // 获取当前用户对应的所有生活记录
                    if(status.from === from) {
                        arr.push(status);
                    }
                });
                d["statuses"] = arr;

                // 将当日所有记录添加到数组中
                result['data'].push(d);
            });
        }
        result['account'] = from;

        return result;
    },

    postStatus: function (text, timestamp) {
        text = text.trim();
        if (text === "") {
            throw new Error("生活记录内容不能为空！");
        }
        if (text.length > 200) {
            throw new Error("生活记录内容不得超过200个字符！")
        }

        var from = Blockchain.transaction.from;
        var time = Blockchain.transaction.timestamp;
        if (timestamp > 0) {
            time = timestamp;
        }
        this.statusIndex++;
        var status = new Status();
        status.text = text;
        status.time = time;
        status.from = from;

        // 将生活记录id存储到
        var date = this._dateFormat(time);
        // 获取对应日期的所有id
        var ids = this.dateToStatusIds.get(date);

        // 如果对应日期还没有任何id
        if (!ids) {
            ids = [];
            var arr = this.dateArray;
            arr.push(date);
            // 将这个日期添加到日期数组中
            this.dateArray = arr;
        }

        // 将id存到对应的日期上
        ids.push(this.statusIndex);
        this.dateToStatusIds.set(date, ids);

        // 存储具体的生活记录
        this.indexToStatus.set(this.statusIndex, status);
    }
}

module.exports = RecordLife;