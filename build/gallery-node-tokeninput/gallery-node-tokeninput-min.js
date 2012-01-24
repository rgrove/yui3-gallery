YUI.add("gallery-node-tokeninput",function(c){var r=c.config.doc,f=c.Lang,p=c.Node,k=c.Array,j=c.bind(c.ClassNameManager.getClassName,null,"tokeninput"),o=8,m=46,e=40,h=13,q=37,i=39,n=38,a={},d="delimiter",b="tokens",g="value";function l(){l.superclass.constructor.apply(this,arguments);}c.extend(l,c.Plugin.Base,{BOX_TEMPLATE:"<div/>",CONTENT_TEMPLATE:"<div/>",INPUT_TEMPLATE:'<input type="text" autocomplete="off">',ITEM_TEMPLATE:"<li/>",LIST_TEMPLATE:"<ul/>",REMOVE_TEMPLATE:'<a href="#" title="Remove"><span role="img">\u00D7</span></a>',initializer:function(t){var v={},u={},s;c.Object.each(l.CLASS_NAMES,function(x,w){u[w]="."+x;},this);v[o]=this._keyBackspace;v[m]=this._keyDelete;v[e]=this._keyDown;v[h]=this._keyEnter;v[q]=this._keyLeft;v[i]=this._keyRight;v[n]=this._keyUp;this._host=this.get("host");this._keys=v;this._selectors=u;s=this._tokenizeValue(this._host,null,{all:true,updateUI:false});if(s){this.set(b,this.get(b).concat(s));}this._render();this._bind();this._sync();},destructor:function(){var s=this._events;while(s&&s.length){s.pop().detach();}},add:function(v,t){var w=[],s=[],u=this.get(b);v=f.isArray(v)?v:v.split(this.get(d));k.each(v,function(y,x){y=f.trim(y);if(y){w.push(y);s.push(this._createItem({text:y,token:true}));this.fire("addToken",{token:y});}},this);if(s.length&&w.length){s=c.all(s).toFrag();if((t||t===0)&&t<u.length){u=u.concat();u.splice.apply(u,[t,0].concat(w));this._tokenNodes.item(t).insert(s,"before");}else{u=u.concat(w);this._inputItem.insert(s,"before");}this._tokenNodes.refresh();this.set(b,u,{atomic:true});}return this;},clear:function(){this._tokenNodes.remove(true);this._tokenNodes.refresh();return this.set(b,[],{atomic:true});},remove:function(t){var u=this.get(b).concat(),s=u[t];u.splice(t,1);this._tokenNodes.item(t).remove(true);this._tokenNodes.refresh();this.fire("removeToken",{token:s,tokenIndex:t});return this.set(b,u,{atomic:true});},_bind:function(){var t=this._list,s=this._selectors;if(!this._events){this._events=[];}this._events.concat([this._boundingBox.after({blur:this._afterBlur,focus:this._afterFocus},null,this),t.delegate({blur:this._onTokenBlur,focus:this._onTokenFocus,mouseover:this._onTokenMouseOver,mouseout:this._onTokenMouseOut},s.token,this),t.delegate(c.UA.gecko?"keypress":"keydown",this._onKey,s.input+","+s.token,this),t.delegate("click",this._onRemoveClick,s.remove,this),this.after({fauxInputChange:this._afterFauxInputChange,removeButtonChange:this._afterRemoveButtonChange,tokensChange:this._afterTokensChange})]);},_clearItems:function(){this._list.all(this._selectors.item).remove(true);},_createItem:function(t){var v=l.CLASS_NAMES,u=p.create(this.ITEM_TEMPLATE),s;if(!t){t=a;}u.addClass(v.item);k.each(["editable","hidden","token"],function(w){if(t[w]){u.addClass(v[w]);}});if(t.editable){s=p.create(this.INPUT_TEMPLATE).addClass(v.input);s.on("valueChange",this._afterInputValueChange,this);u.append(s);}if(t.token){u.setAttrs({tabIndex:0,text:t.text||""});if(this.get("removeButton")){u.addClass(v.hasremove).append(p.create(this.REMOVE_TEMPLATE).addClass(v.remove).set("role","button"));}}return u;},_focusNext:function(u){var t=this._selectors,s;u=u.ancestor(t.item,true);s=u&&u.next(t.token);if(s){s.focus();}else{this._inputNode.focus();}return true;},_focusPrev:function(u){var s=this._selectors,t;u=u.ancestor(s.item,true);t=u&&u.previous(s.token);if(t){t.focus();}else{return false;}return true;},_getSelection:function(w){var u=p.getDOMNode(w),t={end:0,start:0},v,x,s;if("selectionStart" in u){t.start=u.selectionStart;t.end=u.selectionEnd;}else{if(u.createTextRange){x=u.value;v=x.length;s=r.selection.createRange().duplicate();s.moveEnd("character",v);t.start=s.text===""?v:x.lastIndexOf(s.text);s.moveStart("character",-v);t.end=s.text.length;}}return t;},_keyBackspace:function(v){var u=v.currentTarget,s,t;if(u.hasClass(l.CLASS_NAMES.input)){t=this._getSelection(u);if(t.start!==0||t.end!==0){return false;}return this._focusPrev(u);}u=u.ancestor(this._selectors.token,true);s=this._tokenNodes.indexOf(u);if(!u||s===-1){return false;}(this._focusPrev(u)||this._focusNext(u));this.remove(s);return true;},_keyDelete:function(u){var t=u.currentTarget,s;if(!t.hasClass(l.CLASS_NAMES.token)){return false;}s=this._tokenNodes.indexOf(t);if(s===-1){return false;}this._focusNext(t);this.remove(s);return true;},_keyDown:function(s){return this._keyRight(s);},_keyEnter:function(t){var s=f.trim(this._inputNode.get(g));if(!this.get("tokenizeOnEnter")||!s){return false;}this._tokenizeValue(null,null,{all:true});},_keyLeft:function(t){var s=t.currentTarget;if(s.hasClass(l.CLASS_NAMES.input)&&this._getSelection(s).start!==0){return false;}return this._focusPrev(s);},_keyRight:function(t){var s=t.currentTarget;if(s.hasClass(l.CLASS_NAMES.input)){return false;}return this._focusNext(s);},_keyUp:function(s){return this._keyLeft(s);},_refresh:function(){if(this._tokenNodes){this._tokenNodes.refresh();}else{this._tokenNodes=this._list.all(this._selectors.token);}},_render:function(){var u=l.CLASS_NAMES,t=p.create(this.BOX_TEMPLATE),s=p.create(this.CONTENT_TEMPLATE);s.addClass(u.content);t.addClass(u.box).addClass(u.os).set("tabIndex",-1).append(s);this._set("boundingBox",t);this._set("contentBox",s);this._boundingBox=t;this._contentBox=s;this._renderList();this._host.addClass(u.host).insert(t,"after");},_renderList:function(){var s=p.create(this.LIST_TEMPLATE);s.addClass(l.CLASS_NAMES.list);this._list=s;this._set("listNode",s);this._contentBox.append(s);},_setTokens:function(s){return k.filter(s,function(t){return !!f.trim(t);});},_sync:function(){var s=[],t=this.get(b);this._contentBox[this.get("fauxInput")?"addClass":"removeClass"](l.CLASS_NAMES.fauxinput);k.each(t,function(v,u){s.push(this._createItem({text:f.trim(v),token:true}));},this);this._inputItem=this._createItem({editable:true});this._inputNode=this._inputItem.one(this._selectors.input);this._set("inputNode",this._inputNode);s.push(this._inputItem);s=c.all(s).toFrag();this._clearItems();this._list.append(s);
this._refresh();this._syncHost();},_syncHost:function(){this._host.set(g,this.get(b).join(this.get(d)));},_tokenizeValue:function(t,u,s){var v;s=c.merge({updateUI:true},s||a);if(!t){t=this._inputNode;}if(!u&&u!==""){u=t.get(g);}v=u.split(this.get(d));if(s.all||v.length>1){if(s.all){u="";}else{u=f.trim(v.pop());}if(s.updateUI){t.set(g,u);if(v.length){this.add(v);}}}if(s.updateUI){t.setStyle("width",Math.max(5,u.length+3)+"ex");}return v;},_afterBlur:function(t){var s=this;if(this.get("tokenizeOnBlur")){setTimeout(function(){s._tokenizeValue(null,null,{all:true});},100);}},_afterFauxInputChange:function(s){this._sync();},_afterFocus:function(t){var s=this;if(!t.target.ancestor(this._selectors.item,true)){setTimeout(function(){s._inputNode.focus();},1);}},_afterInputValueChange:function(s){this._tokenizeValue(s.currentTarget,s.newVal);},_afterRemoveButtonChange:function(s){this._sync();},_afterTokensChange:function(s){if(s.atomic){this._syncHost();}else{this._sync();}},_onKey:function(t){var s=this._keys[t.keyCode];if(s){if(s.call(this,t)!==false){t.preventDefault();}}},_onRemoveClick:function(t){var s=t.currentTarget.ancestor(this._selectors.item);t.preventDefault();this.remove(this._tokenNodes.indexOf(s));},_onTokenBlur:function(s){s.currentTarget.removeClass(l.CLASS_NAMES.focus);},_onTokenFocus:function(s){s.currentTarget.addClass(l.CLASS_NAMES.focus);},_onTokenMouseOut:function(s){s.currentTarget.removeClass(l.CLASS_NAMES.hover);},_onTokenMouseOver:function(s){s.currentTarget.addClass(l.CLASS_NAMES.hover);}},{NAME:"pluginTokenInput",NS:"tokenInput",ATTRS:{boundingBox:{readOnly:true},contentBox:{readOnly:true},delimiter:{value:","},fauxInput:{value:false},inputNode:{readOnly:true},listNode:{readOnly:true},removeButton:{value:!!c.UA.mobile},tokenizeOnBlur:{value:true},tokenizeOnEnter:{value:true},tokens:{setter:"_setTokens",value:[]}},CLASS_NAMES:{box:j(),content:j("content"),editable:j("editable"),fauxinput:j("fauxinput"),focus:j("focus"),hasremove:j("hasremove"),hidden:j("hidden"),host:j("host"),hover:j("hover"),input:j("input"),item:j("item"),list:j("list"),os:j(c.UA.os),remove:j("remove"),token:j("token")}});c.Plugin.TokenInput=l;},"gallery-2011.08.24-23-44",{requires:["array-extras","classnamemanager","event-focus","event-valuechange","node-event-delegate","node-pluginhost","node-style","plugin"],skinnable:true});