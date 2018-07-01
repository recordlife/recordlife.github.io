"use strict";

var Status = function(str) {
    if (str) {
        var obj = JSON.parse(str);
        this.text = obj.text;
        this.time = obj.time;
        this.from = obj.from;
    } else {
        this.text = "";
        this.time = "";
        this.from = "";
    }
};

Status.prototype = {
    toString: function() {
        return JSON.stringify(this);
    }
};

var RecordLife = function() {
    LocalContractStorage.defineProperties(this, {
        builder: null,
        statusIndex: null,
        dateArray: null
    });
    LocalContractStorage.defineMapProperties(this, {
        dateToStatusIds: null //date array to ids
    });
    LocalContractStorage.defineMapProperty(this, "indexToStatus", {
        parse: function(text) {
            return new Status(text);
        },
        stringify: function(o) {
            return o.toString();
        }
    });
}

RecordLife.prototype = {
    init: function() {
        this.builder = Blockchain.transaction.from;
        this.statusIndex = 0;
        this.dateArray = [];
    },
    _dateFormat: function(time) {
        var date = new Date(time * 1000);
        return date.getMonth() + 1 + '-' + date.getDate() + '-' + date.getFullYear();
    },
    _isBuilder: function(addr) {
        if (addr !== this.builder) {
            throw new Error("you have no permission")
        }
    },
    getStatusByID: function(id) {
        return this.indexToStatus.get(id);
    },
    getDateArray: function() {

        return this.dateArray;
    },
    getBaseData: function() {
        var from = Blockchain.transaction.from;
        var result = {};
        result['data'] = [];
        var dateArray = this.dateArray;
        if (dateArray.length > 0) {
            dateArray.forEach(date => {
                var d = {};
            d["date"] = date;
            var arr = [];
            var ids = this.dateToStatusIds.get(date)
            ids.forEach(id => {
                var status = this.indexToStatus.get(id);
            arr.push(status);
        });
            d["statuses"] = arr;
            result['data'].push(d);
        });
        }
        result['account'] = from;
        return result;
    },


    postStatus: function(text, timestamp) {
        text = text.trim();
        if (text === "") {
            throw new Error("empty status");
        }
        if (text.length > 100) {
            throw new Error("status exceed limit length (100)")
        }
        var from = Blockchain.transaction.from;
        var time = Blockchain.transaction.timestamp;
        if (timestamp > 0) {
            this._isBuilder(from);
            time = timestamp;
        }
        this.statusIndex++;
        var status = new Status();
        status.text = text;
        status.time = time;
        status.from = from;

        var date = this._dateFormat(time);
        var ids = this.dateToStatusIds.get(date);
        if (!ids) {
            ids = [];
            var arr = this.dateArray;
            arr.push(date);
            this.dateArray = arr;
        }
        ids.push(this.statusIndex);
        this.dateToStatusIds.set(date, ids);

        this.indexToStatus.set(this.statusIndex, status);

    }


}

module.exports = RecordLife;