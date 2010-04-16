jQuery(document).ready(function($) {
		window.ijc = {
		//memeber variables
console_ijcwindow : document.getElementById("console_ijcwindow"),
code_ijcwindow : document.getElementById("code_ijcwindow"),
history_ijcwindow : document.getElementById("history_ijcwindow"),
//code_ijcwindow : jQuery("#code_ijcwindow"),
//history_ijcwindow : jQuery("#history_ijcwindow"),
mixedin : false,
cmd_history : [],
history_cursor : 0,

//member functions
//mixin, unmixin ijc into global namespace
mixin : function(){ 
if(!ijc.mixedin){
for(key in ijc) {
if(typeof(ijc[key])=='function') {
window["__original__"+key]=window[key];
window[key] = ijc[key];
}
} 
ijc.mixedin = true;
}
},
unmixin : function(){
			  if(ijc.mixedin){
				  for(key in ijc) {
					  if(typeof(ijc[key])=='function') {
						  window[key] = window["__original__"+key];
					  } 
				  }
				  ijc.mixedin = false;
			  }
		  },
		  //manipulate cmd_history
add_history : function(record){
				  if(ijc.cmd_history[ijc.cmd_history.length-1]!=record) 
					  ijc.cmd_history.push(record);
				  ijc.history_cursor = ijc.cmd_history.length;
			  },
prev_history : function(){
				   return ijc.history_cursor>0 ? ijc.cmd_history[--ijc.history_cursor] : undefined;
			   },
next_history : function(){
				   return ijc.history_cursor<ijc.cmd_history.length-1 ? ijc.cmd_history[++ijc.history_cursor] : undefined;
			   },

			   //output to stdout
outputbuf : [],
		  MAX_HISTORY_BYTES : 65536,
		  flush : function() {
			ijc.history_ijcwindow.value+=ijc.outputbuf.join('');
			ijc.outputbuf=[];
			var len = ijc.history_ijcwindow.value.length;
			if(len>ijc.MAX_HISTORY_BYTES)
				ijc.history_ijcwindow.value = ijc.history_ijcwindow.value.substring(len-ijc.MAX_HISTORY_BYTES,len-1);
			ijc.history_ijcwindow.scrollTop=ijc.history_ijcwindow.scrollHeight;
		  },
		  
print : function(text) {
			ijc.outputbuf.push(text);
		},
puts : function(text) {
		   ijc.print(text+"\n");
	   },
inspect : function(obj) {
			  var str = obj;
			  if(typeof obj == "string"){
			  }else if(obj instanceof Array){
				  str = "["+obj+"]"
			  }else{
				  var kv = [];
				  for(key in obj) { kv.push(key+":"+obj[key]); }
				  if(kv.length>0) {str = "{"+kv.join(", ")+"}";}
			  }
			  return str;
		  },
clear : function(){
			ijc.outputbuf = [];
			history_ijcwindow.value = "";
		},
common_substring : function(array) {
					   if(array.length==0) return undefined;
					   if(array.length==1) return array[0];
					   var common = array[0];
					   for(i=1;i<array.length;i++){
						   var str = array[i];
						   var len = str.length > common.length ? str.length : common.length;
						   for(j=0;j<len;j++){
							   if(str[j]!=common[j]) break;
						   }
						   common = common.substr(0,j);
					   }
					   return common;
				   },
				   //auto completion
hint : function(word) {
		   var stub = "";
		   var stub2 = "";
		   var context = "";
		   var partial="";
		   //get the last word in the sentence
		   if(m = word.match(/^(.*[^\w.])?(([\w.]+)\.)$/)){
			   //end with '.'
			   stub = (m[1]||"")+(m[2]||"");
			   stub2 = m[2]||"";
			   context = m[3]||"";
			   partial = "";
		   }else if(m = word.match(/^(.*[^\w.])?(([\w.]+)\.)?(\w+)$/)){
			   //context
			   stub = (m[1]||"")+(m[2]||"");
			   stub2 = m[2]||"";
			   context = m[3]||"window";
			   partial = m[4]||"";
		   }
		   try{
			   var replacements = [];
			   var results = [];
			   var r = eval(context);
			   if(!(r instanceof Array)){
				   for(key in r){
					   if(key.indexOf(partial)==0 || partial.length==0){
						   replacements.push(stub+key);
						   typeof(r[key])=='function' ? results.push(stub2+key+'()') : results.push(stub2+key);
					   }
				   }
				   return {rep: ijc.common_substring(replacements), hints:results};
			   } else {
				   return undefined;
			   }
		   }catch(err){
			   return undefined;
		   }
	   }


};

ijc.console_ijcwindow.onsubmit = function() {
	var c=ijc.code_ijcwindow;
	var r;
	ijc.puts(">> "+c.value);
	ijc.add_history(c.value);
	try{ r=eval(c.value) } catch(err){ r="Error: "+err.description }
	if(r!=undefined) ijc.puts(ijc.inspect(r));
	ijc.flush();
	c.focus();
	c.select();
	return false;
}
$('#code_ijcwindow').keydown(function(event){
		switch(event.keyCode){
		case 9: //tab
		if(hints = ijc.hint(ijc.code_ijcwindow.value)){
		if(hints.hints.length==0){
		}else if(hints.hints.length==1){
		ijc.code_ijcwindow.value = hints.rep;
		}else{
		ijc.puts('(hint)');
		for(i=0;i<hints.hints.length;i++) ijc.print(hints.hints[i]+"        ");
		ijc.puts('');
		if(hints.rep) ijc.code_ijcwindow.value = hints.rep;
		}
		}
		ijc.flush();
		break;
		case 38://up arrow
		ijc.code_ijcwindow.value= ijc.prev_history()||ijc.code_ijcwindow.value;
		break;
		case 40://down arrow
		ijc.code_ijcwindow.value= ijc.next_history()||ijc.code_ijcwindow.value;
		break;
		default:
		return true;
		}
		return false;
});
//prevent the code lost focus to submit button(it's next tabstop neighbour).
//but allow it lost focus to others, eg. people want to copy text in history window
$('#code_ijcsubmit').focus(function(){
		setTimeout(function(){ijc.code_ijcwindow.focus()},1);
		});
//mixin ijc methods into global space
ijc.mixin();
//set focus
ijc.code_ijcwindow.focus();
});
