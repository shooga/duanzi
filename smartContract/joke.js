"use strict";

var JokeItem = function(text) {
	if (text) {
		var obj = JSON.parse(text);
		this.key = obj.key;
		this.value = obj.value;
		this.author = obj.author;
		this.upVoteNum = obj.upVoteNum;
		this.downVoteNum = obj.downVoteNum;
	} else {
	    this.key = "";
	    this.author = "";
	    this.value = "";
		this.upVoteNum = 0;
		this.downVoteNum = 0;		
	}
};

JokeItem.prototype = {
	toString: function () {
		return JSON.stringify(this);
	}
};

var JokeRepo = function () {
    LocalContractStorage.defineMapProperty(this, "repo", {
        parse: function (text) {
            return new JokeItem(text);
        },
        stringify: function (o) {
            return o.toString();
        }
    });
};

JokeRepo.prototype = {
    init: function () {
        // todo
    },

	// 序号
	getSeq: function()
	{
		var seq = LocalContractStorage.get("seq");
		if (seq == undefined)
			seq = 0;
		
		seq++;
		LocalContractStorage.set("seq", seq);
		return seq.toString();
	},
	
	// 添加日志
	addJokeKey: function(key)
	{
		var jokes = LocalContractStorage.get("jokes");
		if (jokes == undefined)
			jokes = [];
		
		jokes.push(key);
		LocalContractStorage.set("jokes", jokes);
	},	

	// 添加段子
    addJoke: function (value) 
	{
        var from = Blockchain.transaction.from;

        var jokeItem = new JokeItem();
		jokeItem.key = this.getSeq();
        jokeItem.author = from;
        jokeItem.value = value;

        this.addJokeKey(jokeItem.key);
		
		this.repo.put(jokeItem.key, jokeItem);
    },

	// 随机获取一个段子
    getJoke: function () 
	{
        var jokes = LocalContractStorage.get("jokes");
		if (jokes == undefined)
			return "";
		
		var r = Math.floor(Math.random() * jokes.length);
		var key = jokes[r];
		return this.repo.get(key);
    },
	
	// 点赞
	upVote: function (key) 
	{
		var jokeItem = this.repo.get(key);
		if (jokeItem == undefined)
			throw new Error("can't find joke");
		
		jokeItem.upVoteNum++;
		this.repo.put(key, jokeItem);
	},
	
	// 鄙视
	downVote: function (key) 
	{
		var jokeItem = this.repo.get(key);
		if (jokeItem == undefined)
			throw new Error("can't find joke");
		
		jokeItem.downVoteNum++;
		this.repo.put(key, jokeItem);
	}
};
module.exports = JokeRepo;