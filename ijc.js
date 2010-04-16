jQuery(document).ready(function() {
		window.ijc = {
		//memeber variables
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
		  //TODO: tweakable in future
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
			  try{
			  if(typeof obj == "string"){
			  }else if(obj instanceof Array){
				  str = "["+obj+"]"
			  }else{
				  var kv = [];
				  for(key in obj) { kv.push(key+":"+obj[key]); }
				  if(kv.length>0) {str = "{"+kv.join(", ")+"}";}
			  }
			  }catch(err){}
			  return str;
		  },
clear : function(){
			ijc.outputbuf = [];
			history_ijcwindow.value = "";
		},
common_substring : function(array) {
					   if(array.length==0) return undefined;
					   if(array.length==1) return array[0];
					   //msie doesn't support indexing string, so convert it to array
					   if(jQuery.browser.msie){
						   var common = array[0].split('');
						   for(i=1;i<array.length;i++){
							   var str = array[i].split('');
							   var len = str.length > common.length ? str.length : common.length;
							   for(j=0;j<len;j++){
								   if(str[j]!=common[j]) break;
							   }
							   common = common.slice(0,j);
						   }
						   common = common.join('');
					   }
					   else{
						   var common = array[0];
						   for(i=1;i<array.length;i++){
							   var str = array[i];
							   var len = str.length > common.length ? str.length : common.length;
							   for(j=0;j<len;j++){
								   if(str[j]!=common[j]) break;
							   }
							   common = common.substr(0,j);
						   }
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
	   },
loaded_js : [],
loaded_css : [],
load : function(url,filetype){
		   //jQuery.getScript(url,function(r,s){ijc.puts("load '"+url+"' finished. status:"+s);ijc.flush();});
		   //borrowed from http://www.javascriptkit.com/javatutors/loadjavascriptcss.shtml
		   if(!filetype) filetype=url.match(/[^.]$/)[0];
		   if (filetype=="js" && ijc.loaded_js.indexOf(url)<0){
			   ijc.loaded_js.push(url);
			   var fileref=document.createElement('script');
				   fileref.setAttribute("type","text/javascript");
				   fileref.setAttribute("src", url);
				   document.getElementsByTagName("head")[0].appendChild(fileref);
				   return true;
		   }else if (filetype=="css" && ijc.loaded_css.indexOf(url)<0){
			   ijc.loaded_css.push(url);
			   var fileref=document.createElement("link");
				   fileref.setAttribute("rel", "stylesheet");
				   fileref.setAttribute("type", "text/css");
				   fileref.setAttribute("href", url);
				   document.getElementsByTagName("head")[0].appendChild(fileref);
				   return true;
		   }
		   return false;
	   },
loadjs : function(url){return ijc.load(url,'js');},
loadcss : function(url){return ijc.load(url,'css');},
evaluate : function() {
			   var c=ijc.code_ijcwindow;
			   var r;
			   ijc.puts(">> "+c.value);
			   ijc.add_history(c.value);
			   try{ r=eval(c.value) } catch(err){ r="Error: "+err.description }
			   if(r!=undefined) ijc.puts(ijc.inspect(r));
			   ijc.flush();
			   c.focus();
			   c.select();
		   }
};

jQuery('#code_ijcwindow').keydown(function(event){
		switch(event.keyCode){
		case 9: //tab
		var hints = ijc.hint(ijc.code_ijcwindow.value);
		if(hints){
		if(hints.hints.length==0){
		}else if(hints.hints.length==1){
		ijc.code_ijcwindow.value = hints.rep;
		}else{
		ijc.puts('(hint)');
		ijc.puts(hints.hints.join("\t\t"));
		ijc.flush();
		if(hints.rep) ijc.code_ijcwindow.value = hints.rep;
		}
		}
		break;
		case 38://up arrow
		ijc.code_ijcwindow.value= ijc.prev_history()||ijc.code_ijcwindow.value;
		break;
		case 40://down arrow
		ijc.code_ijcwindow.value= ijc.next_history()||ijc.code_ijcwindow.value;
		break;
		case 13://carriage return
		ijc.evaluate();
		break;
		default:
		return true;
		}
		return false;
});
jQuery('#code_ijcevaluate').click(function(){
		ijc.evaluate();
		});
//prevent the code lost focus to submit button(it's next tabstop neighbour).
//but allow it lost focus to others, eg. people want to copy text in history window
jQuery('#code_ijcevaluate').focus(function(){
		setTimeout(function(){ijc.code_ijcwindow.focus()},1);
		});
//mixin ijc methods into global space
ijc.mixin();
//set focus
ijc.code_ijcwindow.focus();
});
