
var NebPay = require("nebpay");
var nebPay = new NebPay();
// var dappAddress="n1vDPkwDN6z7cS9aCjYFbZvuUhAdTAVftiV"; //testnet
var dappAddress="n1kGbBoNqWRVHaCgD6GuAs6r49Bm8j2JJgm";
var account;

window.App = {
  start: function () {

    this.getBaseData();
  },

  msgTip:function(msg){
    this.msgclose();
    $('.modal-msg-content').html(msg);
    $('#modal-msg').addClass('active') 
  },

  msgclose:function(){
    $('.modal').removeClass('active')
  },

  ruleTip:function(){
    var html="<div class='card-body'>这是一个基于星云链的生活记录应用，每个人都可以创建值得记录的任何事情；</div>"
    html+="<div class='mt-3'>而你只需要付出很少的gas，就能将这件事情永久记录在星云链上；</div>"
    html+="<div class='mt-3'>美好的事情正在发生，由你书写！</div>"
    this.msgTip(html);
  },

  startLoading:function(){
    $('.loading-lg').removeClass('hide');
  },
  endLoading:function(){
    $('.loading-lg').addClass('hide');
  },

  statusLog:function(msg){
    var html=$('#status').html();
    html+="<div class='mt-2'>log："+msg+"</div>";
    $('#status').html(html);
  },


  getBaseData:function(){
    var self=this;
    this.startLoading();
    nebPay.simulateCall(dappAddress, "0", "getBaseData", "", {    
      listener: self.getBaseDataCB 
   });
  },

  getBaseDataCB:function(cb){
      App.endLoading();
      App.ruleTip();
      var result = JSON.parse(cb.result);
      if (result.length==0) return;

      account= result.account;
      console.log('当前账户：'+account);
      App.initStatuses(result.data);
  },

  addStatus:function(){
    $('#modal-record').addClass('active');
  },

  postStatus: function () {
    var self = this;
    var text=$('#status-input').val().trim();
    if(text==''){
      this.msgTip('事件不可为空')
    }else if(text.length>100){
      this.msgTip('事件太长了，不可以');
    }else{
      
      var callArgs= "[\"" + text + "\",0]";
      nebPay.call(dappAddress, "0", "postStatus", callArgs, {    
          listener: self.postStatusCB
      });
    }
  },

  postStatusCB:function(cb){
    if(cb.txhash) App.msgTip('正在发布中...稍后自行刷新');
    console.log('postStatusCB='+cb.result);
    
  },

  getNowDate:function(){
    var date= new Date();
    return date.getMonth()+1+'-'+date.getDate()+'-'+date.getFullYear();
  },

  initStatuses:function(dataArr){
    var now=this.getNowDate();
    console.log(dataArr);
    var html='';
    var nownull=true;
    dataArr.forEach(d => {
      if (d.date==now) {
        nownull=false;
        html+=this.tmpItem2(d.date,d.statuses);
      }else
        html+=this.tmpItem1(d.date,d.statuses);
    });
    if(nownull) html+=this.tmpItem2(now,[]);
    $('.timeline-items').html(html);
  },

  tmpItem1:function(date,statuses){
    var d=date.split('-');
    var html='<div class="timeline-item" ><div class="timeline-left"><a class="timeline-icon icon-lg" href="#"><i class="icon icon-check"></i></a></div><div class="timeline-content">'+d[0]+'.'+d[1]+'<span class="item-year ml-2">'+d[2]+'</span>';
    statuses.forEach(s => {
      html+='<div class="card p-1 mt-2"><div >'+s.text+'</div><div class="item-from mt-2 text-right">from：'+s.from+'</div></div>'
    });
    return html+='</div></div>';
  },

  tmpItem2:function(date,statuses){
    var d=date.split('-');
    var html='<div class="timeline-item" ><div class="timeline-left"><a class="timeline-icon icon-lg" href="#"><i class="icon icon-more-horiz"></i></a></div><div class="timeline-content">'+d[0]+'.'+d[1]+'<span class="item-year ml-2">'+d[2]+'</span>'+'<button class="btn float-right mt--2" onclick="App.addStatus()"><i class="icon icon-plus"></i></button>';
    statuses.forEach(s => {
      html+='<div class="card p-1 mt-3"><div >'+s.text+'</div><div class="item-from mt-2 text-right">from：'+s.from+'</div></div>'
    });
    return html+='<div class="mt-3">好的事情正在发生...</div></div></div>';
  },

};

window.addEventListener('load', function () {
  if(typeof(webExtensionWallet) === "undefined"){
    //alert ("Extension wallet is not installed, please install it first.")
    $("#noExtension").removeClass("hide");
    $(".mainPage").addClass('hide');
  }else{
      App.start();
  }

  
});
