YUI.add("gallery-aui-live-search",function(N){var I=N.Lang,K=I.isString,J=I.isObject,B=I.isFunction,U="",H="data",M="delay",Q="hide",S="index",C="input",T="live-search",P="matchRegex",E="nodes",F="show",D="*",G=13,O=function(A){return(A instanceof N.NodeList);};var R=N.Component.create({NAME:T,ATTRS:{data:{value:function(A){return A.html();},validator:B},delay:{value:250},hide:{value:function(A){return A.hide();},validator:B},index:{value:[],validator:J},input:{setter:N.one},matchRegex:{validator:function(A){return(A instanceof RegExp);},value:/(.)*/g},nodes:{setter:function(A){return this._setNodes(A);}},show:{value:function(A){return A.show();},validator:B}},EXTENDS:N.Base,prototype:{normalizedQuery:U,query:U,timer:null,initializer:function(){var A=this;A.refreshIndex();A.bindUI();},bindUI:function(){var A=this;var L=A.get(C);L.on("keyup",N.bind(A._inputKeyUp,A));A.publish("search",{defaultFn:A.search});},destroy:function(){var A=this;var L=A.get(C);L.detach("keyup");},filter:function(Y){var A=this;var W=[];var L=A.get(E);var V=A.get(S);A.query=Y;A.normalizedQuery=A._normalizeQuery(Y);var X=new RegExp(A.normalizedQuery);N.each(V,function(b,Z){var a=L.item(Z);W.push({content:b,match:X.test(b),node:a});});return W;},refreshIndex:function(){var A=this;var L=[];A.get(E).each(function(W){var V=I.trim(A.get(H).apply(A,[W]).toLowerCase());L.push(V);});A.set(S,L);},search:function(V){var A=this;var W=A.get(C).val();var L=A.filter(W);N.each(L,function(X){var Y=X.node;if(X.match){A.get(F).apply(A,[Y]);}else{A.get(Q).apply(A,[Y]);}});V.liveSearch.results=L;},_normalizeQuery:function(V){var A=this;var L=A.get(P);V=I.trim(V.toLowerCase());V=V.match(L).join(U);V=V.replace(D,U);V=I.escapeRegEx(V);return V;},_inputKeyUp:function(V){var A=this;var L=A.get(M);var W=V.keyCode;if(W=G){V.halt();}if(J(A.timer)){A.timer.cancel();}A.timer=N.later(L,A,function(){A.fire("search",{liveSearch:{inputEvent:V}});});},_setNodes:function(L){var A=this;if(O(L)){return L;}else{if(K(L)){return N.all(L);}}return new N.NodeList([L]);}}});N.LiveSearch=R;},"gallery-2010.08.18-17-12",{skinnable:false,requires:["gallery-aui-base"]});