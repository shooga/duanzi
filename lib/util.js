"use strict";

// 获取浏览器类型
function getBrowserInfo(){
	var ua = navigator.userAgent.toLocaleLowerCase();
	var browserType=null;
	if (ua.match(/msie/) != null || ua.match(/trident/) != null) {
	  browserType = "IE";
	  browserVersion = ua.match(/msie ([\d.]+)/) != null ? ua.match(/msie ([\d.]+)/)[1] : ua.match(/rv:([\d.]+)/)[1];
	} else if (ua.match(/firefox/) != null) {
	  browserType = "火狐";
	}else if (ua.match(/ubrowser/) != null) {
	  browserType = "UC";
	}else if (ua.match(/opera/) != null) {
	  browserType = "欧朋";
	} else if (ua.match(/bidubrowser/) != null) {
	  browserType = "百度";
	}else if (ua.match(/metasr/) != null) {
	  browserType = "搜狗";
	}else if (ua.match(/tencenttraveler/) != null || ua.match(/qqbrowse/) != null) {
	  browserType = "QQ";
	}else if (ua.match(/maxthon/) != null) {
	  browserType = "遨游";
	}else if (ua.match(/chrome/) != null) {
	  var is360 = _mime("type", "application/vnd.chromium.remoting-viewer");
	  function _mime(option, value) {
		var mimeTypes = navigator.mimeTypes;
		for (var mt in mimeTypes) {
		  if (mimeTypes[mt][option] == value) {
			return true;
		  }
		}
		return false;
	  }
	  if(is360){
		browserType = '360';
	  }else{
		browserType = 'chrome';
	  }
	}else if (ua.match(/safari/) != null) {
	  browserType = "Safari";
	}
	return browserType;
}


// 发起支付
var dappAddress = "n21vcQo9o9sNUAeTqsqZWehb81uHx3kL6sA";

//here we use neb.js to call the "get" function to search from the Dictionary
var nebulas = require("nebulas"),
Account = nebulas.Account,
neb = new nebulas.Neb();
neb.setRequest(new nebulas.HttpRequest("https://mainnet.nebulas.io"));

var api = neb.api;

var NebPay = require("nebpay");     //https://github.com/nebulasio/nebPay
var nebPay = new NebPay();
var serialNumber

var getCallback;

// 获取随机一个笑话
function silentGet(callFunction, callArgs, cb) 
{
	getCallback = cb;
	
	var from = Account.NewAccount().getAddressString();

	var value = "0";
	var nonce = "0"
	var gas_price = "1000000"
	var gas_limit = "2000000"
	var callFunction = "getJoke";
	var callArgs = "[]"; //in the form of ["args"]
	var contract = {
		"function": callFunction,
		"args": callArgs
	}

	neb.api.call(from,dappAddress,value,nonce,gas_price,gas_limit,contract).then(function (resp) {
		onGetDone(resp)
	}).catch(function (err) {
		console.log("error:" + err.message)
		getCallback(false, err.message);
	})
}

function onGetDone(resp) 
{
	var result = resp.result    ////resp is an object, resp.result is a JSON string
	console.log("return of rpc call: " + JSON.stringify(result))

	if (result === 'null'){
	} else{
		//if result is not null, then it should be "return value" or "error message"
		try{
			result = JSON.parse(result)
			getCallback(true, result);
		}catch (err){
			//result is the error message
			getCallback(false, result);
		}
	}
}


// 支付回调
var payCallback;

// 设置支付地址，测试网还是主网
function setPayConfig(addr, isMain)
{
	dappAddress = addr;
	if (isMain)
	{
		neb.setRequest(new nebulas.HttpRequest("https://mainnet.nebulas.io"));
	}
	else
	{
		neb.setRequest(new nebulas.HttpRequest("https://testnet.nebulas.io"));
	}
}

var maskDiv;

// 全屏遮挡
function showMaskDiv()
{
	maskDiv=document.createElement("div");  
	maskDiv.innerHTML = "<p style='position:absolute;left:50%;top:50%;font-size:23px;color:white;'>等待结果中...</p>";
	maskDiv.style.cssText="text-align: center;position: fixed;top: 0%;left: 0%;width: 100%;height: 100%;background-color: black;z-index:1010;-moz-opacity: 0.8;opacity:.80;filter: alpha(opacity=80);";
	document.body.appendChild(maskDiv);	
}

// 去除遮挡
function hideMaskDiv()
{
	if (maskDiv != null)
	{
		document.body.removeChild(maskDiv);	
		maskDiv = null;
	}
}

// 支付接口
function pay(value, callFunction, callArgs, cb)
{
	var browserType = getBrowserInfo();
	if (browserType != "chrome")
	{
		alert("目前只支持chrome浏览器");
		cb(false);
		return;
	}
	
    //to check if the extension is installed
    //if the extension is installed, var "webExtensionWallet" will be injected in to web page
    if (typeof (webExtensionWallet) === "undefined") {
        alert("请先安装星云钱包插件");
		cb(false);
		return;
    }	
	
	showMaskDiv();
	
	payCallback = cb;
	
	var to = dappAddress;
	serialNumber = nebPay.call(to, value, callFunction, callArgs, {    //使用nebpay的call接口去调用合约,
		listener: onPay        //设置listener, 处理交易返回信息
	});
}

var intervalQuery;
// 定时查询订单状态
function funcIntervalQuery(txhash) {
	console.log("查询支付订单：" + txhash);
	api.getTransactionReceipt({hash: txhash}).then(function(receipt) {
		console.log("支付订单查询结果: " + JSON.stringify(receipt));
		if (receipt.status == 1)
		{
			clearInterval(intervalQuery);
			hideMaskDiv();
			payCallback(true);
		}
		else if (receipt.status == 0)
		{
			clearInterval(intervalQuery);
			hideMaskDiv();
			payCallback(false);			
		}
			
	});	
}	

// 支付结果
function onPay(resp) {
	console.log("初步结果: " + JSON.stringify(resp));
	if (resp.txhash == undefined)
	{		
		hideMaskDiv();
		payCallback(false);
		return;
	}
	
	console.log("根据txhash查询支付订单状态");
	funcIntervalQuery(resp.txhash);
    intervalQuery = setInterval(function () {
            funcIntervalQuery(resp.txhash);
    }, 10000);
}
