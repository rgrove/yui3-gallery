YUI.add("gallery-history-lite",function(A){YUI.add("gallery-history-lite",function(F){var O=F.config.win,J=F.config.doc.documentMode,M=encodeURIComponent,L=O.location,G=O.onhashchange!==undefined&&(J===undefined||J>7),H,E,D,P="history-lite:change";function C(S){var R=[];F.each(S,function(U,T){if(F.Lang.isValue(U)){R.push(M(T)+"="+M(U));}});return R.join("&");}function B(R){return decodeURIComponent(R.replace(/\+/g," "));}var I;if(F.UA.gecko){I=function(){var R=/#.*$/.exec(L.href);return R&&R[0]?R[0]:"";};}else{I=function(){return L.hash;};}function Q(R){L.hash=R;}function N(V){var W=D.parseQuery(H),S=D.parseQuery(V),U={},T={},R;F.each(S,function(Y,X){if(Y!==W[X]){U[X]=Y;R=true;}});F.each(W,function(Y,X){if(!S.hasOwnProperty(X)){T[X]=Y;R=true;}});if(R){D.fire(P,{changed:U,newVal:V,prevVal:H,removed:T});}}function K(R){H=R.newVal;}F.HistoryLite=D={add:function(T,R){var S=C(F.merge(D.parseQuery(I()),F.Lang.isString(T)?D.parseQuery(T):T));if(R){K({newVal:S});}Q(S);},get:function(R){var S=D.parseQuery(I());return R?S[R]:S;},parseQuery:function(U){var T=U.match(/([^\?#&]+)=([^&]+)/g)||[],W={},S,R,V;for(S=0,R=T.length;S<R;++S){V=T[S].split("=");W[B(V[0])]=B(V[1]);}return W;}};F.augment(D,F.Event.Target,true,null,{emitFacade:true});D.publish(P,{broadcast:2,defaultFn:K});H=I();if(G){F.Node.DOM_EVENTS.hashchange=true;F.on("hashchange",function(){N(I());},O);}else{E=E||F.later(50,D,function(){var R=I();if(R!==H){N(R);}},null,true);}},"@VERSION@",{requires:["event-custom"]});},"@VERSION@",{requires:["event-custom"]});