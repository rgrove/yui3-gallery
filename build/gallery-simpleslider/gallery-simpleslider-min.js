YUI.add("gallery-simpleslider",function(C){var A=C.namespace("apm"),B=function(G){B.superclass.constructor.apply(this,arguments);var F=C.one(G.node),D=F.one("> div"),E=D.one("> div");this.contentbox=F;this.valuebox=D;this.thumb=E;E.plug(C.apm.Center);this.dd=new C.DD.Drag({node:E}).plug(C.Plugin.DDConstrained,{constrain2node:F});};B.NAME="SimpleSlider";B.ATTRS={value:{value:[0,0],readonly:true}};C.extend(B,C.Base,{center:function(G,F){var E=this.thumb,D=E.dd;E.apm_center.to(G);G.target=E;D._handleMouseDownEvent(G);D._alignNode([G.pageX,G.pageY]);if(F){D._handleMouseUp(G);}return this;},render:function(){var F=this.thumb,D=F.dd,G=this.contentbox,E=this.valuebox;D.on("drag:drag",function(J){var L=E.getXY(),I=F.apm_center.calc(),H=I[0]-L[0],K=I[1]-L[1];this.set("value",[H,K]);},this);G.on("mousedown",function(H){this.center(H);},this);return this;},update:function(F){var H=this.thumb.get("region"),G=this.get("value"),I=this.thumb.apm_center.offset(),E=G[0]-F[0]-I[0],D=G[1]-F[1]-I[0];return this.center({pageX:H.left-E,pageY:H.top-D,halt:function(){}},true);}});A.SimpleSlider=B;},"gallery-2010.02.19-03",{requires:["node-pluginhost","node-screen"]});