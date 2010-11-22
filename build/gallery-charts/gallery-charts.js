YUI.add('gallery-charts', function(Y) {

var Graphic = function(config) {
    
    this.initializer.apply(this, arguments);
};

Graphic.prototype = {
    autoSize: true,

    initializer: function(config) {
        config = config || {};
        var w = config.width || 0,
            h = config.height || 0;
        if(config.node)
        {
            this.node = config.node;
            this._styleGroup(this.node);
        }
        else
        {
            this.node = this._createGraphics();
            this.setSize(w, h);
        }
        this._initProps();
    },

    /** 
     *Specifies a bitmap fill used by subsequent calls to other Graphics methods (such as lineTo() or drawCircle()) for the object.
     */
    beginBitmapFill: function(config) {
       
        var fill = {};
        fill.src = config.bitmap.src;
        fill.type = "tile";
        this._fillProps = fill;
        if(!isNaN(config.tx) ||
            !isNaN(config.ty) ||
            !isNaN(config.width) ||
            !isNaN(config.height))
        {
            this._gradientBox = {
                tx:config.tx,
                ty:config.ty,
                width:config.width,
                height:config.height
            };
        }
        else
        {
            this._gradientBox = null;
        }
    },

    /**
     * Specifes a solid fill used by subsequent calls to other Graphics methods (such as lineTo() or drawCircle()) for the object.
     */
    beginFill: function(color, alpha) {
        if (color) {
            this._fillAlpha = alpha || 1;
            this._fillColor = color;
            this._fillType = 'solid';
            this._fill = 1;
        }
        return this;
    },
    
    /** 
     *Specifies a gradient fill used by subsequent calls to other Graphics methods (such as lineTo() or drawCircle()) for the object.
     */
    beginGradientFill: function(config) {
        var alphas = config.alphas || [];
        if(!this._defs)
        {
            this._defs = this._createGraphicNode("defs");
            this.node.appendChild(this._defs);
        }
        this._fillAlphas = alphas;
        this._fillColors = config.colors;
        this._fillType =  config.type || "linear";
        this._fillRatios = config.ratios || [];
        this._fillRotation = config.rotation || 0;
        this._fillWidth = config.width || null;
        this._fillHeight = config.height || null;
        this._fillX = !isNaN(config.tx) ? config.tx : NaN;
        this._fillY = !isNaN(config.ty) ? config.ty : NaN;
        this._gradientId = "lg" + Math.round(100000 * Math.random());
        return this;
    },

    /**
     * Removes all nodes
     */
    destroy: function()
    {
        this._removeChildren(this.node);
        this.node.parentNode.removeChild(this.node);
    },
    
    /**
     * @private
     */
    _removeChildren: function(node)
    {
        if(node.hasChildNodes())
        {
            var child;
            while(node.firstChild)
            {
                child = node.firstChild;
                this._removeChildren(child);
                node.removeChild(child);
            }
        }
    },

    toggleVisible: function(val)
    {
        this._toggleVisible(this.node, val);
    },

    _toggleVisible: function(node, val)
    {
        var children = Y.one(node).get("children"),
            visibility = val ? "visible" : "hidden",
            i = 0,
            len;
        if(children)
        {
            len = children.length;
            for(; i < len; ++i)
            {
                this._toggleVisible(children[i], val);
            }
        }
        node.style.visibility = visibility;
    },

    /**
     * Clears the graphics object.
     */
    clear: function() {
        if(this._graphicsList)
        {
            while(this._graphicsList.length > 0)
            {
                this.node.removeChild(this._graphicsList.shift());
            }
        }
        this.path = '';
    },

    /**
     * Draws a bezier curve
     */
    curveTo: function(cp1x, cp1y, cp2x, cp2y, x, y) {
        this._shapeType = "path";
        if(this.path.indexOf("C") < 0 || this._pathType !== "C")
        {
            this._pathType = "C";
            this.path += ' C';
        }
        this.path += Math.round(cp1x) + ", " + Math.round(cp1y) + ", " + Math.round(cp2x) + ", " + Math.round(cp2y) + ", " + x + ", " + y + " ";
        this._trackSize(x, y);
    },

    /**
     * Draws a quadratic bezier curve
     */
    quadraticCurveTo: function(cpx, cpy, x, y) {
        if(this.path.indexOf("Q") < 0 || this._pathType !== "Q")
        {
            this._pathType = "Q";
            this.path += " Q";
        }
        this.path +=  Math.round(cpx) + " " + Math.round(cpy) + " " + Math.round(x) + " " + Math.round(y);
    },

    /**
     * Draws a circle
     */
	drawCircle: function(x, y, r) {
        this._shape = {
            x:x - r,
            y:y - r,
            w:r * 2,
            h:r * 2
        };
        this._attributes = {cx:x, cy:y, r:r};
        this._width = this._height = r * 2;
        this._x = x - r;
        this._y = y - r;
        this._shapeType = "circle";
        this._draw();
	},

    /**
     * Draws an ellipse
     */
    drawEllipse: function(x, y, w, h) {
        this._shape = {
            x:x,
            y:y,
            w:w,
            h:h
        };
        this._width = w;
        this._height = h;
        this._x = x;
        this._y = y;
        this._shapeType = "ellipse";
        this._draw();
    },

    /**
     * Draws a rectangle
     */
    drawRect: function(x, y, w, h) {
        this._shape = {
            x:x,
            y:y,
            w:w,
            h:h
        };
        this._x = x;
        this._y = y;
        this._width = w;
        this._height = h;
        this.moveTo(x, y);
        this.lineTo(x + w, y);
        this.lineTo(x + w, y + h);
        this.lineTo(x, y + h);
        this.lineTo(x, y);
        this._draw();
    },

    /**
     * Draws a rectangle with rounded corners
     */
    drawRoundRect: function(x, y, w, h, ew, eh) {
        this._shape = {
            x:x,
            y:y,
            w:w,
            h:h
        };
        this._x = x;
        this._y = y;
        this._width = w;
        this._height = h;
        this.moveTo(x, y + eh);
        this.lineTo(x, y + h - eh);
        this.quadraticCurveTo(x, y + h, x + ew, y + h);
        this.lineTo(x + w - ew, y + h);
        this.quadraticCurveTo(x + w, y + h, x + w, y + h - eh);
        this.lineTo(x + w, y + eh);
        this.quadraticCurveTo(x + w, y, x + w - ew, y);
        this.lineTo(x + ew, y);
        this.quadraticCurveTo(x, y, x, y + eh);
        this._draw();
	},

    /**
     * @private
     * Draws a wedge.
     * 
     * @param x				x component of the wedge's center point
     * @param y				y component of the wedge's center point
     * @param startAngle	starting angle in degrees
     * @param arc			sweep of the wedge. Negative values draw clockwise.
     * @param radius		radius of wedge. If [optional] yRadius is defined, then radius is the x radius.
     * @param yRadius		[optional] y radius for wedge.
     */
    drawWedge: function(x, y, startAngle, arc, radius, yRadius)
    {
        this._drawingComplete = false;
        this.path = this._getWedgePath({x:x, y:y, startAngle:startAngle, arc:arc, radius:radius, yRadius:yRadius});
        this._width = radius * 2;
        this._height = this._width;
        this._shapeType = "path";
        this._draw();

    },

    end: function() {
        if(this._shapeType)
        {
            this._draw();
        }
        this._initProps();
    },

    /**
     * @private
     * Not implemented
     * Specifies a gradient to use for the stroke when drawing lines.
     */
    lineGradientStyle: function() {
    },
     
    /**
     * Specifies a line style used for subsequent calls to drawing methods
     */
    lineStyle: function(thickness, color, alpha, pixelHinting, scaleMode, caps, joints, miterLimit) {
        this._stroke = 1;
        this._strokeWeight = thickness;
        if (color) {
            this._strokeColor = color;
        }
        this._strokeAlpha = alpha || 1;
    },
    
    /**
     * Draws a line segment using the current line style from the current drawing position to the specified x and y coordinates.
     */
    lineTo: function(point1, point2, etc) {
        var args = arguments,
            i,
            len;
        if (typeof point1 === 'string' || typeof point1 === 'number') {
            args = [[point1, point2]];
        }
        len = args.length;
        this._shapeType = "path";
        if(this.path.indexOf("L") < 0 || this._pathType !== "L")
        {
            this._pathType = "L";
            this.path += ' L';
        }
        for (i = 0; i < len; ++i) {
            this.path += args[i][0] + ', ' + args[i][1] + " ";

            this._trackSize.apply(this, args[i]);
        }
    },

    /**
     * Moves the current drawing position to specified x and y coordinates.
     */
    moveTo: function(x, y) {
        this._pathType = "M";
        this.path += ' M' + x + ', ' + y;
    },

    /**
     * @private
     * @description Generates a path string for a wedge shape
     */
    _getWedgePath: function(config)
    {
        var x = config.x,
            y = config.y,
            startAngle = config.startAngle,
            arc = config.arc,
            radius = config.radius,
            yRadius = config.yRadius || radius,
            segs,
            segAngle,
            theta,
            angle,
            angleMid,
            ax,
            ay,
            bx,
            by,
            cx,
            cy,
            i = 0,
            path = ' M' + x + ', ' + y;  
        
        // limit sweep to reasonable numbers
        if(Math.abs(arc) > 360)
        {
            arc = 360;
        }
        
        // First we calculate how many segments are needed
        // for a smooth arc.
        segs = Math.ceil(Math.abs(arc) / 45);
        
        // Now calculate the sweep of each segment.
        segAngle = arc / segs;
        
        // The math requires radians rather than degrees. To convert from degrees
        // use the formula (degrees/180)*Math.PI to get radians.
        theta = -(segAngle / 180) * Math.PI;
        
        // convert angle startAngle to radians
        angle = (startAngle / 180) * Math.PI;
        if(segs > 0)
        {
            // draw a line from the center to the start of the curve
            ax = x + Math.cos(startAngle / 180 * Math.PI) * radius;
            ay = y + Math.sin(startAngle / 180 * Math.PI) * yRadius;
            path += " L" + Math.round(ax) + ", " +  Math.round(ay);
            path += " Q";
            for(; i < segs; ++i)
            {
                angle += theta;
                angleMid = angle - (theta / 2);
                bx = x + Math.cos(angle) * radius;
                by = y + Math.sin(angle) * yRadius;
                cx = x + Math.cos(angleMid) * (radius / Math.cos(theta / 2));
                cy = y + Math.sin(angleMid) * (yRadius / Math.cos(theta / 2));
                path +=  Math.round(cx) + " " + Math.round(cy) + " " + Math.round(bx) + " " + Math.round(by) + " ";
            }
            path += ' L' + x + ", " + y;
        }
        return path;
    },

    /**
     * Sets the size of the graphics object
     */
    setSize: function(w, h) {
        if(this.autoSize)
        {
            if(w > this.node.getAttribute("width"))
            {
                this.node.setAttribute("width",  w);
            }
            if(h > this.node.getAttribute("height"))
            {
                this.node.setAttribute("height", h);
            }
        }
    },

    /**
     * @private
     * Updates the size of the graphics object
     */
    _trackSize: function(w, h) {
        if (w > this._width) {
            this._width = w;
        }
        if (h > this._height) {
            this._height = h;
        }
        this.setSize(w, h);
    },

    setPosition: function(x, y)
    {
        this.node.setAttribute("x", x);
        this.node.setAttribute("y", y);
    },

    /**
     * @private
     */
    render: function(parentNode) {
        var w = parentNode.get("width") || parentNode.get("offsetWidth"),
            h = parentNode.get("height") || parentNode.get("offsetHeight");
        parentNode = parentNode || Y.config.doc.body;
        parentNode.appendChild(this.node);
        this.setSize(w, h);
        this._initProps();
        return this;
    },

    /**
     * @private
     * Clears the properties
     */
    _initProps: function() {
        this._shape = null;
        this._fillColor = null;
        this._strokeColor = null;
        this._strokeWeight = 0;
        this._fillProps = null;
        this._fillAlphas = null;
        this._fillColors = null;
        this._fillType =  null;
        this._fillRatios = null;
        this._fillRotation = null;
        this._fillWidth = null;
        this._fillHeight = null;
        this._fillX = NaN;
        this._fillY = NaN;
        this.path = '';
        this._width = 0;
        this._height = 0;
        this._x = 0;
        this._y = 0;
        this._fill = null;
        this._stroke = 0;
        this._stroked = false;
        this._pathType = null;
        this._attributes = {};
    },

    /**
     * @private
     * Clears path properties
     */
    _clearPath: function()
    {
        this._shape = null;
        this._shapeType = null;
        this.path = '';
        this._width = 0;
        this._height = 0;
        this._x = 0;
        this._y = 0;
        this._pathType = null;
        this._attributes = {};
    },

    /**
     * @private 
     * Completes a vml shape
     */
    _draw: function()
    {
        var shape = this._createGraphicNode(this._shapeType),
            i,
            gradFill;
        if(this.path)
        {
            if(this._fill)
            {
                this.path += 'z';
            }
            shape.setAttribute("d", this.path);
        }
        else
        {
            for(i in this._attributes)
            {
                if(this._attributes.hasOwnProperty(i))
                {
                    shape.setAttribute(i, this._attributes[i]);
                }
            }
        }
        shape.setAttribute("stroke-width",  this._strokeWeight);
        if(this._strokeColor)
        {
            shape.setAttribute("stroke", this._strokeColor);
            shape.setAttribute("stroke-opacity", this._strokeAlpha);
        }
        if(!this._fillType || this._fillType === "solid")
        {
            if(this._fillColor)
            {
               shape.setAttribute("fill", this._fillColor);
               shape.setAttribute("fill-opacity", this._fillAlpha);
            }
            else
            {
                shape.setAttribute("fill", "none");
            }
        }
        else if(this._fillType === "linear")
        {
            gradFill = this._getFill();
            gradFill.setAttribute("id", this._gradientId);
            this._defs.appendChild(gradFill);
            shape.setAttribute("fill", "url(#" + this._gradientId + ")");

        }
        this.node.appendChild(shape);
        this._clearPath();
    },

    /**
     * @private
     * Returns ths actual fill object to be used in a drawing or shape
     */
    _getFill: function() {
        var type = this._fillType,
            fill;

        switch (type) {
            case 'linear': 
                fill = this._getLinearGradient('fill');
                break;
            case 'radial': 
                //fill = this._getRadialGradient('fill');
                break;
            case 'bitmap':
                //fill = this._bitmapFill;
                break;
        }
        return fill;
    },

    /**
     * @private
     * Returns a linear gradient fill
     */
    _getLinearGradient: function(type) {
        var fill = this._createGraphicNode("linearGradient"),
            prop = '_' + type,
            colors = this[prop + 'Colors'],
            ratios = this[prop + 'Ratios'],
            alphas = this[prop + 'Alphas'],
            w = this._fillWidth || (this._shape.w),
            h = this._fillHeight || (this._shape.h),
            r = this[prop + 'Rotation'],
            i,
            l,
            color,
            ratio,
            alpha,
            def,
            stop,
            x1, x2, y1, y2,
            cx = w/2,
            cy = h/2,
            radCon,
            tanRadians;
        /*
        if(r > 0 && r < 90)
        {
            r *= h/w;
        }
        else if(r > 90 && r < 180)
        {

            r =  90 + ((r-90) * w/h);
        }
*/
        radCon = Math.PI/180;
        tanRadians = parseFloat(parseFloat(Math.tan(r * radCon)).toFixed(8));
        if(Math.abs(tanRadians) * w/2 >= h/2)
        {
            if(r < 180)
            {
                y1 = 0;
                y2 = h;
            }
            else
            {
                y1 = h;
                y2 = 0;
            }
            x1 = cx - ((cy - y1)/tanRadians);
            x2 = cx - ((cy - y2)/tanRadians); 
        }
        else
        {
            if(r > 90 && r < 270)
            {
                x1 = w;
                x2 = 0;
            }
            else
            {
                x1 = 0;
                x2 = w;
            }
            y1 = ((tanRadians * (cx - x1)) - cy) * -1;
            y2 = ((tanRadians * (cx - x2)) - cy) * -1;
        }
        /*
        fill.setAttribute("spreadMethod", "pad");
        
        fill.setAttribute("x1", Math.round(100 * x1/w) + "%");
        fill.setAttribute("y1", Math.round(100 * y1/h) + "%");
        fill.setAttribute("x2", Math.round(100 * x2/w) + "%");
        fill.setAttribute("y2", Math.round(100 * y2/h) + "%");
        */
        fill.setAttribute("gradientTransform", "rotate(" + r + ")");//," + (w/2) + ", " + (h/2) + ")");
        fill.setAttribute("width", w);
        fill.setAttribute("height", h);
        fill.setAttribute("gradientUnits", "userSpaceOnUse");
        l = colors.length;
        def = 0;
        for(i = 0; i < l; ++i)
        {
            color = colors[i];
            ratio = ratios[i] || i/(l - 1);
            ratio = Math.round(ratio * 100) + "%";
            alpha = alphas[i] || "1";
            def = (i + 1) / l;
            stop = this._createGraphicNode("stop");
            stop.setAttribute("offset", ratio);
            stop.setAttribute("stop-color", color);
            stop.setAttribute("stop-opacity", alpha);
            fill.appendChild(stop);
        }
        return fill;
    },

    /**
     * @private
     * Creates a group element
     */
    _createGraphics: function() {
        var group = this._createGraphicNode("svg");
        this._styleGroup(group);
        return group;
    },

    _styleGroup: function(group)
    {
        group.style.position = "absolute";
        group.style.top = "0px";
        group.style.overflow = "visible";
        group.style.left = "0px";
        group.setAttribute("pointer-events", "none");
    },

    /**
     * @private
     * Creates a vml node.
     */
    _createGraphicNode: function(type, pe)
    {
        var node = document.createElementNS("http://www.w3.org/2000/svg", "svg:" + type),
            v = pe || "none";
        if(type !== "defs" && type !== "stop" && type !== "linearGradient")
        {
            node.setAttribute("pointer-events", v);
        }
        if(type != "svg")
        {
            if(!this._graphicsList)
            {
                this._graphicsList = [];
            }
            this._graphicsList.push(node);
        }
        return node;
    },

    /**
     * Returns a shape.
     */
    getShape: function(config) {
        config.graphic = this;
        return new Y.Shape(config); 
    }

};
Y.Graphic = Graphic;

var VMLGraphics = function(config) {
    
    this.initializer.apply(this, arguments);
};

VMLGraphics.prototype = {
    initializer: function(config) {
        config = config || {};
        var w = config.width || 0,
            h = config.height || 0;
        this.node = this._createGraphics();
        this.setSize(w, h);
        this._initProps();
    },

    /** 
     *Specifies a bitmap fill used by subsequent calls to other Graphics methods (such as lineTo() or drawCircle()) for the object.
     */
    beginBitmapFill: function(config) {
       
        var fill = {};
        fill.src = config.bitmap.src;
        fill.type = "tile";
        this._fillProps = fill;
        if(!isNaN(config.tx) ||
            !isNaN(config.ty) ||
            !isNaN(config.width) ||
            !isNaN(config.height))
        {
            this._gradientBox = {
                tx:config.tx,
                ty:config.ty,
                width:config.width,
                height:config.height
            };
        }
        else
        {
            this._gradientBox = null;
        }
    },

    /**
     * Specifes a solid fill used by subsequent calls to other Graphics methods (such as lineTo() or drawCircle()) for the object.
     */
    beginFill: function(color, alpha) {
        if (color) {
            if (alpha) {
                this._fillProps = {
                    type:"solid",
                    opacity: alpha
                };
            }
            this._fillColor = color;
            this._fill = 1;
        }
        return this;
    },

    /** 
     *Specifies a gradient fill used by subsequent calls to other Graphics methods (such as lineTo() or drawCircle()) for the object.
     */
    beginGradientFill: function(config) {
        var type = config.type,
            colors = config.colors,
            alphas = config.alphas || [],
            ratios = config.ratios || [],
            fill = {
                colors:colors,
                ratios:ratios
            },
            len = alphas.length,
            i = 0,
            alpha,
            oi,
            rotation = config.rotation || 0;
    
        for(;i < len; ++i)
        {
            alpha = alphas[i];
            oi = i > 0 ? i + 1 : "";
            alphas[i] = Math.round(alpha * 100) + "%";
            fill["opacity" + oi] = alphas[i];
        }
        if(type === "linear")
        {
            if(config)
            {
            }
            if(rotation > 0 && rotation <= 90)
            {
                rotation = 450 - rotation;
            }
            else if(rotation <= 270)
            {
                rotation = 270 - rotation;
            }
            else if(rotation <= 360)
            {
                rotation = 630 - rotation;
            }
            else
            {
                rotation = 270;
            }
            fill.type = "gradientunscaled";
            fill.angle = rotation;
        }
        else if(type === "radial")
        {
            fill.alignshape = false;
            fill.type = "gradientradial";
            fill.focus = "100%";
            fill.focusposition = "50%,50%";
        }
        fill.ratios = ratios || [];
        
        if(!isNaN(config.tx) ||
            !isNaN(config.ty) ||
            !isNaN(config.width) ||
            !isNaN(config.height))
        {
            this._gradientBox = {
                tx:config.tx,
                ty:config.ty,
                width:config.width,
                height:config.height
            };
        }
        else
        {
            this._gradientBox = null;
        }
        this._fillProps = fill;
    },

    /**
     * Clears the graphics object.
     */
    clear: function() {
        this._path = '';
        this._removeChildren(this.node);
    },

    /**
     * Removes all nodes
     */
    destroy: function()
    {
        this._removeChildren(this.node);
        this.node.parentNode.removeChild(this.node);
    },

    /**
     * @private
     */
    _removeChildren: function(node)
    {
        if(node.hasChildNodes())
        {
            var child;
            while(node.firstChild)
            {
                child = node.firstChild;
                this._removeChildren(child);
                node.removeChild(child);
            }
        }
    },

    toggleVisible: function(val)
    {
        this._toggleVisible(this.node, val);
    },

    _toggleVisible: function(node, val)
    {
        var children = Y.one(node).get("children"),
            visibility = val ? "visible" : "hidden",
            i = 0,
            len;
        if(children)
        {
            len = children.length;
            for(; i < len; ++i)
            {
                this._toggleVisible(children[i], val);
            }
        }
        node.style.visibility = visibility;
    },

    /**
     * Draws a bezier curve
     */
    curveTo: function(cp1x, cp1y, cp2x, cp2y, x, y) {
        this._shape = "shape";
        this._path += ' c ' + Math.round(cp1x) + ", " + Math.round(cp1y) + ", " + Math.round(cp2x) + ", " + Math.round(cp2y) + ", " + x + ", " + y;
        this._trackSize(x, y);
    },

    /**
     * Draws a quadratic bezier curve
     */
    quadraticCurveTo: function(cpx, cpy, x, y) {
        this._path += ' qb ' + cpx + ", " + cpy + ", " + x + ", " + y;
    },

    /**
     * Draws a circle
     */
	drawCircle: function(x, y, r) {
        this._width = this._height = r * 2;
        this._x = x - r;
        this._y = y - r;
        this._shape = "oval";
        //this._path += ' ar ' + this._x + ", " + this._y + ", " + (this._x + this._width) + ", " + (this._y + this._height) + ", " + this._x + " " + this._y + ", " + this._x + " " + this._y;
        this._draw();
	},

    /**
     * Draws an ellipse
     */
    drawEllipse: function(x, y, w, h) {
        this._width = w;
        this._height = h;
        this._x = x;
        this._y = y;
        this._shape = "oval";
        //this._path += ' ar ' + this._x + ", " + this._y + ", " + (this._x + this._width) + ", " + (this._y + this._height) + ", " + this._x + " " + this._y + ", " + this._x + " " + this._y;
        this._draw();
    },

    /**
     * Draws a rectangle
     */
    drawRect: function(x, y, w, h) {
        this._x = x;
        this._y = y;
        this._width = w;
        this._height = h;
        this.moveTo(x, y);
        this.lineTo(x + w, y);
        this.lineTo(x + w, y + h);
        this.lineTo(x, y + h);
        this.lineTo(x, y);
        this._draw();
    },

    /**
     * Draws a rectangle with rounded corners
     */
    drawRoundRect: function(x, y, w, h, ew, eh) {
        this._x = x;
        this._y = y;
        this._width = w;
        this._height = h;
        this.moveTo(x, y + eh);
        this.lineTo(x, y + h - eh);
        this.quadraticCurveTo(x, y + h, x + ew, y + h);
        this.lineTo(x + w - ew, y + h);
        this.quadraticCurveTo(x + w, y + h, x + w, y + h - eh);
        this.lineTo(x + w, y + eh);
        this.quadraticCurveTo(x + w, y, x + w - ew, y);
        this.lineTo(x + ew, y);
        this.quadraticCurveTo(x, y, x, y + eh);
        this._draw();
	},

    drawWedge: function(x, y, startAngle, arc, radius, yRadius)
    {
        this._drawingComplete = false;
        this._width = radius;
        this._height = radius;
        yRadius = yRadius || radius;
        this._path += this._getWedgePath({x:x, y:y, startAngle:startAngle, arc:arc, radius:radius, yRadius:yRadius});
        this._width = radius * 2;
        this._height = this._width;
        this._shape = "shape";
        this._draw();
    },

    /**
     * @private
     * @description Generates a path string for a wedge shape
     */
    _getWedgePath: function(config)
    {
        var x = config.x,
            y = config.y,
            startAngle = config.startAngle,
            arc = config.arc,
            radius = config.radius,
            yRadius = config.yRadius || radius,
            path;  
        if(Math.abs(arc) > 360)
        {
            arc = 360;
        }
        startAngle *= -65535;
        arc *= 65536;
        path = " m " + x + " " + y + " ae " + x + " " + y + " " + radius + " " + yRadius + " " + startAngle + " " + arc;
        return path;
    },
    
    end: function() {
        if(this._shape)
        {
            this._draw();
        }
        this._initProps();
    },

    /**
     * @private
     * Not implemented
     * Specifies a gradient to use for the stroke when drawing lines.
     */
    lineGradientStyle: function() {
    },
    
    /**
     * Specifies a line style used for subsequent calls to drawing methods
     */
    lineStyle: function(thickness, color, alpha, pixelHinting, scaleMode, caps, joints, miterLimit) {
        this._stroke = 1;
        this._strokeWeight = thickness * 0.7;
        this._strokeColor = color;
    },

    /**
     * Draws a line segment using the current line style from the current drawing position to the specified x and y coordinates.
     */
    lineTo: function(point1, point2, etc) {
        var args = arguments,
            i,
            len;
        if (typeof point1 === 'string' || typeof point1 === 'number') {
            args = [[point1, point2]];
        }
        len = args.length;
        this._shape = "shape";
        this._path += ' l ';
        for (i = 0; i < len; ++i) {
            this._path += ' ' + Math.round(args[i][0]) + ', ' + Math.round(args[i][1]);
            this._trackSize.apply(this, args[i]);
        }
    },

    /**
     * Moves the current drawing position to specified x and y coordinates.
     */
    moveTo: function(x, y) {
        this._path += ' m ' + Math.round(x) + ', ' + Math.round(y);
    },

    /**
     * Sets the size of the graphics object
     */
    setSize: function(w, h) {
        w = Math.round(w);
        h = Math.round(h);
        this.node.style.width = w + 'px';
        this.node.style.height = h + 'px';
        this.node.coordSize = w + ' ' + h;
        this._canvasWidth = w;
        this._canvasHeight = h;
    },
   
    setPosition: function(x, y)
    {
        x = Math.round(x);
        y = Math.round(y);
        this.node.style.left = x + "px";
        this.node.style.top = y + "px";
    },

    /**
     * @private
     */
    render: function(parentNode) {
        var w = Math.max(parentNode.offsetWidth || 0, this._canvasWidth),
            h = Math.max(parentNode.offsetHeight || 0, this._canvasHeight);
        parentNode = parentNode || Y.config.doc.body;
        parentNode.appendChild(this.node);
        this.setSize(w, h);
        this._initProps();
        return this;
    },

    /**
     * @private
     * Reference to current vml shape
     */
    _shape: null,

    /**
     * @private
     * Updates the size of the graphics object
     */
    _trackSize: function(w, h) {
        if (w > this._width) {
            this._width = w;
        }
        if (h > this._height) {
            this._height = h;
        }
    },

    /**
     * @private
     * Clears the properties
     */
    _initProps: function() {
        this._fillColor = null;
        this._strokeColor = null;
        this._strokeWeight = 0;
        this._fillProps = null;
        this._path = '';
        this._width = 0;
        this._height = 0;
        this._x = 0;
        this._y = 0;
        this._fill = null;
        this._stroke = 0;
        this._stroked = false;
    },

    /**
     * @private
     * Clears path properties
     */
    _clearPath: function()
    {
        this._shape = null;
        this._path = '';
        this._width = 0;
        this._height = 0;
        this._x = 0;
        this._y = 0;
    },

    /**
     * @private 
     * Completes a vml shape
     */
    _draw: function()
    {
        var shape = this._createGraphicNode(this._shape),
            w = Math.round(this._width),
            h = Math.round(this._height),
            fillProps = this._fillProps;
            this.setSize(w, h);
        if(this._path)
        {
            if(this._fill || this._fillProps)
            {
                this._path += ' x';
            }
            if(this._stroke)
            {
                this._path += ' e';
            }
            shape.path = this._path;
            shape.coordSize = w + ', ' + h;
        }
        else
        {
            shape.style.display = "block";
            shape.style.position = "absolute";
            shape.style.left = this._x + "px";
            shape.style.top = this._y + "px";
        }
        
        if (this._fill) {
            shape.fillColor = this._fillColor;
        }
        else
        {
            shape.filled = false;
        }
        if (this._stroke && this._strokeWeight > 0) {
            shape.strokeColor = this._strokeColor;
            shape.strokeWeight = this._strokeWeight;
        } else {
            shape.stroked = false;
        }
        shape.style.width = w + 'px';
        shape.style.height = h + 'px';
        if (fillProps) {
            shape.filled = true;
            shape.appendChild(this._getFill());
        }
        this.node.appendChild(shape);
        this._clearPath();
    },

    /**
     * @private
     * Returns ths actual fill object to be used in a drawing or shape
     */
    _getFill: function() {
        var fill = this._createGraphicNode("fill"),
            w = this._width,
            h = this._height,
            fillProps = this._fillProps,
            prop,
            pct,
            i = 0,
            colors,
            colorstring = "",
            len,
            ratios,
            hyp = Math.sqrt(Math.pow(w, 2) + Math.pow(h, 2)),
            cx = 50,
            cy = 50;
        if(this._gradientBox)
        {
            cx= Math.round( (this._gradientBox.width/2 - ((this._x - this._gradientBox.tx) * hyp/w))/(w * w/hyp) * 100);
            cy = Math.round( (this._gradientBox.height/2 - ((this._y - this._gradientBox.ty) * hyp/h))/(h * h/hyp) * 100);
            fillProps.focussize = (this._gradientBox.width/w)/10 + " " + (this._gradientBox.height/h)/10;
        }
        if(fillProps.colors)
        {
            colors = fillProps.colors.concat();
            ratios = fillProps.ratios.concat();
            len = colors.length;
            for(;i < len; ++i) {
                pct = ratios[i] || i/(len-1);
                pct = Math.round(100 * pct) + "%";
                colorstring += ", " + pct + " " + colors[i];
            }
            if(parseInt(pct, 10) < 100)
            {
                colorstring += ", 100% " + colors[len-1];
            }
        }
        for (prop in fillProps) {
            if(fillProps.hasOwnProperty(prop)) {
                fill.setAttribute(prop, fillProps[prop]);
           }
        }
        fill.colors = colorstring.substr(2);
        if(fillProps.type === "gradientradial")
        {
            fill.focusposition = cx + "%," + cy + "%";
        }
        return fill;
    },

    /**
     * @private
     * Creates a group element
     */
    _createGraphics: function() {
        var group = this._createGraphicNode("group");
        group.style.display = "inline-block";
        group.style.position = 'absolute';
        return group;
    },

    /**
     * @private
     * Creates a vml node.
     */
    _createGraphicNode: function(type)
    {
        return document.createElement('<' + type + ' xmlns="urn:schemas-microsft.com:vml" class="vml' + type + '"/>');
    
    },
    
    _getNodeShapeType: function(type)
    {
        var shape = "shape";
        if(this._typeConversionHash.hasOwnProperty(type))
        {
            shape = this._typeConversionHash[type];
        }
        return shape;
    },

    _typeConversionHash: {
        circle: "oval",
        ellipse: "oval",
        rect: "rect"
    },
    
    /**
     * Returns a shape.
     */
    getShape: function(config) {
        config.graphic = this;
        return new Y.Shape(config); 
    },

    addChild: function(child)
    {
        this.node.appendChild(child);
    }
};

if (Y.UA.ie) {
    var sheet = document.createStyleSheet();
    sheet.addRule(".vmlgroup", "behavior:url(#default#VML)", sheet.rules.length);
    sheet.addRule(".vmlgroup", "display:inline-block", sheet.rules.length);
    sheet.addRule(".vmlgroup", "zoom:1", sheet.rules.length);
    sheet.addRule(".vmlshape", "behavior:url(#default#VML)", sheet.rules.length);
    sheet.addRule(".vmlshape", "display:inline-block", sheet.rules.length);
    sheet.addRule(".vmloval", "behavior:url(#default#VML)", sheet.rules.length);
    sheet.addRule(".vmloval", "display:inline-block", sheet.rules.length);
    sheet.addRule(".vmlrect", "behavior:url(#default#VML)", sheet.rules.length);
    sheet.addRule(".vmlrect", "display:block", sheet.rules.length);
    sheet.addRule(".vmlfill", "behavior:url(#default#VML)", sheet.rules.length);
    Y.Graphic = VMLGraphics;
}
else
{
    var UID = '_yuid',
        NODE_NAME = 'nodeName',
        _addClass = Y.Node.prototype.addClass,
        node_toString = Y.Node.prototype.toString,
        nodeList_toString = Y.NodeList.prototype.toString;
    Y.Node.prototype.addClass = function(className) {
       var node = this._node;
       if(node.tagName.indexOf("svg") > -1)
       {    
            if(node.className && node.className.baseVal)
            {
                node.className.baseVal = Y.Lang.trim([node.className.baseVal, className].join(' '));
            }
            else
            {
                node.setAttribute("class", className);
            }
        }
        else
        {
            _addClass.apply(this, arguments);
        }
        return this;
    };

    Y.Node.prototype.toString = function() {
        var node = this._node,
            str;
        if(node && node.className && node.className.baseVal)
        {
            if(typeof node.className.baseVal == "string")
            {
                str = node[NODE_NAME] + "." + node.className.baseVal.replace(' ', '.');
            }
            else
            {
                str = this[UID] + ': not bound to any nodes';
            }
        }
        else
        {
            str = node_toString.apply(this, arguments);
        }
        return str;
    };

    Y.NodeList.prototype.toString = function() {
        var nodes = this._nodes,
            node,
            str;
        if (nodes && nodes[0]) {
            node = nodes[0];
        }    
        if(node && node.className && node.className.baseVal)
        {
            if(typeof node.className.baseVal == "string")
            {
                str = node[NODE_NAME];
                if(node.id)
                {
                    str += "#" + node.id;
                }
                str += "." + node.className.baseVal.replace(' ', '.');
            }
            else
            {
                str = this[UID] + ': not bound to any nodes';
            }
        }
        else
        {
            str = nodeList_toString.apply(this, arguments);
        }
        return str;
    };

    Y.NodeList.importMethod(Y.Node.prototype, ['addClass']);
}

function Shape(cfg)
{
    this._initialize(cfg);
    this._draw();
}

Y.extend(Shape, Y.Graphic, {
    type: "shape",

    autoSize: false,

    pointerEvents: "visiblePainted", 

    _initialize: function(cfg) 
    {
        if(!cfg.graphic)
        {
            cfg.graphic = new Y.Graphic();
        }
        this._setProps(cfg);
    },
  
    _setProps: function(cfg)
    {
        this.autoSize = cfg.autoSize || this.autoSize; 
        this.pointerEvents = cfg.pointerEvents || this.pointerEvents;
        this.width = cfg.width || this.width;
        this.height = cfg.height || this.height;
        this.border = cfg.border || this.border;
        this.graphics = cfg.graphic || this.graphics;
        this.canvas = this.graphics;
        this.parentNode = this.graphics.node;
        this.fill = cfg.fill || this.fill;
        this.type = cfg.shape || this.type;
        this.nodetype = this._getNodeShapeType(this.type); 
        this.props = cfg.props || this.props;
        this.path = cfg.path || this.path;
    },

    _draw: function()
    {
        var cx,
            cy,
            rx,
            ry,
            parentNode = this.parentNode,
            borderWeight = 0,
            fillWidth = this.width || 0,
            fillHeight = this.height || 0;
        if(!this.node)
        {
            this.node = this._createGraphicNode(this.nodetype, this.pointerEvents);
            parentNode.appendChild(this.node);
        }
        if(this.nodetype == "path")
        {
            if(this.type == "wedge")
            {
                this.path = this._getWedgePath(this.props);
            
            }
            this._setPath();
        }
        if(this.border && this.border.weight && this.border.weight > 0)
        {
            borderWeight = this.border.weight;
            fillWidth -= borderWeight * 2;
            fillHeight -= borderWeight * 2;
        }
        this._addBorder();
        if(this.nodetype === "ellipse")
        {
            rx = cx = this.width/2;
            ry = cy = this.height/2;
            rx -= borderWeight;
            ry -= borderWeight;
            this.node.setAttribute("cx", cx);
            this.node.setAttribute("cy", cy);
            this.node.setAttribute("rx", rx);
            this.node.setAttribute("ry", ry);
        }
        else
        {
            this.node.setAttribute("width", fillWidth);
            this.node.setAttribute("height", fillHeight);
            this.node.style.width = fillWidth + "px";
            this.node.style.height = fillHeight + "px";
        }
        this._addFill();
        parentNode.style.width = this.width + "px";
        parentNode.style.height = this.height + "px";
        parentNode.setAttribute("width", this.width);
        parentNode.setAttribute("height", this.height);
        this.node.style.visibility = "visible";
        this.node.setAttribute("x", borderWeight); 
        this.node.setAttribute("y", borderWeight); 
        return this;       
    },

    _setPath: function()
    {
        if(this.path)
        {
            this.path += " Z";
            this.node.setAttribute("d", this.path);
        }
    },

    _addBorder: function()
    {
        if(this.border && this.border.weight && this.border.weight > 0)
        {
            this.border.color = this.border.color || "#000000";
            this.border.weight = this.border.weight || 1;
            this.border.alpha = this.border.alpha || 1;
            this.border.linecap = this.border.linecap || "square";
            this.node.setAttribute("stroke", this.border.color);
            this.node.setAttribute("stroke-linecap", this.border.linecap);
            this.node.setAttribute("stroke-width",  this.border.weight);
            this.node.setAttribute("stroke-opacity", this.border.alpha);
        }
        else
        {
            this.node.setAttribute("stroke", "none");
        }
    },

    _addFill: function()
    {
        if(this.fill.type === "linear" || this.fill.type === "radial")
        {
            this.beginGradientFill(this.fill);
            this.node.appendChild(this._getFill());
        }
        else if(this.fill.type === "bitmap")
        {
            this.beginBitmapFill(this.fill);
            this.node.appendChild(this._getFill());
        }
        else
        {
            if(!this.fill.color)
            {
                this.node.setAttribute("fill", "none");
            }
            else
            {
                this.fill.alpha = this.fill.alpha !== undefined ? this.fill.alpha : 1;
                this.node.setAttribute("fill", this.fill.color);
                this.node.setAttribute("fill-opacity", this.fill.alpha);
            }
        }
    },

    end: function()
    {
        this._setPath();
    },

    update: function(cfg)
    {
        this._setProps(cfg);
        this._draw();
        return this;
    },
    
    _getNodeShapeType: function(type)
    {
        if(this._typeConversionHash.hasOwnProperty(type))
        {
            type = this._typeConversionHash[type];
        }
        return type;
    },

    toggleVisible: function(val)
    {
        var visibility = val ? "visible" : "hidden";
        if(this.node)
        {
            Y.one(this.node).setStyle("visibility", visibility);
        }
    },

    _typeConversionHash: {
        circle: "ellipse",
        wedge: "path"
    }
});

Y.Shape = Shape;
function VMLShape(cfg)
{
    this._initialize(cfg);
    this._draw();
}

VMLShape.prototype = {
    /**
     * Type of shape
     */
    type: "shape",
    
    _initialize: function(cfg) 
    {
        if(!cfg.graphic)
        {
            cfg.graphic = new Y.Graphic();
        }
        this._setProps(cfg);
    },

    width: 0,

    height: 0,

    /**
     * Returns a shape.
     */
    _setProps: function(cfg) {
        this.width = cfg.width && cfg.width >= 0 ? cfg.width : this.width;
        this.height = cfg.height && cfg.height >= 0 ? cfg.height : this.height;
        this.border = cfg.border || this.border;
        this.graphics = cfg.graphic || this.graphics;
        this.canvas = this.graphics;
        this.parentNode = this.graphics.node;
        this.fill = cfg.fill || this.fill;
        this.type = cfg.shape || this.type;
        this.props = cfg.props || this.props;
    },

    _draw: function()
    {
        var path,
            borderWeight = 0,
            fillWidth = this.width || 0,
            fillHeight = this.height || 0;
        this.graphics.setSize(fillWidth, fillHeight);
        if(this.node)
        {
            this.node.style.visible = "hidden";
        }
        else if(!this.node)
        {
            this.node = this.graphics._createGraphicNode(this.graphics._getNodeShapeType(this.type));
            this.graphics.node.appendChild(this.node);
        }
        if(this.type === "wedge")
        {
            path = this.graphics._getWedgePath(this.props);
            if(this.fill)
            {
                path += ' x';
            }
            if(this.border)
            {
                path += ' e';
            }
            this.node.path = path;
        }
        this._addBorder();
        if(this.border && this.border.weight && this.border.weight > 0)
        {
            borderWeight = this.border.weight;
            fillWidth -= borderWeight;
            fillHeight -= borderWeight;
        }
        this.node.style.width = Math.max(fillWidth, 0) + "px";
        this.node.style.height = Math.max(fillHeight, 0) + "px";
        this._addFill();
        return this;
    },
    
    _addBorder: function()
    {
        if(this.border && this.border.weight && this.border.weight > 0)
        {
            this.node.strokecolor = this.border.color || "#000000";
            this.node.strokeweight = this.border.weight || 1;
            this.node.stroked = true;
        }
        else
        {
            this.node.stroked = false;
        }
    },

    _addFill: function()
    {
        this.node.filled = true;
        if(this.fill.type === "linear" || this.fill.type === "radial")
        {
            this.graphics.beginGradientFill(this.fill);
            this.node.appendChild(this.graphics._getFill());
        }
        else if(this.fill.type === "bitmap")
        {
            this.graphics.beginBitmapFill(this.fill);
            this.node.appendChild(this.graphics._getFill());
        }
        else
        {
            if(!this.fill.color)
            {
                this.node.filled = false;
            }
            else
            {
                if(this.fillnode)
                {
                    this.graphics._removeChildren(this.fillnode);
                }
                this.fillnode = this.graphics._createGraphicNode("fill");
                this.fillnode.type = "solid";
                this.fillnode.color = this.fill.color;
                this.fillnode.opacity = this.fill.alpha || 1;
                this.node.appendChild(this.fillnode);
            }
        }
    },

    toggleVisible: function(val)
    {
        var visibility = val ? "visible" : "hidden";
        if(this.node)
        {
            Y.one(this.node).setStyle("visibility", visibility);
        }
    },

    update: function(cfg)
    {
        this._setProps(cfg);
        this._draw();
        return this;
    }
};

Y.VMLShape = VMLShape;

if (Y.UA.ie) {
    Y.Shape = VMLShape;
}
/**
 * BaseAxis is the base class for observable baseAxis classes.
 */



/**
 * Creates the BaseAxis instance and contains initialization data
 *
 * @param {Object} config (optional) Configuration parameters for the Chart.
 * @class SWFWidget
 * @constructor
 */
function BaseAxis (config)
{
    this._createId();
    BaseAxis.superclass.constructor.apply(this, arguments);
}

BaseAxis.NAME = "baseAxis";

/**
 * Attribute config
 * @private
 */
BaseAxis.ATTRS = {
	/**
	 * Hash of array identifed by a string value.
	 */
	keys: {
        getter: function ()
		{
            if(!this._keys)
            {
                this._keys = {};
            }
			return this._keys;
		},
        
        setter: function(val)
        {
            var i, l;
            if(Y.Lang.isArray(val))
            {
                l = val.length;
                for(i = 0; i < l; ++i)
                {
                    this.addKey(val[i]);
                }
                return;
            }
            for(i in val)
            {
                if(val.hasOwnProperty(i))
                {
                    this.addKey(val[i]);
                }
            }
        }
	},

	/**
	 * @private 
	 * Storage for rounding unit
	 */
	roundingUnit:{
        getter: function ()
		{
			return this._roundingUnit;
		},
		setter: function (val)
		{
			this._roundingUnit = val;
			if(this._roundMinAndMax) 
			{
				this._updateMinAndMax();
			}
		}
 	},

	/**
	 * Indicates whether or not to round values when calculating
	 * <code>maximum</code> and <code>minimum</code>.
	 */
	roundMinAndMax:{
		getter: function ()
		{
			return this._roundMinAndMax;
		},
		setter: function (val)
		{
			if(this._roundMinAndMax == val) 
			{
				return val;
			}
			this._roundMinAndMax = val;
            this._updateMinAndMax();
		}
  	},

	/**
	 * Returns the type of axis data
	 * <ul>
	 * 	<li><code>time</code></li>
	 * 	<li><code>numeric</code></li>
	 * 	<li><code>category</code></li>
	 * </ul>
	 */
	dataType:
	{
		getter: function ()
		{
			return this._dataType;
		}
	},

	/**
	 * Instance of <code>ChartDataProvider</code> that the class uses
	 * to build its own data.
	 */
	dataProvider:{
        getter: function ()
		{
			return this._dataProvider;
		},
		setter: function (value)
		{
			if(value.hasOwnProperty("data") && Y.Lang.isArray(value.data))
            {
                value = Y.merge(value);
                value = value.data;
            }
            this._dataProvider = {data:value.concat()};
			this._dataClone = this._dataProvider.data.concat();
           
            var keyCollection = this.get("keyCollection"),
                keys = this.get("keys"),
                i,
                l;
            if(keys)
            {
                for(i in keys)
                {
                    if(keys.hasOwnProperty(i))
                    {
                        delete keys[i];
                    }
                }
            }
            if(keyCollection && keyCollection.length)
            {
                i = 0;
                l = keyCollection.length;
                for(; i < l; ++i)
                {
                    this.addKey(keyCollection[i]);
                }
            }
            if(this._dataReady)
            {
                this.fire("dataUpdate");
            }
		}
	},

	/**
	 * The maximum value contained in the <code>data</code> array. Used for
	 * <code>maximum</code> when <code>autoMax</code> is true.
	 */
	dataMaximum: {
		getter: function ()
		{
            if(!this._dataMaximum)
            {
                this._updateMinAndMax();
            }
			return this._dataMaximum;
		}
	},

	/**
	 * The maximum value that will appear on an axis.
	 */
	maximum: {
		getter: function ()
		{
			if(this.get("autoMax") || !this._setMaximum) 
			{
				return this.get("dataMaximum");
			}
			return this._setMaximum;
		},
		setter: function (value)
		{
			this._setMaximum = value;
		}
	},

	/**
	 * The minimum value contained in the <code>data</code> array. Used for
	 * <code>minimum</code> when <code>autoMin</code> is true.
	 */
	dataMinimum: {
		getter: function ()
		{
            if(isNaN(this._dataMinimum))
            {
                this._updateMinAndMax();
            }
			return this._dataMinimum;
		}
	},

	/**
	 * The minimum value that will appear on an axis.
	 */
	minimum: {
		getter: function ()
		{
			if(this.get("autoMin") || !this._setMinimum) 
			{
				return this.get("dataMinimum");
			}
            return this._setMinimum;
		},
        setter: function(val)
        {
            this._setMinimum = val;
            return val;
        }
	},

	/**
	 * Determines whether the maximum is calculated or explicitly 
	 * set by the user.
	 */
	autoMax: {
	    value: true
    },

	/**
	 * Determines whether the minimum is calculated or explicitly
	 * set by the user.
	 */
	autoMin: {
	    value: true
    },

	/**
	 * Array of axis data
	 */
	data: {
		getter: function ()
		{
			if(!this._data || this._updateTotalDataFlag)
            {
                this._updateTotalData();
            }
            return this._data;
		}
	},

    keyCollection: {
        getter: function()
        {
            var keys = this.get("keys"),
                i, 
                col = [];
            for(i in keys)
            {
                if(keys.hasOwnProperty(i))
                {
                    col.push(i);
                }
            }
            return col;
        },
        readOnly: true
    },

    labelFunction: {
        value: function(val, format)
        {
            return val;
        }
    }
};

Y.extend(BaseAxis, Y.Base,
{
	/**
	 * Constant used to generate unique id.
	 */
	GUID: "yuibaseaxis",
	
    /**
	 * Creates unique id for class instance.
	 *
	 * @private
	 */
	_createId: function()
	{
		this._id = Y.guid(this.GUID);
	},
	/**
	 * @private
	 * Storaga for roundingUnit
	 */
	_roundingUnit: NaN,
	/**
	 * @private 
	 * Storage for round min and max
	 */
	_roundMinAndMax: true,
	/**
	 * @private 
	 * Storage for dataType
	 */
	_dataType: null,
	/**
	 * @private
	 * Storage for dataProvider
	 */
	_dataProvider: null,
	/**
	 * @private 
	 * Instance copy of the ChartDataProvider's data array.
	 */
	_dataClone: null,
	/**
	 * @private
	 * Storage for maximum when autoMax is false.
	 */
	_setMaximum: null,
	/**
	 * @private
	 * Storage for dataMaximum
	 * is true.
	 */
	_dataMaximum: null,
	
    /**
	 * @private
	 * Storage for minimum when autoMin is false.
	 */
	_setMinimum: null,
	/**
	 * @private
	 * Storage for dataMinimum. 
	 */
	_dataMinimum: null,
	/**
	 * @private
	 * Storage for data
	 */
	_data: null,
	/**
	 * @private
	 * Storage for keys
	 */
	_keys: null,

    _updateTotalDataFlag: true,

	/**
	 * @private
	 * Indicates that the axis has a data source and at least one
	 * key.
	 */
	_dataReady: false,
	/**
	 * Adds an array to the key hash.
	 *
	 * @param value Indicates what key to use in retrieving
	 * the array.
	 */
	addKey: function (value)
	{
		if(this.get("keys").hasOwnProperty(value)) 
		{
			return;
		}
		this._dataClone = this.get("dataProvider").data.concat();
		var keys = this.get("keys"),
			eventKeys = {},
			event = {axis:this};
		this._setDataByKey(value);
		eventKeys[value] = keys[value].concat();
        this._updateMinAndMax();
		event.keysAdded = eventKeys;
		if(!this._dataReady)
		{
			this._dataReady = true;
			this.publish("dataReady", {fireOnce:true});
			this.fire("dataReady", event);
		}
		else
		{
			this.fire("dataUpdate", event);
		}
	},

	/**
	 * @private 
	 *
	 * Creates an array of data based on a key value.
	 */
	_setDataByKey: function(key)
	{
		var i,
			obj, 
			arr = [], 
			dv = this._dataClone.concat(), 
			len = dv.length;
		for(i = 0; i < len; ++i)
		{
			obj = dv[i];
			arr[i] = obj[key];
		}
		this.get("keys")[key] = arr;
	    this._updateTotalDataFlag = true;
    },

    /**
     * @private
     */
    _updateTotalData: function()
    {
		var keys = this.get("keys"),
            i;
        this._data = [];
        for(i in keys)
        {
            if(keys.hasOwnProperty(i))
            {
                this._data = this._data.concat(keys[i]);
            }
        }
        this._updateTotalDataFlag = false;
    },

	/**
	 * Removes an array from the key hash.
	 * 
	 * @param value Indicates what key to use in removing from 
	 * the hash.
	 * @return Boolean
	 */
	removeKey: function(value)
	{
		if(!this.get("keys").hasOwnProperty(value)) 
		{
			return;
		}
		var key,
			oldKey,
			newKeys = {},
			newData = [],
			removedKeys = {},
			keys = this.get("keys"),
			event = {};
        removedKeys[value] = keys[value].concat();
        for(key in keys)
        {
            if(keys.hasOwnProperty(key))
            {
                if(key == value) 
                {
                    continue;
                }
                oldKey = keys[key];
                newData = newData.concat(oldKey);
                newKeys[key] = oldKey;
            }
        }
        keys = newKeys;
        this._updateTotalDataFlag = true;
        this._updateMinAndMax();
        event.keysRemoved = removedKeys;
        this.fire("dataUpdate", event);
	},

	/**
	 * Returns a numeric value based of a key value and an index.
	 */
	getKeyValueAt: function(key, index)
	{
		var value = NaN,
			keys = this.get("keys");
		if(keys[key] && keys[key][index]) 
		{
			value = keys[key][index];
		}
		return value;
	},

	/**
	 * Returns an array of values based on an identifier key.
	 */
	getDataByKey: function (value)
	{
		var keys = this.get("keys");
		if(keys[value])
		{
			return keys[value];
		}
		return null;
	},


	/**
	 * @private 
	 * Updates the <code>dataMaximum</code> and <code>dataMinimum</code> values.
	 */
	_updateMinAndMax: function ()
	{
		var data = this.get("data"),
			max = 0,
			min = 0,
			len,
			num,
			i;
		if(data && data.length && data.length > 0)
		{
			len = data.length;
			max = min = data[0];
			if(len > 1)
			{
				for(i = 1; i < len; i++)
				{	
					num = data[i];
					if(isNaN(num))
					{
						continue;
					}
					max = Math.max(num, max);
					min = Math.min(num, min);
				}
			}
		}
		this._dataMaximum = max;
		this._dataMinimum = min;
	},

    getTotalMajorUnits: function(majorUnit, len)
    {
        var units;
        if(majorUnit.determinant === "count") 
        {
            units = majorUnit.count;
        }
        else if(majorUnit.determinant === "distance") 
        {
            units = (len/majorUnit.distance) + 1;
        }
        return units; 
    },

    getMajorUnitDistance: function(len, uiLen, majorUnit)
    {
        var dist;
        if(majorUnit.determinant === "count")
        {
            dist = uiLen/(len - 1);
        }
        else if(majorUnit.determinant === "distance")
        {
            dist = majorUnit.distance;
        }
        return dist;
    },

    getEdgeOffset: function(ct, l)
    {
        return 0;
    },

    getLabelByIndex: function(i, l)
    {
        var min = this.get("minimum"),
            max = this.get("maximum"),
            increm = (max - min)/(l-1),
            label;
            l -= 1;
            label = min + (i * increm);
        return label;
    }
});
Y.BaseAxis = BaseAxis;

function NumericAxis(config)
{
	NumericAxis.superclass.constructor.apply(this, arguments);
}

NumericAxis.NAME = "numericAxis";

NumericAxis.ATTRS = {
	/**
	 * Indicates whether 0 should always be displayed.
	 */
	alwaysShowZero: {
		getter: function()
		{
			return this._alwaysShowZero;
		},
		setter: function(value)
		{
			if(value == this._alwaysShowZero) 
			{
				return;
			}
			this._alwaysShowZero = value;
			this._updateMinAndMax();
			return value;
		}
	},
    
    labelFunction: { 
        value: function(val, format)
        {
            if(format)
            {
                return Y.DataType.Number.format(val, format);
            }
            return val;
        }
    },

    labelFormat: {
        value: {
            prefix: "",
            thousandsSeparator: "",
            decimalSeparator: "",
            decimalPlaces: "0",
            suffix: ""
        }
    }
};

Y.extend(NumericAxis, Y.BaseAxis,
{
	/**
	 * @private
	 */
	_dataType: "numeric",
	
	/**
	 * @private
	 * Storage for alwaysShowZero
	 */
	_alwaysShowZero: true,

	/**
	 * @private
	 * Determines the maximum and minimum values for the axis.
	 */
	_updateMinAndMax: function()
	{
		var data = this.get("data"),
			max = 0,
			min = 0,
			len,
			num,
			i,
            key;
		if(data && data.length && data.length > 0)
		{
			len = data.length;
			max = min = data[0];
			if(len > 1)
			{
				for(i = 1; i < len; i++)
				{	
                    num = data[i];
					if(isNaN(num))
					{
						if(Y.Lang.isObject(num))
                        {
                            //hloc values
                            for(key in num)
                            {
                               if(num.hasOwnProperty(key))
                               {
                                    max = Math.max(num[key], max);
                                    min = Math.min(num[key], min);
                               }
                            }
                        }
                        continue;
					}
					max = Math.max(num, max);
					min = Math.min(num, min);
				}
			}
		}	
		if(this._roundMinAndMax && !isNaN(this.get("roundingUnit")))
		{
            this._dataMaximum = max === 0 ? max : this._roundUpToNearest(max, this.get("roundingUnit"));
			if(min === 0 || (min > 0 && min < this.get("roundingUnit")))
            {
                this._dataMinimum = 0;
            }
            else
            {
                this._dataMinimum = this._roundDownToNearest(min, this.get("roundingUnit"));
            }
        }
		else
		{
			this._dataMaximum = max;
			this._dataMinimum = min;
		}
		if(this.get("alwaysShowZero"))
		{
			this._dataMinimum = Math.min(0, this.get("dataMinimum"));
		}
	},

	/**
	 * Rounds a Number to the nearest multiple of an input. For example, by rounding
	 * 16 to the nearest 10, you will receive 20. Similar to the built-in function Math.round().
	 * 
	 * @param	numberToRound		the number to round
	 * @param	nearest				the number whose mutiple must be found
	 * @return	the rounded number
	 * 
	 */
	_roundToNearest: function(number, nearest)
	{
		nearest = nearest || 1;
		if(nearest === 0)
		{
			return number;
		}
		var roundedNumber = Math.round(this._roundToPrecision(number / nearest, 10)) * nearest;
		return this._roundToPrecision(roundedNumber, 10);
	},
	
	/**
	 * Rounds a Number <em>up</em> to the nearest multiple of an input. For example, by rounding
	 * 16 up to the nearest 10, you will receive 20. Similar to the built-in function Math.ceil().
	 * 
	 * @param	numberToRound		the number to round up
	 * @param	nearest				the number whose mutiple must be found
	 * @return	the rounded number
	 * 
	 */
	_roundUpToNearest: function(number, nearest)
	{
		nearest = nearest || 1;
		if(nearest === 0)
		{
			return number;
		}
		return Math.ceil(this._roundToPrecision(number / nearest, 10)) * nearest;
	},
	
	/**
	 * Rounds a Number <em>down</em> to the nearest multiple of an input. For example, by rounding
	 * 16 down to the nearest 10, you will receive 10. Similar to the built-in function Math.floor().
	 * 
	 * @param	numberToRound		the number to round down
	 * @param	nearest				the number whose mutiple must be found
	 * @return	the rounded number
	 * 
	 */
	_roundDownToNearest: function(number, nearest)
	{
		nearest = nearest || 1;
		if(nearest === 0)
		{
			return number;
		}
		return Math.floor(this._roundToPrecision(number / nearest, 10)) * nearest;
	},

	/**
	 * Rounds a number to a certain level of precision. Useful for limiting the number of
	 * decimal places on a fractional number.
	 * 
	 * @param		number		the input number to round.
	 * @param		precision	the number of decimal digits to keep
	 * @return		the rounded number, or the original input if no rounding is needed
	 * 
	 */
	_roundToPrecision: function(number, precision)
	{
		precision = precision || 0;
		var decimalPlaces = Math.pow(10, precision);
		return Math.round(decimalPlaces * number) / decimalPlaces;
	}
});

Y.NumericAxis = NumericAxis;
		
function StackedAxis(config)
{
	StackedAxis.superclass.constructor.apply(this, arguments);
}

StackedAxis.NAME = "stackedAxis";


Y.extend(StackedAxis, Y.NumericAxis,
{
    /**
	 * @private
	 * Determines the maximum and minimum values for the axis.
	 */
	_updateMinAndMax: function()
	{
		var max = 0,
			min = 0,
			pos = 0,
            neg = 0,
            len = 0,
			i = 0,
            key,
            num,
            keys = this.get("keys");

        for(key in keys)
        {
            if(keys.hasOwnProperty(key))
            {
                len = Math.max(len, keys[key].length);
            }
        }
        for(; i < len; ++i)
        {
            pos = 0;
            neg = 0;
            for(key in keys)
            {
                if(keys.hasOwnProperty(key))
                {
                    num = keys[key][i];
					if(isNaN(num))
					{
                        continue;
					}
                    if(num >= 0)
                    {
                        pos += num;
                    }
                    else
                    {
                        neg += num;
                    }
                }
            }
            if(pos > 0)
            {
                max = Math.max(max, pos);
            }
            else 
            {
                max = Math.max(max, neg);
            }
            if(neg < 0)
            {
                min = Math.min(min, neg);
            }
            else
            {
                min = Math.min(min, pos);
            }
        }
        if(this._roundMinAndMax && !isNaN(this.get("roundingUnit")))
		{
			this._dataMaximum = this._roundUpToNearest(max, this.get("roundingUnit"));
			this._dataMinimum = this._roundDownToNearest(min, this.get("roundingUnit"));
		}
		else
		{
			this._dataMaximum = max;
			this._dataMinimum = min;
		}
		if(this._alwaysShowZero && min > 0)
		{
			this._dataMinimum = Math.min(0, this._dataMinimum);
		}
	}
});

Y.StackedAxis = StackedAxis;
		
function TimeAxis(config)
{
	TimeAxis.superclass.constructor.apply(this, arguments);
}

TimeAxis.NAME = "timeAxis";

TimeAxis.ATTRS = 
{
    maximum: {
		getter: function ()
		{
			if(this.get("autoMax") || this._setMaximum === null) 
			{
                return this._getNumber(this.get("dataMaximum"));
			}
			return this._setMaximum;
		},
		setter: function (value)
		{
            this._setMaximum = this._getNumber(value);
            this.fire("dataUpdate");
		}
    },

    minimum: {
		getter: function ()
		{
			if(this.get("autoMin") || this._setMinimum === null) 
			{
				return this.get("dataMinimum");
			}
			return this._setMinimum;
		},
		setter: function (value)
		{
            this._setMinimum = this._getNumber(value);
            this.fire("dataUpdate");
        }
    },

    labelFunction: {
        value: function(val, format)
        {
            val = Y.DataType.Date.parse(val);
            if(format)
            {
                return Y.DataType.Date.format(val, {format:format});
            }
            return val;
        }
    },

    labelFormat: {
        value: "%b %d, %y"
    }
};

Y.extend(TimeAxis, Y.BaseAxis, {
	/**
	 * Constant used to generate unique id.
	 */
	GUID: "yuitimeaxis",
	
    /**
	 * @private
	 */
	_dataType: "time",
		
	/**
	 * @private (override)
	 */
	_setDataByKey: function(key)
	{
		var obj, 
			arr = [], 
			dv = this._dataClone.concat(), 
			i, 
			val,
			len = dv.length;
		for(i = 0; i < len; ++i)
		{
			obj = dv[i][key];
			if(Y.Lang.isDate(obj))
			{
				val = obj.valueOf();
			}
			else if(!Y.Lang.isNumber(obj))
			{
				val = new Date(obj.toString()).valueOf();
			}
			else
			{
				val = obj;
			}
			arr[i] = val;
		}
		this.get("keys")[key] = arr;
        this._updateTotalDataFlag = true;
    },

    _getNumber: function(val)
    {
        if(Y.Lang.isDate(val))
        {
            val = val.valueOf();
        }
        else if(!Y.Lang.isNumber(val))
        {
            val = new Date(val.toString()).valueOf();
        }

        return val;
    }    
});

Y.TimeAxis = TimeAxis;
		
function CategoryAxis(config)
{
	CategoryAxis.superclass.constructor.apply(this, arguments);
}

CategoryAxis.NAME = "categoryAxis";

Y.extend(CategoryAxis, Y.BaseAxis,
{
    /**
     * @private
     */
    _indices: null,

	/**
	 * Constant used to generate unique id.
	 */
	GUID: "yuicategoryaxis",
	
    /**
	 * @private
	 */
	_dataType: "category",
		
	/**
	 * @private
	 */
	_updateMinAndMax: function()
	{
		this._dataMaximum = Math.max(this.get("data").length - 1, 0);
		this._dataMinimum = 0;
	},

	/**
	 * @private
	 */
	_setDataByKey: function(key)
	{
		var i,
			obj, 
			arr = [], 
			labels = [], 
			dv = this._dataClone.concat(), 
			len = dv.length;
	    if(!this._indices)
        {
            this._indices = {};
        }
        for(i = 0; i < len; ++i)
		{
			obj = dv[i];
			arr[i] = i;
			labels[i] = obj[key];
		}
        this._indices[key] = arr;
		this.get("keys")[key] = labels.concat();
	    this._updateTotalDataFlag = true;
    },

    /**
     * Returns an array of values based on an identifier key.
     */
    getDataByKey: function (value)
    {
        if(!this._indices)
        {
            this.get("keys");
        }
        var keys = this._indices;
        if(keys[value])
        {
            return keys[value];
        }
        return null;
    },

    getTotalMajorUnits: function(majorUnit, len)
    {
        return this.get("data").length;
    },
    
    getMajorUnitDistance: function(len, uiLen, majorUnit)
    {
        var dist;
        if(majorUnit.determinant === "count")
        {
            dist = uiLen/len;
        }
        else if(majorUnit.determinant === "distance")
        {
            dist = majorUnit.distance;
        }
        return dist;
    },
   
    getEdgeOffset: function(ct, l)
    {
        return l/ct;
    },
   
    getLabelByIndex: function(i, l, format)
    {
        return this.get("data")[i];
    },

    getLabelAtPosition: function(pos, len, format)
    {
        var count = this.get("data").length - 1,
        i = Math.round(pos/(len/count));
        return this.get("data")[i];
    }
});

Y.CategoryAxis = CategoryAxis;
		
function Renderer(){}

Renderer.ATTRS = {
        /**
         * Hash of style properties for class
         */
        styles:
        {
            getter: function()
            {
                this._styles = this._styles || this._getDefaultStyles();
                return this._styles;
            },

            setter: function(val)
            {
                this._styles = this._setStyles(val);
            }
        },
        
        /**
         * The graphic in which the series will be rendered.
         */
        graphic: {}
};
Renderer.NAME = "renderer";

Renderer.prototype = {
    /**
     * @private
     * @description Storage for styles
     */
	_styles: null,
	
    /**
	 * Sets multiple style properties on the instance.
	 *
	 * @method _setStyles
	 * @param {Object} styles Hash of styles to be applied.
	 */
	_setStyles: function(newstyles)
	{
		var styles = this.get("styles");
        return this._mergeStyles(newstyles, styles);
	},
    
    /**
     * Merges to object literals only overriding properties explicitly.
     * 
     * @private
     * @param {Object} newHash hash of properties to set
     * @param {Object} default hash of properties to be overwritten
     * @return {Object}
     */
    _mergeStyles: function(a, b)
    {
        if(!b)
        {
            b = {};
        }
        var newstyles = Y.merge(b, {});
        Y.Object.each(a, function(value, key, a)
        {
            if(b.hasOwnProperty(key) && Y.Lang.isObject(value) && !Y.Lang.isArray(value))
            {
                newstyles[key] = this._mergeStyles(value, b[key]);
            }
            else
            {
                newstyles[key] = value;
            }
        }, this);
        return newstyles;
    },

    /**
     * @private
     * @description Default style values.
     */
    _getDefaultStyles: function()
    {
        return {padding:{
            top:0,
            right: 0,
            bottom: 0,
            left: 0
        }};
    }
};

Y.augment(Renderer, Y.Attribute);
Y.Renderer = Renderer;

/**
 * Utility class used for calculating curve points.
 */
function CurveUtil()
{
}

CurveUtil.prototype = {
    /**
     * @private
     * @return {Object}
     * Creates an array of start, end and control points for splines. 
     */
    getCurveControlPoints: function(xcoords, ycoords) 
    {
		var outpoints = [],
            i = 1,
            l = xcoords.length - 1,
		    xvals = [],
		    yvals = [];
		
		
		// Too few points, need at least two
		if (l < 1) 
        {
			return null;
		} 
        
        outpoints[0] = {
            startx: xcoords[0], 
            starty: ycoords[0],
            endx: xcoords[1],
            endy: ycoords[1]
        };
        
		// Special case, the Bezier should be a straight line
        if (l === 1) 
        {
			outpoints[0].ctrlx1 = (2.0*xcoords[0] + xcoords[1])/3.0;  
			outpoints[0].ctrly2 = (2.0*ycoords[0] + ycoords[1])/3.0;
			outpoints[0].ctrlx2 = 2.0*outpoints[0].ctrlx1 - xcoords[0];
            outpoints[0].ctrly2 = 2.0*outpoints[0].ctrly1 - ycoords[0];
            return outpoints;
		}

		for (; i < l; ++i) 
        {
			outpoints.push({startx: Math.round(xcoords[i]), starty: Math.round(ycoords[i]), endx: Math.round(xcoords[i+1]), endy: Math.round(ycoords[i+1])});
			xvals[i] = 4.0 * xcoords[i] + 2*xcoords[i+1];
			yvals[i] = 4.0*ycoords[i] + 2*ycoords[i+1];
		}
		
		xvals[0] = xcoords[0] + (2.0 * xcoords[1]);
		xvals[l-1] = (8.0 * xcoords[l-1] + xcoords[l]) / 2.0;
		xvals = this.getControlPoints(xvals.concat());
        yvals[0] = ycoords[0] + (2.0 * ycoords[1]);
		yvals[l-1] = (8.0 * ycoords[l-1] + ycoords[l]) / 2.0;	
		yvals = this.getControlPoints(yvals.concat());
		
        for (i = 0; i < l; ++i) 
        {
			outpoints[i].ctrlx1 = Math.round(xvals[i]);
            outpoints[i].ctrly1 = Math.round(yvals[i]);
			
			if (i < l-1) 
            {
				outpoints[i].ctrlx2 = Math.round(2*xcoords[i+1] - xvals[i+1]);
                outpoints[i].ctrly2 = Math.round(2*ycoords[i+1] - yvals[i+1]);
			}
			else 
            {
				outpoints[i].ctrlx2 = Math.round((xcoords[l] + xvals[l-1])/2);
                outpoints[i].ctrly2 = Math.round((ycoords[l] + yvals[l-1])/2);
			}
		}
		
		return outpoints;	
	},

    /**
     * @private
     */
	getControlPoints: function(vals) 
    {
		var l = vals.length,
            x = [],
            tmp = [],
            b = 2.0,
            i = 1;
		x[0] = vals[0] / b;
		for (; i < l; ++i) 
        {
			tmp[i] = 1/b;
			b = (i < l-1 ? 4.0 : 3.5) - tmp[i];
			x[i] = (vals[i] - x[i-1]) / b;
		}
		
		for (i = 1; i < l; ++i) 
        {
			x[l-i-1] -= tmp[l-i] * x[l-i];
		}
		
		return x;
	}
};
Y.CurveUtil = CurveUtil;
/**
 * Methods used for creating stacked series
 */
function StackingUtil(){}

StackingUtil.prototype = {
    /**
     * @private
     * Adjusts coordinate values for stacked series.
     */
    _stackCoordinates: function() 
    {
        var direction = this.get("direction"),
            order = this.get("order"),
            type = this.get("type"),
            graph = this.get("graph"),
            h = graph.get("height"), 
            seriesCollection = graph.seriesTypes[type],
            i = 0,
            len,
            xcoords = this.get("xcoords"),
            ycoords = this.get("ycoords"),
            prevXCoords,
            prevYCoords;
        if(order === 0)
        {
            return;
        }
        prevXCoords = seriesCollection[order - 1].get("xcoords").concat();
        prevYCoords = seriesCollection[order - 1].get("ycoords").concat();
        if(direction === "vertical")
        {
            len = prevXCoords.length;
            for(; i < len; ++i)
            {
                if(!isNaN(prevXCoords[i]) && !isNaN(xcoords[i]))
                {
                    xcoords[i] += prevXCoords[i];
                }
            }
        }
        else
        {
            len = prevYCoords.length;
            for(; i < len; ++i)
            {
                if(!isNaN(prevYCoords[i]) && !isNaN(ycoords[i]))
                {
                    ycoords[i] = prevYCoords[i] - (h - ycoords[i]);
                }
            }
        }
    }
};
Y.StackingUtil = StackingUtil;
function Lines(){}

Lines.prototype = {
    /**
     * @private
     */
    _lineDefaults: null,

    /**
	 * @private
	 */
	drawLines: function()
	{
        if(this.get("xcoords").length < 1) 
		{
			return;
		}
        var xcoords = this.get("xcoords").concat(),
			ycoords = this.get("ycoords").concat(),
            direction = this.get("direction"),
			len = direction === "vertical" ? ycoords.length : xcoords.length,
			lastX,
			lastY,
			lastValidX = lastX,
			lastValidY = lastY,
			nextX,
			nextY,
			i,
			styles = this.get("styles").line,
			lineType = styles.lineType,
            lc = styles.color || this._getDefaultColor(this.get("graphOrder"), "line"),
			dashLength = styles.dashLength,
			gapSpace = styles.gapSpace,
			connectDiscontinuousPoints = styles.connectDiscontinuousPoints,
			discontinuousType = styles.discontinuousType,
			discontinuousDashLength = styles.discontinuousDashLength,
			discontinuousGapSpace = styles.discontinuousGapSpace,
			graphic = this.get("graphic");
        lastX = lastValidX = xcoords[0];
        lastY = lastValidY = ycoords[0];
        graphic.lineStyle(styles.weight, lc);
        graphic.moveTo(lastX, lastY);
        for(i = 1; i < len; i = ++i)
		{
			nextX = xcoords[i];
			nextY = ycoords[i];
            if(isNaN(nextY))
			{
				lastValidX = nextX;
				lastValidY = nextY;
				continue;
			}
			if(lastValidX == lastX)
			{
                if(lineType != "dashed")
				{
                    graphic.lineTo(nextX, nextY);
				}
				else
				{
					this.drawDashedLine(lastValidX, lastValidY, nextX, nextY, 
												dashLength, 
												gapSpace);
				}
			}
			else if(!connectDiscontinuousPoints)
			{
				graphic.moveTo(nextX, nextY);
			}
			else
			{
				if(discontinuousType != "solid")
				{
					this.drawDashedLine(lastValidX, lastValidY, nextX, nextY, 
												discontinuousDashLength, 
												discontinuousGapSpace);
				}
				else
				{
                    graphic.lineTo(nextX, nextY);
				}
			}
		
			lastX = lastValidX = nextX;
			lastY = lastValidY = nextY;
        }
        graphic.end();
	},
    
    /**
	 * @private
	 */
	drawSpline: function()
	{
        if(this.get("xcoords").length < 1) 
		{
			return;
		}
        var xcoords = this.get("xcoords"),
			ycoords = this.get("ycoords"),
            curvecoords = this.getCurveControlPoints(xcoords, ycoords),
			len = curvecoords.length,
            cx1,
            cx2,
            cy1,
            cy2,
            x,
            y,
            i = 0,
			styles = this.get("styles").line,
			graphic = this.get("graphic"),
            color = styles.color || this._getDefaultColor(this.get("graphOrder"), "line");
        graphic.lineStyle(styles.weight, color);
        graphic.moveTo(xcoords[0], ycoords[0]);
        for(; i < len; i = ++i)
		{
            x = curvecoords[i].endx;
            y = curvecoords[i].endy;
            cx1 = curvecoords[i].ctrlx1;
            cx2 = curvecoords[i].ctrlx2;
            cy1 = curvecoords[i].ctrly1;
            cy2 = curvecoords[i].ctrly2;
            graphic.curveTo(cx1, cy1, cx2, cy2, x, y);
        }
        graphic.end();
	},
    
    /**
	 * Draws a dashed line between two points.
	 * 
	 * @param xStart	The x position of the start of the line
	 * @param yStart	The y position of the start of the line
	 * @param xEnd		The x position of the end of the line
	 * @param yEnd		The y position of the end of the line
	 * @param dashSize	the size of dashes, in pixels
	 * @param gapSize	the size of gaps between dashes, in pixels
	 */
	drawDashedLine: function(xStart, yStart, xEnd, yEnd, dashSize, gapSize)
	{
		dashSize = dashSize || 10;
		gapSize = gapSize || 10;
		var segmentLength = dashSize + gapSize,
			xDelta = xEnd - xStart,
			yDelta = yEnd - yStart,
			delta = Math.sqrt(Math.pow(xDelta, 2) + Math.pow(yDelta, 2)),
			segmentCount = Math.floor(Math.abs(delta / segmentLength)),
			radians = Math.atan2(yDelta, xDelta),
			xCurrent = xStart,
			yCurrent = yStart,
			i,
			graphic = this.get("graphic");
		xDelta = Math.cos(radians) * segmentLength;
		yDelta = Math.sin(radians) * segmentLength;
		
		for(i = 0; i < segmentCount; ++i)
		{
			graphic.moveTo(xCurrent, yCurrent);
			graphic.lineTo(xCurrent + Math.cos(radians) * dashSize, yCurrent + Math.sin(radians) * dashSize);
			xCurrent += xDelta;
			yCurrent += yDelta;
		}
		
		graphic.moveTo(xCurrent, yCurrent);
		delta = Math.sqrt((xEnd - xCurrent) * (xEnd - xCurrent) + (yEnd - yCurrent) * (yEnd - yCurrent));
		
		if(delta > dashSize)
		{
			graphic.lineTo(xCurrent + Math.cos(radians) * dashSize, yCurrent + Math.sin(radians) * dashSize);
		}
		else if(delta > 0)
		{
			graphic.lineTo(xCurrent + Math.cos(radians) * delta, yCurrent + Math.sin(radians) * delta);
		}
		
		graphic.moveTo(xEnd, yEnd);
	},

	_getLineDefaults: function()
    {
        return {
            alpha: 1,
            weight: 6,
            lineType:"solid", 
            dashLength:10, 
            gapSpace:10, 
            connectDiscontinuousPoints:true, 
            discontinuousType:"solid", 
            discontinuousDashLength:10, 
            discontinuousGapSpace:10
        };
    }
};
Y.augment(Lines, Y.Attribute);
Y.Lines = Lines;
function Fills(cfg)
{
    var attrs = {
        area: {
            getter: function()
            {
                return this._defaults || this._getAreaDefaults();
            },

            setter: function(val)
            {
                var defaults = this._defaults || this._getAreaDefaults();
                this._defaults = Y.merge(defaults, val);
            }
        }
    };
    this.addAttrs(attrs, cfg);
    this.get("styles");
}

Fills.prototype = {
	/**
	 * @private
	 */
	drawFill: function(xcoords, ycoords)
	{
        if(xcoords.length < 1) 
		{
			return;
		}
        var len = xcoords.length,
			firstX = xcoords[0],
			firstY = ycoords[0],
            lastValidX = firstX,
			lastValidY = firstY,
			nextX,
			nextY,
			i = 1,
			styles = this.get("styles").area,
			graphic = this.get("graphic"),
            color = styles.color || this._getDefaultColor(this.get("graphOrder"), "slice");
        graphic.clear();
        graphic.beginFill(color, styles.alpha);
        graphic.moveTo(firstX, firstY);
        for(; i < len; i = ++i)
		{
			nextX = xcoords[i];
			nextY = ycoords[i];
			if(isNaN(nextY))
			{
				lastValidX = nextX;
				lastValidY = nextY;
				continue;
			}
            graphic.lineTo(nextX, nextY);
            lastValidX = nextX;
			lastValidY = nextY;
        }
        graphic.end();
	},
	
    /**
	 * @private
	 */
	drawAreaSpline: function()
	{
        if(this.get("xcoords").length < 1) 
		{
			return;
		}
        var xcoords = this.get("xcoords"),
			ycoords = this.get("ycoords"),
            curvecoords = this.getCurveControlPoints(xcoords, ycoords),
			len = curvecoords.length,
            cx1,
            cx2,
            cy1,
            cy2,
            x,
            y,
            i = 0,
			firstX = xcoords[0],
            firstY = ycoords[0],
            styles = this.get("styles").area,
			graphic = this.get("graphic"),
            color = styles.color || this._getDefaultColor(this.get("graphOrder"), "slice");
        graphic.beginFill(color, styles.alpha);
        graphic.moveTo(firstX, firstY);
        for(; i < len; i = ++i)
		{
            x = curvecoords[i].endx;
            y = curvecoords[i].endy;
            cx1 = curvecoords[i].ctrlx1;
            cx2 = curvecoords[i].ctrlx2;
            cy1 = curvecoords[i].ctrly1;
            cy2 = curvecoords[i].ctrly2;
            graphic.curveTo(cx1, cy1, cx2, cy2, x, y);
        }
        if(this.get("direction") === "vertical")
        {
            graphic.lineTo(this._leftOrigin, y);
            graphic.lineTo(this._leftOrigin, firstY);
        }
        else
        {
            graphic.lineTo(x, this._bottomOrigin);
            graphic.lineTo(firstX, this._bottomOrigin);
        }
        graphic.lineTo(firstX, firstY);
        graphic.end();
	},
    
    /**
	 * @private
	 */
	drawStackedAreaSpline: function()
	{
        if(this.get("xcoords").length < 1) 
		{
			return;
		}
        var xcoords = this.get("xcoords"),
			ycoords = this.get("ycoords"),
            curvecoords,
            order = this.get("order"),
            type = this.get("type"),
            graph = this.get("graph"),
            seriesCollection = graph.seriesTypes[type],
            prevXCoords,
            prevYCoords,
			len,
            cx1,
            cx2,
            cy1,
            cy2,
            x,
            y,
            i = 0,
			firstX,
            firstY,
            styles = this.get("styles").area,
			graphic = this.get("graphic"),
            color = styles.color || this._getDefaultColor(this.get("graphOrder"), "slice");
		firstX = xcoords[0];
        firstY = ycoords[0];
        curvecoords = this.getCurveControlPoints(xcoords, ycoords);
        len = curvecoords.length;
        graphic.beginFill(color, styles.alpha);
        graphic.moveTo(firstX, firstY);
        for(; i < len; i = ++i)
		{
            x = curvecoords[i].endx;
            y = curvecoords[i].endy;
            cx1 = curvecoords[i].ctrlx1;
            cx2 = curvecoords[i].ctrlx2;
            cy1 = curvecoords[i].ctrly1;
            cy2 = curvecoords[i].ctrly2;
            graphic.curveTo(cx1, cy1, cx2, cy2, x, y);
        }
        if(order > 0)
        {
            prevXCoords = seriesCollection[order - 1].get("xcoords").concat().reverse();
            prevYCoords = seriesCollection[order - 1].get("ycoords").concat().reverse();
            curvecoords = this.getCurveControlPoints(prevXCoords, prevYCoords);
            i = 0;
            len = curvecoords.length;
            graphic.lineTo(prevXCoords[0], prevYCoords[0]);
            for(; i < len; i = ++i)
            {
                x = curvecoords[i].endx;
                y = curvecoords[i].endy;
                cx1 = curvecoords[i].ctrlx1;
                cx2 = curvecoords[i].ctrlx2;
                cy1 = curvecoords[i].ctrly1;
                cy2 = curvecoords[i].ctrly2;
                graphic.curveTo(cx1, cy1, cx2, cy2, x, y);
            }
        }
        else
        {
            if(this.get("direction") === "vertical")
            {
                graphic.lineTo(this._leftOrigin, ycoords[ycoords.length-1]);
                graphic.lineTo(this._leftOrigin, firstY);
            }
            else
            {
                graphic.lineTo(xcoords[xcoords.length-1], this._bottomOrigin);
                graphic.lineTo(firstX, this._bottomOrigin);
            }

        }
        graphic.lineTo(firstX, firstY);
        graphic.end();
	},
    
    /**
     * @private
     */
    _defaults: null,

    _getClosingPoints: function()
    {
        var xcoords = this.get("xcoords").concat(),
            ycoords = this.get("ycoords").concat();
        if(this.get("direction") === "vertical")
        {
            xcoords.push(this._leftOrigin);
            xcoords.push(this._leftOrigin);
            ycoords.push(ycoords[ycoords.length - 1]);
            ycoords.push(ycoords[0]);
        }
        else
        {
            xcoords.push(xcoords[xcoords.length - 1]);
            xcoords.push(xcoords[0]);
            ycoords.push(this._bottomOrigin);
            ycoords.push(this._bottomOrigin);
        }
        xcoords.push(xcoords[0]);
        ycoords.push(ycoords[0]);
        return [xcoords, ycoords];
    },

    /**
     * @private
     * Concatenates coordinate array with the correct coordinates for closing an area stack.
     */
    _getStackedClosingPoints: function()
    {
        var order = this.get("order"),
            type = this.get("type"),
            graph = this.get("graph"),
            direction = this.get("direction"),
            seriesCollection = graph.seriesTypes[type],
            prevXCoords,
            prevYCoords,
            allXCoords = this.get("xcoords").concat(),
            allYCoords = this.get("ycoords").concat(),
            firstX = allXCoords[0],
            firstY = allYCoords[0];
        
        if(order > 0)
        {
            prevXCoords = seriesCollection[order - 1].get("xcoords").concat();
            prevYCoords = seriesCollection[order - 1].get("ycoords").concat();
            allXCoords = allXCoords.concat(prevXCoords.concat().reverse());
            allYCoords = allYCoords.concat(prevYCoords.concat().reverse());
            allXCoords.push(allXCoords[0]);
            allYCoords.push(allYCoords[0]);
        }
        else
        {
            if(direction === "vertical")
            {
                allXCoords.push(this._leftOrigin);
                allXCoords.push(this._leftOrigin);
                allYCoords.push(allYCoords[allYCoords.length-1]);
                allYCoords.push(firstY);
            }
            else
            {
                allXCoords.push(allXCoords[allXCoords.length-1]);
                allXCoords.push(firstX);
                allYCoords.push(this._bottomOrigin);
                allYCoords.push(this._bottomOrigin);
            }
        }
        return [allXCoords, allYCoords];
    },

    _getAreaDefaults: function()
    {
        return {
        };
    }
};
Y.augment(Fills, Y.Attribute);
Y.Fills = Fills;
function Plots(cfg)
{
    var attrs = { 
        markers: {
            getter: function()
            {
                return this._markers;
            }
        }
    };
    this.addAttrs(attrs, cfg);
}

Plots.prototype = {
    /**
     * @private
     */
    _plotDefaults: null,

    drawPlots: function()
    {
        if(!this.get("xcoords") || this.get("xcoords").length < 1) 
		{
			return;
		}
        var style = Y.clone(this.get("styles").marker),
            w = style.width,
            h = style.height,
            xcoords = this.get("xcoords"),
            ycoords = this.get("ycoords"),
            i = 0,
            len = xcoords.length,
            top = ycoords[0],
            left,
            marker,
            mnode,
            offsetWidth = w/2,
            offsetHeight = h/2,
            fillColors = null,
            borderColors = null,
            graphOrder = this.get("graphOrder");
        if(Y.Lang.isArray(style.fill.color))
        {
            fillColors = style.fill.color.concat(); 
        }
        if(Y.Lang.isArray(style.border.color))
        {
            borderColors = style.border.colors.concat();
        }
        this._createMarkerCache();
        for(; i < len; ++i)
        {
            top = (ycoords[i] - offsetHeight);
            left = (xcoords[i] - offsetWidth);            
            if(!top || !left || top === undefined || left === undefined || top == "undefined" || left == "undefined" || isNaN(top) || isNaN(left))
            {
                this._markers.push(null);
                this._markerNodes.push(null);
                this._graphicCollection.push(null);
                this._graphicNodes.push(null);
                continue;
            }
            top += "px";
            left += "px";
            if(fillColors)
            {
                style.fill.color = fillColors[i % fillColors.length];
            }
            if(borderColors)
            {
                style.border.colors = borderColors[i % borderColors.length];
            }
            marker = this.getMarker(style, graphOrder, i);
            mnode = Y.one(marker.parentNode);
            mnode.setStyle("position", "absolute"); 
            mnode.setStyle("top", top);
            mnode.setStyle("left", left);
        }
        this._clearMarkerCache();
 	},

	_getPlotDefaults: function()
    {
        var defs = {
            fill:{
                type: "solid",
                alpha: 1,
                colors:null,
                alphas: null,
                ratios: null
            },
            border:{
                weight: 1,
                alpha: 1
            },
            width: 10,
            height: 10,
            shape: "circle"
        };
        defs.fill.color = this._getDefaultColor(this.get("graphOrder"), "fill");
        defs.border.color = this._getDefaultColor(this.get("graphOrder"), "border");
        return defs;
    },

    /**
     * @private
     * Collection of markers to be used in the series.
     */
    _markers: null,

    /**
     * @private
     * Collection of markers to be re-used on a series redraw.
     */
    _markerCache: null,
    
    /**
     * @private
     * @description Creates a marker based on its style properties.
     */
    getMarker: function(styles, order, index)
    {
        var marker,
            graphic,
            cfg;
        if(this._markerCache.length > 0)
        {
            while(!marker)
            {
                marker = this._markerCache.shift();
            }
            marker.update(styles);
        }
        else
        {
            graphic = new Y.Graphic();
            graphic.render(this.get("graph").get("contentBox"));
            graphic.node.setAttribute("id", "markerParent_" + order + "_" + index);
            cfg = Y.clone(styles);
            marker = graphic.getShape(cfg);
            Y.one(marker.node).addClass("yui3-seriesmarker");
            marker.node.setAttribute("id", "series_" + order + "_" + index);
            graphic.render(this.get("graph").get("contentBox"));
        }
        this._markers.push(marker);
        this._markerNodes.push(Y.one(marker.node));
        this._graphicCollection.push(graphic);
        this._graphicNodes.push(marker.parentNode);
        return marker;
    },   
    
    /**
     * @private
     * Creates a cache of markers for reuse.
     */
    _createMarkerCache: function()
    {
        if(this._markers && this._markers.length > 0)
        {
            this._markerCache = this._markers.concat();
        }
        else
        {
            this._markerCache = [];
        }
        this._markers = [];
        this._graphicNodes = [];
        this._markerNodes = [];
        this._graphicCollection = [];
    },
    
    /**
     * @private
     * Removes unused markers from the marker cache
     */
    _clearMarkerCache: function()
    {
        var len = this._markerCache.length,
            i = 0,
            graphic,
            marker;
        for(; i < len; ++i)
        {
            marker = this._markerCache[i];
            if(marker)
            {
                graphic = marker.graphics;
                graphic.destroy();
            }
        }
        this._markerCache = [];
    },

    updateMarkerState: function(type, i)
    {
        if(this._markers[i])
        {
            var w,
                h,
                markerStyles,
                styles = Y.clone(this.get("styles").marker),
                state = this._getState(type),
                xcoords = this.get("xcoords"),
                ycoords = this.get("ycoords"),
                marker = this._markers[i],
                graphicNode = marker.parentNode;
                markerStyles = state == "off" || !styles[state] ? styles : styles[state]; 
                markerStyles.fill.color = this._getItemColor(markerStyles.fill.color, i);
                markerStyles.border.color = this._getItemColor(markerStyles.border.color, i);
                marker.update(markerStyles);
                w = markerStyles.width;
                h = markerStyles.height;
                graphicNode.style.left = (xcoords[i] - w/2) + "px";
                graphicNode.style.top = (ycoords[i] - h/2) + "px";
                marker.toggleVisible(this.get("visible"));
        }
    },

    /**
     * @protected
     * @description parses a color from an array.
     */
    _getItemColor: function(val, i)
    {
        if(Y.Lang.isArray(val))
        {
            return val[i % val.length];
        }
        return val;
    },

    /**
     * @private
     */
    _setStyles: function(val)
    {
        val = this._parseMarkerStyles(val);
        return Y.Renderer.prototype._setStyles.apply(this, [val]);
    },

    _parseMarkerStyles: function(val)
    {
        if(val.marker)
        {
            var defs = this._getPlotDefaults();
            val.marker = this._mergeStyles(val.marker, defs);
            if(val.marker.over)
            {
                val.marker.over = this._mergeStyles(val.marker.over, val.marker);
            }
            if(val.marker.down)
            {
                val.marker.down = this._mergeStyles(val.marker.down, val.marker);
            }
        }
        return val;
    },

    /**
     * Returns marker state based on event type
     */
    _getState: function(type)
    {
        var state;
        switch(type)
        {
            case "mouseout" :
                state = "off";
            break;
            case "mouseover" :
                state = "over";
            break;
            case "mouseup" :
                state = "over";
            break;
            case "mousedown" :
                state = "down";
            break;
        }
        return state;
    },

    /**
     * @private
     */
    _toggleVisible: function(e) 
    {
        var graphic = this.get("graphic"),
            markers = this.get("markers"),
            i = 0,
            len,
            visible = this.get("visible"),
            marker;
        if(graphic)
        {
            graphic.toggleVisible(visible);
        }
        if(markers)
        {
            len = markers.length;
            for(; i < len; ++i)
            {
                marker = markers[i];
                if(marker)
                {
                    marker.toggleVisible(visible);
                }
            }

        }
    },

    _stateSyles: null
};

Y.augment(Plots, Y.Attribute);
Y.Plots = Plots;
function Histogram(){}

Histogram.prototype = {
    /**
	 * @private
	 */
	drawSeries: function()
	{
	    if(this.get("xcoords").length < 1) 
		{
			return;
		}
        var style = Y.clone(this.get("styles").marker),
            setSize,
            calculatedSize,
            xcoords = this.get("xcoords"),
            ycoords = this.get("ycoords"),
            i = 0,
            len = xcoords.length,
            top = ycoords[0],
            type = this.get("type"),
            graph = this.get("graph"),
            seriesCollection = graph.seriesTypes[type],
            seriesLen = seriesCollection.length,
            seriesSize = 0,
            totalSize = 0,
            offset = 0,
            ratio,
            renderer,
            order = this.get("order"),
            graphOrder = this.get("graphOrder"),
            left,
            marker,
            setSizeKey,
            calculatedSizeKey,
            config,
            fillColors = null,
            borderColors = null,
            mnode;
            if(Y.Lang.isArray(style.fill.color))
            {
                fillColors = style.fill.color.concat(); 
            }
            if(Y.Lang.isArray(style.border.color))
            {
                borderColors = style.border.colors.concat();
            }
            if(this.get("direction") == "vertical")
            {
                setSizeKey = "height";
                calculatedSizeKey = "width";
            }
            else
            {
                setSizeKey = "width";
                calculatedSizeKey = "height";
            }
            setSize = style[setSizeKey];
            calculatedSize = style[calculatedSizeKey];
            this._createMarkerCache();
        for(; i < seriesLen; ++i)
        {
            renderer = seriesCollection[i];
            seriesSize += renderer.get("styles").marker[setSizeKey];
            if(order > i) 
            {
                offset = seriesSize;
            }
        }
        totalSize = len * seriesSize;
        if(totalSize > graph.get(setSizeKey))
        {
            ratio = graph.get(setSizeKey)/totalSize;
            seriesSize *= ratio;
            offset *= ratio;
            setSize *= ratio;
            setSize = Math.max(setSize, 1);
        }
        offset -= seriesSize/2;
        for(i = 0; i < len; ++i)
        {
            config = this._getMarkerDimensions(xcoords[i], ycoords[i], calculatedSize, offset);
            top = config.top;
            calculatedSize = config.calculatedSize;
            left = config.left;
            style[setSizeKey] = setSize;
            style[calculatedSizeKey] = calculatedSize;
            if(fillColors)
            {
                style.fill.color = fillColors[i % fillColors.length];
            }
            if(borderColors)
            {
                style.border.colors = borderColors[i % borderColors.length];
            }
            marker = this.getMarker(style, graphOrder, i);
            mnode = Y.one(marker.parentNode);
            mnode.setStyle("position", "absolute"); 
            mnode.setStyle("top", top);
            mnode.setStyle("left", left);
        }
        this._clearMarkerCache();
    },
    
    _defaultFillColors: ["#66007f", "#a86f41", "#295454", "#996ab2", "#e8cdb7", "#90bdbd","#000000","#c3b8ca", "#968373", "#678585"],
    
    _getPlotDefaults: function()
    {
        var defs = {
            fill:{
                type: "solid",
                alpha: 1,
                colors:null,
                alphas: null,
                ratios: null
            },
            border:{
                weight: 0,
                alpha: 1
            },
            width: 12,
            height: 12,
            shape: "rect",

            padding:{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
            }
        };
        defs.fill.color = this._getDefaultColor(this.get("graphOrder"), "fill");
        defs.border.color = this._getDefaultColor(this.get("graphOrder"), "border");
        return defs;
 	}
};

Y.Histogram = Histogram;
Y.CartesianSeries = Y.Base.create("cartesianSeries", Y.Base, [Y.Renderer], {
    /**
     * @private
     */
    _xDisplayName: null,

    /**
     * @private
     */
    _yDisplayName: null,
    
    /**
     * @private
     */
    _leftOrigin: null,

    /**
     * @private
     */
    _bottomOrigin: null,

    render: function()
    {
        this._setCanvas();
        this.addListeners();
        this.set("rendered", true);
        this.validate();
    },

    /**
     * @private
     */
    addListeners: function()
    {
        var xAxis = this.get("xAxis"),
            yAxis = this.get("yAxis");
        if(xAxis)
        {
            xAxis.after("dataReady", Y.bind(this._xDataChangeHandler, this));
            xAxis.after("dataUpdate", Y.bind(this._xDataChangeHandler, this));
        }
        if(yAxis)
        {
            yAxis.after("dataReady", Y.bind(this._yDataChangeHandler, this));
            yAxis.after("dataUpdate", Y.bind(this._yDataChangeHandler, this));
        }
        this.after("xAxisChange", this._xAxisChangeHandler);
        this.after("yAxisChange", this._yAxisChangeHandler);
        this.after("stylesChange", function(e) {
            var axesReady = this._updateAxisData();
            if(axesReady)
            {
                this.draw();
            }
        });
        this.after("widthChange", function(e) {
            var axesReady = this._updateAxisData();
            if(axesReady)
            {
                this.draw();
            }
        });
        this.after("heightChange", function(e) {
            var axesReady = this._updateAxisData();
            if(axesReady)
            {
                this.draw();
            }
        });
        this.after("visibleChange", this._toggleVisible);
    },
   
    _xAxisChangeHandler: function(e)
    {
        var xAxis = this.get("xAxis");
        xAxis.after("dataReady", Y.bind(this._xDataChangeHandler, this));
        xAxis.after("dataUpdate", Y.bind(this._xDataChangeHandler, this));
    },
    
    _yAxisChangeHandler: function(e)
    {
        var yAxis = this.get("yAxis");
        yAxis.after("dataReady", Y.bind(this._yDataChangeHandler, this));
        yAxis.after("dataUpdate", Y.bind(this._yDataChangeHandler, this));
    },

	/**
	 * Constant used to generate unique id.
	 */
	GUID: "yuicartesianseries",
	
	/**
	 * @private (protected)
	 * Handles updating the graph when the x < code>Axis</code> values
	 * change.
	 */
	_xDataChangeHandler: function(event)
	{
        var axesReady = this._updateAxisData();
        if(axesReady)
		{
			this.draw();
		}
	},

	/**
	 * @private (protected)
	 * Handles updating the chart when the y <code>Axis</code> values
	 * change.
	 */
	_yDataChangeHandler: function(event)
	{
        var axesReady = this._updateAxisData();
        if(axesReady)
		{
			this.draw();
		}
	},

    /**
     * @private 
     */
    _updateAxisData: function()
    {
        var xAxis = this.get("xAxis"),
            yAxis = this.get("yAxis"),
            xKey = this.get("xKey"),
            yKey = this.get("yKey"),
            yData,
            xData;
        if(!xAxis || !yAxis || !xKey || !yKey)
        {
            return false;
        }
        xData = xAxis.getDataByKey(xKey);
        yData = yAxis.getDataByKey(yKey);
        if(!xData || !yData)
        {
            return false;
        }
        this.set("xData", xData);
        this.set("yData", yData);
        return true;
    },

    validate: function()
    {
        if((this.get("xData") && this.get("yData")) || this._updateAxisData())
        {
            this.draw();
        }
    },

    /**
     * @private
     * Creates a <code>Graphic</code> instance.
     */
    _setCanvas: function()
    {
        this.set("graphic", new Y.Graphic());
        this.get("graphic").render(this.get("graph").get("contentBox"));
    },
	/**
	 * @private
	 */
	setAreaData: function()
	{
        var nextX, nextY,
            graph = this.get("graph"),
            w = graph.get("width"),
            h = graph.get("height"),
            xAxis = this.get("xAxis"),
            yAxis = this.get("yAxis"),
            xData = this.get("xData").concat(),
            yData = this.get("yData").concat(),
            xOffset = xAxis.getEdgeOffset(xData.length, w),
            yOffset = yAxis.getEdgeOffset(yData.length, h),
            padding = this.get("styles").padding,
			leftPadding = padding.left,
			topPadding = padding.top,
			dataWidth = w - (leftPadding + padding.right + xOffset),
			dataHeight = h - (topPadding + padding.bottom + yOffset),
			xcoords = [],
			ycoords = [],
			xMax = xAxis.get("maximum"),
			xMin = xAxis.get("minimum"),
			yMax = yAxis.get("maximum"),
			yMin = yAxis.get("minimum"),
            xScaleFactor = dataWidth / (xMax - xMin),
			yScaleFactor = dataHeight / (yMax - yMin),
            dataLength,
            direction = this.get("direction"),
            i = 0,
            xMarkerPlane = [],
            yMarkerPlane = [],
            xMarkerPlaneOffset = this.get("xMarkerPlaneOffset"),
            yMarkerPlaneOffset = this.get("yMarkerPlaneOffset"),
            graphic = this.get("graphic");
        dataLength = xData.length; 	
        xOffset *= 0.5;
        yOffset *= 0.5;
        //Assuming a vertical graph has a range/category for its vertical axis.    
        if(direction === "vertical")
        {
            yData = yData.reverse();
        }
        if(graphic)
        {
            graphic.setSize(w, h);
        }
        this._leftOrigin = Math.round(((0 - xMin) * xScaleFactor) + leftPadding + xOffset);
        this._bottomOrigin =  Math.round((dataHeight + topPadding + yOffset) - (0 - yMin) * yScaleFactor);
        for (; i < dataLength; ++i) 
		{
            nextX = Math.round((((xData[i] - xMin) * xScaleFactor) + leftPadding + xOffset));
			nextY = Math.round(((dataHeight + topPadding + yOffset) - (yData[i] - yMin) * yScaleFactor));
            xcoords.push(nextX);
            ycoords.push(nextY);
            xMarkerPlane.push({start:nextX - xMarkerPlaneOffset, end: nextX + xMarkerPlaneOffset});
            yMarkerPlane.push({start:nextY - yMarkerPlaneOffset, end: nextY + yMarkerPlaneOffset});
        }
        this.set("xcoords", xcoords);
		this.set("ycoords", ycoords);
        this.set("xMarkerPlane", xMarkerPlane);
        this.set("yMarkerPlane", yMarkerPlane);
    },

	/**
	 * @private (override)
	 */
	draw: function()
    {
        var graph = this.get("graph"),
            w = graph.get("width"),
            h = graph.get("height");
        if(this.get("rendered"))
        {
            if((isFinite(w) && isFinite(h) && w > 0 && h > 0) && ((this.get("xData") && this.get("yData")) || this._updateAxisData()))
            {
                this.setAreaData();
                this.drawSeries();
                this._toggleVisible(this.get("visible"));
                this.fire("drawingComplete");
            }
        }
	},
    
    _defaultPlaneOffset: 4,
    
    /**
     * @private
     * @return Default styles for the widget
     */
    _getDefaultStyles: function()
    {
        return {padding:{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
            }};
    },

    /**
     * @private
     */
    _defaultLineColors:["#426ab3", "#d09b2c", "#000000", "#b82837", "#b384b5", "#ff7200", "#779de3", "#cbc8ba", "#7ed7a6", "#007a6c"],

    /**
     * @private
     */
    _defaultFillColors:["#6084d0", "#eeb647", "#6c6b5f", "#d6484f", "#ce9ed1", "#ff9f3b", "#93b7ff", "#e0ddd0", "#94ecba", "#309687"],
    
    /**
     * @private
     */
    _defaultBorderColors:["#205096", "#b38206", "#000000", "#94001e", "#9d6fa0", "#e55b00", "#5e85c9", "#adab9e", "#6ac291", "#006457"],
    
    /**
     * @private
     */
    _defaultSliceColors: ["#66007f", "#a86f41", "#295454", "#996ab2", "#e8cdb7", "#90bdbd","#000000","#c3b8ca", "#968373", "#678585"],

    /**
     * @private
     * @description Colors used if style colors are not specified
     */
    _getDefaultColor: function(index, type)
    {
        var colors = {
                line: this._defaultLineColors,
                fill: this._defaultFillColors,
                border: this._defaultBorderColors,
                slice: this._defaultSliceColors
            },
            col = colors[type],
            l = col.length;
        index = index || 0;
        if(index >= l)
        {
            index = index % l;
        }
        type = type || "fill";
        return colors[type][index];
    },
    
    /**
     * @private
     */
    _toggleVisible: function(e) 
    {
        var graphic = this.get("graphic");
        if(graphic)
        {
            graphic.toggleVisible(this.get("visible"));
        }
    }
}, {
    ATTRS: {
        xDisplayName: {
            getter: function()
            {
                return this._xDisplayName || this.get("xKey");
            },

            setter: function(val)
            {
                this._xDisplayName = val;
                return val;
            }
        },

        yDisplayName: {
            getter: function()
            {
                return this._yDisplayName || this.get("yKey");
            },

            setter: function(val)
            {
                this._yDisplayName = val;
                return val;
            }
        },
        
        categoryDisplayName: {
            readOnly: true,

            getter: function()
            {
                return this.get("direction") == "vertical" ? this.get("yDisplayName") : this.get("xDisplayName");
            }
        },

        valueDisplayName: {
            readOnly: true,

            getter: function()
            {
                return this.get("direction") == "vertical" ? this.get("xDisplayName") : this.get("yDisplayName");
            }
        },

        type: {		
            value: "cartesian"
        },

        /**
         * Order of this ISeries instance of this <code>type</code>.
         */
        order: {},

        /**
         * Order of the ISeries instance
         */
        graphOrder: {},

        /**
         * x coordinates for the series.
         */
        xcoords: {},
        
        /**
         * y coordinates for the series
         */
        ycoords: {},
        
        graph: {},

        /**
         * Reference to the <code>Axis</code> instance used for assigning 
         * x-values to the graph.
         */
        xAxis: {},
        
        yAxis: {},
        /**
         * Indicates which array to from the hash of value arrays in 
         * the x-axis <code>Axis</code> instance.
         */
        xKey: {},
        /**
         * Indicates which array to from the hash of value arrays in 
         * the y-axis <code>Axis</code> instance.
         */
        yKey: {},

        /**
         * Array of x values for the series.
         */
        xData: {},

        /**
         * Array of y values for the series.
         */
        yData: {},
       
        rendered: {
            value: false
        },

        /*
         * Returns the width of the parent graph
         */
        width: {
            readOnly: true,
            
            getter: function()
            {
                this.get("graph").get("width");
            }
        },

        /**
         * Returns the height of the parent graph
         */
        height: {
            readOnly: true,
            
            getter: function()
            {
                this.get("graph").get("height");
            }
        },

        /**
         * Indicates whether to show the series
         */
        visible: {
            value: true
        },

        /**
         * Collection of area maps along the xAxis. Used to determine mouseover for multiple
         * series.
         */
        xMarkerPlane: {},
        
        /**
         * Collection of area maps along the yAxis. Used to determine mouseover for multiple
         * series.
         */
        yMarkerPlane: {},

        /**
         * Distance from a data coordinate to the left/right for setting a hotspot.
         */
        xMarkerPlaneOffset: {
            getter: function() {
                var marker = this.get("styles").marker;
                if(marker && marker.width && isFinite(marker.width))
                {
                    return marker.width * 0.5;
                }
                return this._defaultPlaneOffset;
            }
        },

        /**
         * Distance from a data coordinate to the top/bottom for setting a hotspot.
         */
        yMarkerPlaneOffset: {
            getter: function() {
                var marker = this.get("styles").marker;
                if(marker && marker.height && isFinite(marker.height))
                {
                    return marker.height * 0.5;
                }
                return this._defaultPlaneOffset;
            }
        },

        /**
         * Direction of the series
         */
        direction: {
            value: "horizontal"
        }
    }
});
Y.MarkerSeries = Y.Base.create("markerSeries", Y.CartesianSeries, [Y.Plots], {
    /**
     * @private
     */
    renderUI: function()
    {
        this._setNode();
    },
    /**
     * @private
     */
    drawSeries: function()
    {
        this.drawPlots();
    },
    /**
     * @private
     */
    _setStyles: function(val)
    {
        if(!val.marker)
        {
            val = {marker:val};
        }
        val = this._parseMarkerStyles(val);
        return Y.MarkerSeries.superclass._mergeStyles.apply(this, [val, this._getDefaultStyles()]);
    },
    /**
     * @private
     */
    _getDefaultStyles: function()
    {
        var styles = this._mergeStyles({marker:this._getPlotDefaults()}, Y.MarkerSeries.superclass._getDefaultStyles());
        return styles;
    }
},{
    ATTRS : {
        /**
         * Indicates the type of graph.
         */
        type: {
            value:"marker"
        }
    }
});

Y.PieSeries = Y.Base.create("pieSeries", Y.MarkerSeries, [], { 
    /**
     * @private
     */
    _categoryDisplayName: null,
    
    /**
     * @private
     */
    _valueDisplayName: null,

    /**
     * @private
     */
    addListeners: function()
    {
        var categoryAxis = this.get("categoryAxis"),
            valueAxis = this.get("valueAxis");
        if(categoryAxis)
        {
            categoryAxis.after("dataReady", Y.bind(this._categoryDataChangeHandler, this));
            categoryAxis.after("dataUpdate", Y.bind(this._categoryDataChangeHandler, this));
        }
        if(valueAxis)
        {
            valueAxis.after("dataReady", Y.bind(this._valueDataChangeHandler, this));
            valueAxis.after("dataUpdate", Y.bind(this._valueDataChangeHandler, this));
        }
        this.after("categoryAxisChange", this.categoryAxisChangeHandler);
        this.after("valueAxisChange", this.valueAxisChangeHandler);
        this.after("stylesChange", this._updateHandler);
    },
   
    validate: function()
    {
        this.draw();
        this._renderered = true;
    },

    _categoryAxisChangeHandler: function(e)
    {
        var categoryAxis = this.get("categoryAxis");
        categoryAxis.after("dataReady", Y.bind(this._categoryDataChangeHandler, this));
        categoryAxis.after("dataUpdate", Y.bind(this._categoryDataChangeHandler, this));
    },
    
    _valueAxisChangeHandler: function(e)
    {
        var valueAxis = this.get("valueAxis");
        valueAxis.after("dataReady", Y.bind(this._valueDataChangeHandler, this));
        valueAxis.after("dataUpdate", Y.bind(this._valueDataChangeHandler, this));
    },
	/**
	 * Constant used to generate unique id.
	 */
	GUID: "pieseries",
	
	/**
	 * @private (protected)
	 * Handles updating the graph when the x < code>Axis</code> values
	 * change.
	 */
	_categoryDataChangeHandler: function(event)
	{
       if(this._rendered && this.get("categoryKey") && this.get("valueKey"))
		{
			this.draw();
		}
	},

	/**
	 * @private (protected)
	 * Handles updating the chart when the y <code>Axis</code> values
	 * change.
	 */
	_valueDataChangeHandler: function(event)
	{
        if(this._rendered && this.get("categoryKey") && this.get("valueKey"))
		{
            this.draw();
		}
	},
   
	/**
	 * @private (override)
	 */
	draw: function()
    {
        var graph = this.get("graph"),
            w = graph.get("width"),
            h = graph.get("height");
        if(isFinite(w) && isFinite(h) && w > 0 && h > 0)
		{   
            this._rendered = true;
            this.drawSeries();
            this.fire("drawingComplete");
		}
	},
    
    /**
     * @private
     */
	drawPlots: function()
    {
        var values = this.get("valueAxis").getDataByKey(this.get("valueKey")).concat(),
            catValues = this.get("categoryAxis").getDataByKey(this.get("categoryKey")).concat(),
            totalValue = 0,
            itemCount = values.length,
            styles = this.get("styles").marker,
            fillColors = styles.fill.colors,
            fillAlphas = styles.fill.alphas || ["1"],
            borderColors = styles.border.colors,
            borderWeights = [styles.border.weight],
            borderAlphas = [styles.border.alpha],
            tbw = borderWeights.concat(),
            tbc = borderColors.concat(),
            tba = borderAlphas.concat(),
            tfc,
            tfa,
            padding = styles.padding,
            graph = this.get("graph"),
			w = graph.get("width") - (padding.left + padding.right),
            h = graph.get("height") - (padding.top + padding.bottom),
            startAngle = -90,
            halfWidth = w / 2,
            halfHeight = h / 2,
            radius = Math.min(halfWidth, halfHeight),
            i = 0,
            value,
            angle = 0,
            lc,
            la,
            lw,
            wedgeStyle,
            marker,
            graphOrder = this.get("graphOrder"),
            mnode;
        for(; i < itemCount; ++i)
        {
            value = values[i];
            
            values.push(value);
            if(!isNaN(value))
            {
                totalValue += value;
            }
        }
        
        tfc = fillColors ? fillColors.concat() : null;
        tfa = fillAlphas ? fillAlphas.concat() : null;
        this._createMarkerCache();
        for(i = 0; i < itemCount; i++)
        {
            value = values[i];
            if(totalValue === 0)
            {
                angle = 360 / values.length;
            }
            else
            {
                angle = 360 * (value / totalValue);
            }
            angle = Math.round(angle);
            if(tfc && tfc.length < 1)
            {
                tfc = fillColors.concat();
            }
            if(tfa && tfa.length < 1)
            {
                tfa = fillAlphas.concat();
            }
            if(tbw && tbw.length < 1)
            {
                tbw = borderWeights.concat();
            }
            if(tbw && tbc.length < 1)
            {
                tbc = borderColors.concat();
            }
            if(tba && tba.length < 1)
            {
                tba = borderAlphas.concat();
            }
            lw = tbw ? tbw.shift() : null;
            lc = tbc ? tbc.shift() : null;
            la = tba ? tba.shift() : null;
            startAngle += angle;
            wedgeStyle = {
                border: {
                    color:lc,
                    weight:lw,
                    alpha:la
                },
                fill: {
                    color:tfc ? tfc.shift() : this._getDefaultColor(i, "slice"),
                    alpha:tfa ? tfa.shift() : null
                },
                shape: "wedge",
                props: {
                    arc: angle,
                    radius: radius,
                    startAngle: startAngle,
                    x: halfWidth,
                    y: halfHeight
                },
                width: w,
                height: h
            };
            marker = this.getMarker(wedgeStyle, graphOrder, i);
            mnode = Y.one(marker.parent);
        }
        this._clearMarkerCache();
    },

    updateMarkerState: function(type, i)
    {
        var state = this._getState(type),
            markerStyles,
            indexStyles,
            marker = this._markers[i],
            graphicNode = this._graphicNodes[i],
            styles = this.get("styles").marker; 
            markerStyles = state == "off" || !styles[state] ? styles : styles[state]; 
            indexStyles = this._mergeStyles(markerStyles, {});
            indexStyles.fill.color = indexStyles.fill.colors[i % indexStyles.fill.colors.length];
            indexStyles.fill.alpha = indexStyles.fill.alphas[i % indexStyles.fill.alphas.length];
            marker.update(indexStyles);
            if(state == "over" || state == "down")
            {
                Y.one(graphicNode).setStyle("zIndex", 3);
            }
            else
            {
                Y.one(graphicNode).setStyle("zIndex", 2);
            }
    },
    
    /**
     * @private
     * @return Default styles for the widget
     */
    _getPlotDefaults: function()
    {
         var defs = {
            padding:{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
            },
            fill:{
                alphas:["1"]
            },
            border: {
                weight: 0,
                alpha: 1
            }
        };
        defs.fill.colors = this._defaultSliceColors;
        defs.border.colors = this._defaultBorderColors;
        return defs;
    },

    /**
     * @private
     */
    _defaultLineColors:["#426ab3", "#d09b2c", "#000000", "#b82837", "#b384b5", "#ff7200", "#779de3", "#cbc8ba", "#7ed7a6", "#007a6c"],

    /**
     * @private
     */
    _defaultFillColors:["#6084d0", "#eeb647", "#6c6b5f", "#d6484f", "#ce9ed1", "#ff9f3b", "#93b7ff", "#e0ddd0", "#94ecba", "#309687"],
    
    /**
     * @private
     */
    _defaultBorderColors:["#205096", "#b38206", "#000000", "#94001e", "#9d6fa0", "#e55b00", "#5e85c9", "#adab9e", "#6ac291", "#006457"],
    
    /**
     * @private
     */
    _defaultSliceColors: ["#66007f", "#a86f41", "#295454", "#996ab2", "#e8cdb7", "#90bdbd","#000000","#c3b8ca", "#968373", "#678585"],

    /**
     * @private
     * @description Colors used if style colors are not specified
     */
    _getDefaultColor: function(index, type)
    {
        var colors = {
                line: this._defaultLineColors,
                fill: this._defaultFillColors,
                border: this._defaultBorderColors,
                slice: this._defaultSliceColors
            },
            col = colors[type],
            l = col.length;
        index = index || 0;
        if(index >= l)
        {
            index = index % l;
        }
        type = type || "fill";
        return colors[type][index];
    }
}, {
    ATTRS: {

        type: {		
            value: "pie"
        },
        /**
         * Order of this ISeries instance of this <code>type</code>.
         */
        order: {},
        graph: {},
        /**
         * Reference to the <code>Axis</code> instance used for assigning 
         * x-values to the graph.
         */
        categoryAxis: {
            value: null,

            validator: function(value)
            {
                return value !== this.get("categoryAxis");
            }
        },
        
        valueAxis: {
            value: null,

            validator: function(value)
            {
                return value !== this.get("valueAxis");
            }
        },
        /**
         * Indicates which array to from the hash of value arrays in 
         * the category <code>Axis</code> instance.
         */
        categoryKey: {
            value: null,

            validator: function(value)
            {
                return value !== this.get("categoryKey");
            }
        },
        /**
         * Indicates which array to from the hash of value arrays in 
         * the value <code>Axis</code> instance.
         */
        valueKey: {
            value: null,

            validator: function(value)
            {
                return value !== this.get("valueKey");
            }
        },

        categoryDisplayName: {
            setter: function(val)
            {
                this._categoryDisplayName = val;
                return val;
            },

            getter: function()
            {
                return this._categoryDisplayName || this.get("categoryKey");
            }
        },

        valueDisplayName: {
            setter: function(val)
            {
                this._valueDisplayName = val;
                return val;
            },

            getter: function()
            {
                return this._valueDisplayName || this.get("valueKey");
            }
        },

        slices: null
    }
});
Y.LineSeries = Y.Base.create("lineSeries", Y.CartesianSeries, [Y.Lines], {
    drawSeries: function()
    {
        this.get("graphic").clear();
        this.drawLines();
    },

    _setStyles: function(val)
    {
        if(!val.line)
        {
            val = {line:val};
        }
        return Y.LineSeries.superclass._setStyles.apply(this, [val]);
    },

    _getDefaultStyles: function()
    {
        var styles = this._mergeStyles({line:this._getLineDefaults()}, Y.LineSeries.superclass._getDefaultStyles());
        return styles;
    }
},
{
    ATTRS: {
        /**
         * Indicates the type of graph.
         */
        type: {
            value:"line"
        }

    }
});



		

		
Y.SplineSeries = Y.Base.create("splineSeries",  Y.CartesianSeries, [Y.CurveUtil, Y.Lines], {
	/**
	 * @private
	 */
	drawSeries: function()
	{
        this.get("graphic").clear();
        this.drawSpline();
    }
}, {
	ATTRS : {
        type : {
            /**
             * Indicates the type of graph.
             */
            value:"spline"
        }
    }
});



		

		
Y.AreaSplineSeries = Y.Base.create("areaSplineSeries", Y.CartesianSeries, [Y.Fills, Y.CurveUtil], {
	/**
	 * @private
	 */
	drawSeries: function()
	{
        this.get("graphic").clear();
        this.drawAreaSpline();
    }
}, {
	ATTRS : {
        type: {
            /**
             * Indicates the type of graph.
             */
            value:"areaSpline"
        }
    }
});

Y.StackedSplineSeries = Y.Base.create("stackedSplineSeries", Y.SplineSeries, [Y.StackingUtil], {
    setAreaData: function()
    {   
        Y.StackedSplineSeries.superclass.setAreaData.apply(this);
        this._stackCoordinates.apply(this);
    }
}, {
    ATTRS: {
        /**
         * Indicates the type of graph.
         */
        type: {
            value:"stackedSpline"
        }
    }
});

Y.StackedMarkerSeries = Y.Base.create("stackedMarkerSeries", Y.MarkerSeries, [Y.StackingUtil], {
    setAreaData: function()
    {   
        Y.StackedMarkerSeries.superclass.setAreaData.apply(this);
        this._stackCoordinates.apply(this);
    }
}, {
    ATTRS: {
        /**
         * Indicates the type of graph.
         */
        type: {
            value:"stackedMarker"
        }
    }
});

Y.ColumnSeries = Y.Base.create("columnSeries", Y.MarkerSeries, [Y.Histogram], {
    _getMarkerDimensions: function(xcoord, ycoord, calculatedSize, offset)
    {
        var config = {
            top: ycoord,
            left: xcoord + offset
        };
        config.calculatedSize = this._bottomOrigin - config.top;
        return config;
    },

    /**
     * @private
     * Resizes and positions markers based on a mouse interaction.
     */
    updateMarkerState: function(type, i)
    {
        var styles = Y.clone(this.get("styles").marker),
            markerStyles,
            state = this._getState(type),
            xcoords = this.get("xcoords"),
            ycoords = this.get("ycoords"),
            marker = this._markers[i],
            graph = this.get("graph"),
            seriesCollection = graph.seriesTypes[this.get("type")],
            seriesLen = seriesCollection.length,
            seriesSize = 0,
            offset = 0,
            renderer,
            n = 0,
            xs = [],
            order = this.get("order");
        markerStyles = state == "off" || !styles[state] ? styles : styles[state]; 
        markerStyles.fill.color = this._getItemColor(markerStyles.fill.color, i);
        markerStyles.border.color = this._getItemColor(markerStyles.border.color, i);
        markerStyles.height = this._bottomOrigin - ycoords[i];
        marker.update(markerStyles);
        for(; n < seriesLen; ++n)
        {
            renderer = seriesCollection[n].get("markers")[i];
            xs[n] = xcoords[i] + seriesSize;
            seriesSize += renderer.width;
            if(order > n)
            {
                offset = seriesSize;
            }
            offset -= seriesSize/2;
        }
        for(n = 0; n < seriesLen; ++n)
        {
            renderer = Y.one(seriesCollection[n]._graphicNodes[i]);
            renderer.setStyle("left", (xs[n] - seriesSize/2) + "px");
        }
    }
}, {
    ATTRS: {
        type: {
            value: "column"
        }
    }
});
Y.BarSeries = Y.Base.create("barSeries", Y.MarkerSeries, [Y.Histogram], {
    /**
     * @private
     */
    renderUI: function()
    {
        this._setNode();
    },

    _getMarkerDimensions: function(xcoord, ycoord, calculatedSize, offset)
    {
        var config = {
            top: ycoord + offset,
            left: this._leftOrigin
        };
        config.calculatedSize = xcoord - config.left;
        return config;
    },
    
    /**
     * @private
     * Resizes and positions markers based on a mouse interaction.
     */
    updateMarkerState: function(type, i)
    {
        var styles = Y.clone(this.get("styles").marker),
            markerStyles,
            state = this._getState(type),
            xcoords = this.get("xcoords"),
            ycoords = this.get("ycoords"),
            marker = this._markers[i],
            graph = this.get("graph"),
            seriesCollection = graph.seriesTypes[this.get("type")],
            seriesLen = seriesCollection.length,
            seriesSize = 0,
            offset = 0,
            renderer,
            n = 0,
            ys = [],
            order = this.get("order");
        markerStyles = state == "off" || !styles[state] ? styles : styles[state]; 
        markerStyles.fill.color = this._getItemColor(markerStyles.fill.color, i);
        markerStyles.border.color = this._getItemColor(markerStyles.border.color, i);
        markerStyles.width = (xcoords[i] - this._leftOrigin);
        marker.update(markerStyles);
        for(; n < seriesLen; ++n)
        {
            renderer = seriesCollection[n].get("markers")[i];
            ys[n] = ycoords[i] + seriesSize;
            seriesSize += renderer.height;
            if(order > n)
            {
                offset = seriesSize;
            }
            offset -= seriesSize/2;
        }
        for(n = 0; n < seriesLen; ++n)
        {
            renderer = Y.one(seriesCollection[n]._graphicNodes[i]);
            renderer.setStyle("top", (ys[n] - seriesSize/2));
        }
    }
}, {
    ATTRS: {
        type: {
            value: "bar"
        },
        direction: {
            value: "vertical"
        }
    }
});
Y.AreaSeries = Y.Base.create("areaSeries", Y.CartesianSeries, [Y.Fills], {
	drawSeries: function()
    {
        this.get("graphic").clear();
        this.drawFill.apply(this, this._getClosingPoints());
    },
    
    _setStyles: function(val)
    {
        if(!val.area)
        {
            val = {area:val};
        }
        return Y.AreaSeries.superclass._setStyles.apply(this, [val]);
    },

    _getDefaultStyles: function()
    {
        var styles = this._mergeStyles({area:this._getAreaDefaults()}, Y.AreaSeries.superclass._getDefaultStyles());
        return styles;
    }
},
{
    ATTRS: {
        type: {
            /**
             * Indicates the type of graph.
             */
            value:"area"
        }
    }
});



		

		
Y.StackedAreaSplineSeries = Y.Base.create("stackedAreaSplineSeries", Y.AreaSeries, [Y.CurveUtil, Y.StackingUtil], {
	/**
	 * @private
	 */
	drawSeries: function()
	{
        this.get("graphic").clear();
        this._stackCoordinates();
        this.drawStackedAreaSpline();
    }
}, {
    ATTRS : {
        /**
         * Indicates the type of graph.
         */
        type: {
            value:"stackedAreaSpline"
        }
    }
});

Y.ComboSeries = Y.Base.create("comboSeries", Y.CartesianSeries, [Y.Fills, Y.Lines, Y.Plots], {
	drawSeries: function()
    {
        this.get("graphic").clear();
        if(this.get("showAreaFill"))
        {
            this.drawFill.apply(this, this._getClosingPoints());
        }
        if(this.get("showLines")) 
        {
            this.drawLines();
        }
        if(this.get("showMarkers"))
        {
            this.drawPlots();
        }   
    },

    /**
     * @private
     */
    _getDefaultStyles: function()
    {
        var styles = Y.ComboSeries.superclass._getDefaultStyles();
        styles.line = this._getLineDefaults();
        styles.marker = this._getPlotDefaults();
        styles.area = this._getAreaDefaults();
        return styles;
    }
},
{
    ATTRS: {
        type: {
            value:"combo"
        },

        showAreaFill: {
            value: false
        },

        showLines: {
            value: true
        },

        showMarkers: {
            value: true
        },

        marker: {
            lazyAdd: false,
            getter: function()
            {
                return this.get("styles").marker;
            },
            setter: function(val)
            {
                this.set("styles", {marker:val});
            }
        },

        line: {
            lazyAdd: false,
            getter: function()
            {
                return this.get("styles").line;
            },
            setter: function(val)
            {
                this.set("styles", {line:val});
            }
        },

        area: {
            lazyAdd: false,
            getter: function()
            {
                return this.get("styles").area;
            },
            setter: function(val)
            {
                this.set("styles", {area:val});
            }
        }
    }
});



		

		
Y.StackedComboSeries = Y.Base.create("stackedComboSeries", Y.ComboSeries, [Y.StackingUtil], {
    setAreaData: function()
    {   
        Y.StackedComboSeries.superclass.setAreaData.apply(this);
        this._stackCoordinates.apply(this);
    },
	
    drawSeries: function()
    {
        this.get("graphic").clear();
        if(this.get("showAreaFill"))
        {
            this.drawFill.apply(this, this._getStackedClosingPoints());
        }
        if(this.get("showLines")) 
        {
            this.drawLines();
        }
        if(this.get("showMarkers"))
        {
            this.drawPlots();
        }   
    }
    
}, {
    ATTRS : {
        type: {
            value: "stackedCombo"
        },

        showAreaFill: {
            value: true
        }
    }
});
Y.ComboSplineSeries = Y.Base.create("comboSplineSeries", Y.ComboSeries, [Y.CurveUtil], {
	drawSeries: function()
    {
        this.get("graphic").clear();
        if(this.get("showAreaFill"))
        {
            this.drawAreaSpline();
        }
        if(this.get("showLines")) 
        {
            this.drawSpline();
        }
        if(this.get("showMarkers"))
        {
            this.drawPlots();
        }   
    }
}, {
    ATTRS: {
        type: {
            value : "comboSpline"
        }
    }
});
Y.StackedComboSplineSeries = Y.Base.create("stackedComboSplineSeries", Y.StackedComboSeries, [Y.CurveUtil], {
	drawSeries: function()
    {
        this.get("graphic").clear();
        if(this.get("showAreaFill"))
        {
            this.drawStackedAreaSpline();
        }
        if(this.get("showLines")) 
        {
            this.drawSpline();
        }
        if(this.get("showMarkers"))
        {
            this.drawPlots();
        }   
    }
}, {
    ATTRS: {
        type : {
            value : "stackedComboSpline"
        },

        showAreaFill: {
            value: true
        }
    }
});
function RangeSeries(config)
{
	RangeSeries.superclass.constructor.apply(this, arguments);
}

RangeSeries.NAME = "rangeSeries";

RangeSeries.ATTRS = {
	type: {
        value: "range"
    }
};

Y.extend(RangeSeries, Y.CartesianSeries, {
	/**
	 * @private
	 */
	setAreaData: function()
	{
        var nextX, nextY,
            node = Y.Node.one(this._parentNode).get("parentNode"),
			w = node.get("offsetWidth"),
            h = node.get("offsetHeight"),
            padding = this.get("styles").padding,
			leftPadding = padding.left,
			topPadding = padding.top,
            xAxis = this.get("xAxis"),
            yAxis = this.get("yAxis"),
			xKey = this.get("xKey"),
			yKey = this.get("yKey"),
			xData = xAxis.getDataByKey(xKey).concat(),
			yData = yAxis.getDataByKey(yKey).concat(),
            xOffset = xAxis.getEdgeOffset(xData.length, w),
			dataWidth = w - (leftPadding + padding.right + xOffset),
			dataHeight = h - (topPadding + padding.bottom),
			xcoords = [],
			ycoords = [],
			xMax = xAxis.get("maximum"),
			xMin = xAxis.get("minimum"),
			yMax = yAxis.get("maximum"),
			yMin = yAxis.get("minimum"),
			xScaleFactor = dataWidth / (xMax - xMin),
			yScaleFactor = dataHeight / (yMax - yMin),
			dataLength = xData.length, 	
            i,
            yValues;
        xOffset *= 0.5;
        this.get("graphic").setSize(w, h);
        this._leftOrigin = Math.round(((0 - xMin) * xScaleFactor) + leftPadding);
        this._bottomOrigin =  Math.round((dataHeight + topPadding) - (0 - yMin) * yScaleFactor);
        for (i = 0; i < dataLength; ++i) 
		{
            yValues = yData[i];
            nextX = Math.round((((xData[i] - xMin) * xScaleFactor) + leftPadding + xOffset));
			nextY = {
                h: Math.round(((dataHeight + topPadding) - (yValues.high - yMin) * yScaleFactor)),
                l: Math.round(((dataHeight + topPadding) - (yValues.low - yMin) * yScaleFactor)),
                o: Math.round(((dataHeight + topPadding) - (yValues.open - yMin) * yScaleFactor)),
                c: Math.round(((dataHeight + topPadding) - (yValues.close - yMin) * yScaleFactor))
            };
            xcoords.push(nextX);
            ycoords.push(nextY);
        }
        this.set("xcoords", xcoords);
		this.set("ycoords", ycoords);
    },

    /**
     * @private
     */
	drawSeries: function()
	{
	    if(this.get("xcoords").length < 1) 
		{
			return;
		}
        var graphic = this.get("graphic"),
            style = this.get("styles").marker,
            w = style.width,
            xcoords = this.get("xcoords"),
            ycoords = this.get("ycoords"),
            i = 0,
            len = xcoords.length,
            type = this.get("type"),
            graph = this.get("graph"),
            seriesCollection = graph.seriesTypes[type],
            seriesLen = seriesCollection.length,
            seriesWidth = 0,
            totalWidth = 0,
            offset = 0,
            ratio,
            renderer,
            order = this.get("order"),
            node = Y.Node.one(this._parentNode).get("parentNode"),
            left,
            hloc;
        for(; i < seriesLen; ++i)
        {
            renderer = seriesCollection[i];
            seriesWidth += renderer.get("styles").marker.width;
            if(order > i) 
            {
                offset = seriesWidth;
            }
        }
        totalWidth = len * seriesWidth;
        if(totalWidth > node.offsetWidth)
        {
            ratio = this.width/totalWidth;
            seriesWidth *= ratio;
            offset *= ratio;
            w *= ratio;
            w = Math.max(w, 1);
        }
        offset -= seriesWidth/2;
        for(i = 0; i < len; ++i)
        {
            hloc = ycoords[i];
            left = xcoords[i] + offset;
            this.drawMarker(graphic, hloc, left, style);
        }
 	}
});

Y.RangeSeries = RangeSeries;
function OHLCSeries(config)
{
	OHLCSeries.superclass.constructor.apply(this, arguments);
}

OHLCSeries.NAME = "ohlcSeries";

OHLCSeries.ATTRS = {
	type: {
        value: "ohlc"
    }
};

Y.extend(OHLCSeries, Y.RangeSeries, {
	/**
	 * @private
	 */
    drawMarker: function(graphic, hloc, left, style)
    {
        var h = hloc.h,
            o = hloc.o,
            l = hloc.l,
            c = hloc.c,
            w = style.width,
            color,
            upColor = style.upColor,
            downColor = style.downColor,
            alpha,
            upAlpha = style.upAlpha,
            downAlpha = style.downAlpha,
            up = c < o,
            thickness = style.thickness,
            center = left + w * 0.5;
            color = up ? upColor : downColor;
            alpha = up ? upAlpha : downAlpha;
        graphic.lineStyle(thickness, color, alpha);
        graphic.moveTo(left, o);
        graphic.lineTo(center, o);
        graphic.moveTo(center, h);
        graphic.lineTo(center, l);
        graphic.moveTo(center, c);
        graphic.lineTo(left + w, c);
        graphic.end();
    },
	
	/**
	 * @private
	 */
	_getDefaultStyles: function()
    {
        return {
            marker: {
                upColor: "#aaaaaa",
                upAlpha: 1,
                thickness:1,
                borderAlpha:1,
                downColor: "#000000",
                downAlpha: 1,
                width:6,
                height:6
            },
            padding:{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
            }
        };
    }
});

Y.OHLCSeries = OHLCSeries;
function CandlestickSeries(config)
{
	CandlestickSeries.superclass.constructor.apply(this, arguments);
}

CandlestickSeries.NAME = "candlestickSeries";

CandlestickSeries.ATTRS = {
	type: {
        value: "candlestick"
    }
};

Y.extend(CandlestickSeries, Y.RangeSeries, {
    /**
     * @private
     */
    drawMarker: function(graphic, hloc, left, style)
    {
        var h = hloc.h,
            o = hloc.o,
            l = hloc.l,
            c = hloc.c,
            ht = Math.abs(c - o),
            w = style.width,
            fillColor,
            upFillColor = style.upFillColor,
            downFillColor = style.downFillColor,
            alpha,
            upAlpha = style.upFillAlpha,
            downAlpha = style.downFillAlpha,
            up = c < o,
            upFillType = style.upFillType || "solid",
            downFillType = style.downFillType || "solid",
            borderWidth = style.borderWidth,
            borderColor = style.borderColor,
            borderAlpha = style.borderAlpha || 1,
            colors,
            upColors = style.upColors,
            downColors = style.downColors,
            alphas,
            upAlphas = style.upAlphas || [],
            downAlphas = style.downAlphas || [],
            ratios,
            upRatios = style.upRatios || [],
            downRatios = style.downRatios || [],
            rotation,
            upRotation = style.upRotation || 0,
            downRotation = style.downRotation || 0,
            fillType = up ? upFillType : downFillType,
            top = c < o ? c : o,
            bottom = c < o ? o : c,
            center = left + w * 0.5;
        if(borderWidth > 0)
        {
            graphic.lineStyle(borderWidth, borderColor, borderAlpha);
        }
        if(fillType === "solid")
        {
            fillColor = up ? upFillColor : downFillColor;
            alpha = up ? upAlpha : downAlpha;
            graphic.beginFill(fillColor, alpha);
        }
        else
        {
            colors = up ? upColors : downColors;
            rotation = up ? upRotation : downRotation;
            ratios = up ? upRatios : downRatios;
            alphas = up ? upAlphas : downAlphas;
            graphic.beginGradientFill(fillType, colors, alphas, ratios, {rotation:rotation, width:w, height:ht});
        }
        if(top > h)
        {
            graphic.moveTo(center, h);
            graphic.lineTo(center, top);
        }
        graphic.drawRect(left, top, w, ht);
        if(l > c && l > o)
        {
            graphic.moveTo(center, bottom);
            graphic.lineTo(center, l);
        }
        graphic.end();
    },
	
	_getDefaultStyles: function()
    {
        return {
            marker: {
                upFillColor: "#ffffff",
                upFillAlpha: 1,
                borderColor:"#000000",
                borderWidth:1,
                borderAlpha:1,
                upColors:[],
                upAlphas:[],
                upRatios:[],
                upRotation:0,
                downFillColor: "#000000",
                downFillAlpha: 1,
                downBorderColor:"#000000",
                downBorderWidth:0,
                downBorderAlpha:1,
                downColors:[],
                downAlphas:[],
                downRatios:[],
                downRotation:0,
                width:6,
                height:6
            },
            padding:{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
            }
        };
    }
});

Y.CandlestickSeries = CandlestickSeries;
Y.StackedLineSeries = Y.Base.create("stackedLineSeries", Y.LineSeries, [Y.StackingUtil], {
    setAreaData: function()
    {   
        Y.StackedLineSeries.superclass.setAreaData.apply(this);
        this._stackCoordinates.apply(this);
    }
}, {
    ATTRS: {
        type: {
            /**
             * Indicates the type of graph.
             */
            value:"stackedLine"
        }
    }
});
Y.StackedAreaSeries = Y.Base.create("stackedAreaSeries", Y.AreaSeries, [Y.StackingUtil], {
    setAreaData: function()
    {   
        Y.StackedAreaSeries.superclass.setAreaData.apply(this);
        this._stackCoordinates.apply(this);
    },

	drawSeries: function()
    {
        this.get("graphic").clear();
        this.drawFill.apply(this, this._getStackedClosingPoints());
    }
}, {
    ATTRS: {
        /**
         * Indicates the type of graph.
         */
        type: {
            value:"stackedArea"
        }
    }
});
Y.StackedColumnSeries = Y.Base.create("stackedColumnSeries", Y.ColumnSeries, [Y.StackingUtil], {
    /**
	 * @private
	 */
	drawSeries: function()
	{
	    if(this.get("xcoords").length < 1) 
		{
			return;
		}
        var style = this.get("styles").marker, 
            w = style.width,
            h = style.height,
            xcoords = this.get("xcoords"),
            ycoords = this.get("ycoords"),
            i = 0,
            len = xcoords.length,
            top = ycoords[0],
            type = this.get("type"),
            graph = this.get("graph"),
            seriesCollection = graph.seriesTypes[type],
            ratio,
            order = this.get("order"),
            graphOrder = this.get("graphOrder"),
            left,
            marker,
            lastCollection,
            negativeBaseValues,
            positiveBaseValues,
            useOrigin = order === 0,
            totalWidth = len * w,
            mnode;
        this._createMarkerCache();
        if(totalWidth > this.get("width"))
        {
            ratio = this.width/totalWidth;
            w *= ratio;
            w = Math.max(w, 1);
        }
        if(!useOrigin)
        {
            lastCollection = seriesCollection[order - 1];
            negativeBaseValues = lastCollection.get("negativeBaseValues");
            positiveBaseValues = lastCollection.get("positiveBaseValues");
        }
        else
        {
            negativeBaseValues = [];
            positiveBaseValues = [];
        }
        this.set("negativeBaseValues", negativeBaseValues);
        this.set("positiveBaseValues", positiveBaseValues);
        for(i = 0; i < len; ++i)
        {
            top = ycoords[i];
            if(useOrigin)
            {
                h = this._bottomOrigin - top;
                if(top < this._bottomOrigin)
                {
                    positiveBaseValues[i] = top;
                    negativeBaseValues[i] = this._bottomOrigin;
                }
                else if(top > this._bottomOrigin)
                {
                    positiveBaseValues[i] = this._bottomOrigin;
                    negativeBaseValues[i] = top;
                }
                else
                {
                    positiveBaseValues[i] = top;
                    negativeBaseValues[i] = top;
                }
            }
            else 
            {
                if(top > this._bottomOrigin)
                {
                    top += (negativeBaseValues[i] - this._bottomOrigin);
                    h = negativeBaseValues[i] - top;
                    negativeBaseValues[i] = top;
                }
                else if(top < this._bottomOrigin)
                {
                    top = positiveBaseValues[i] - (this._bottomOrigin - ycoords[i]);
                    h = positiveBaseValues[i] - top;
                    positiveBaseValues[i] = top;
                }
            }
            left = xcoords[i] - w/2;
            style.width = w;
            style.height = h;
            marker = this.getMarker(style, graphOrder, i);
            mnode = Y.one(marker.parentNode);
            mnode.setStyle("position", "absolute");
            mnode.setStyle("left", left);
            mnode.setStyle("top", top);
        }
        this._clearMarkerCache();
 	},

    /**
     * @private
     * Resizes and positions markers based on a mouse interaction.
     */
    updateMarkerState: function(type, i)
    {
        var styles,
            markerStyles,
            state = this._getState(type),
            xcoords = this.get("xcoords"),
            marker = this._markers[i],
            graphic = this._graphicCollection[i],
            offset = 0;        
        styles = this.get("styles").marker;
        markerStyles = state == "off" || !styles[state] ? styles : styles[state]; 
        markerStyles.height = marker.height;
        marker.update(markerStyles);
        offset = styles.width * 0.5;
        Y.one(graphic.node).setStyle("left", (xcoords[i] - offset));
    },
	
	/**
	 * @private
	 */
    _getPlotDefaults: function()
    {
        var defs = {
            fill:{
                type: "solid",
                alpha: 1,
                colors:null,
                alphas: null,
                ratios: null
            },
            border:{
                weight: 0,
                alpha: 1
            },
            width: 24,
            height: 24,
            shape: "rect",

            padding:{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
            }
        };
        defs.fill.color = this._getDefaultColor(this.get("graphOrder"), "fill");
        defs.border.color = this._getDefaultColor(this.get("graphOrder"), "border");
        return defs;
 	}
}, {
    ATTRS: {
        type: {
            value: "stackedColumn"
        },

        negativeBaseValues: {
            value: null
        },

        positiveBaseValues: {
            value: null
        }
    }
});

Y.StackedBarSeries = Y.Base.create("stackedBarSeries", Y.BarSeries, [Y.StackingUtil], {
    drawSeries: function()
	{
	    if(this.get("xcoords").length < 1) 
		{
			return;
		}

        var style = this.get("styles").marker,
            w = style.width,
            h = style.height,
            xcoords = this.get("xcoords"),
            ycoords = this.get("ycoords"),
            i = 0,
            len = xcoords.length,
            top = ycoords[0],
            type = this.get("type"),
            graph = this.get("graph"),
            seriesCollection = graph.seriesTypes[type],
            ratio,
            order = this.get("order"),
            graphOrder = this.get("graphOrder"),
            left,
            marker,
            lastCollection,
            negativeBaseValues,
            positiveBaseValues,
            useOrigin = order === 0,
            totalHeight = len * h,
            mnode;
        this._createMarkerCache();
        if(totalHeight > this.get("height"))
        {
            ratio = this.height/totalHeight;
            h *= ratio;
            h = Math.max(h, 1);
        }
        if(!useOrigin)
        {
            lastCollection = seriesCollection[order - 1];
            negativeBaseValues = lastCollection.get("negativeBaseValues");
            positiveBaseValues = lastCollection.get("positiveBaseValues");
        }
        else
        {
            negativeBaseValues = [];
            positiveBaseValues = [];
        }
        this.set("negativeBaseValues", negativeBaseValues);
        this.set("positiveBaseValues", positiveBaseValues);
        for(i = 0; i < len; ++i)
        {
            top = ycoords[i];
            left = xcoords[i];
            
            if(useOrigin)
            {
                w = left - this._leftOrigin;
                if(left > this._leftOrigin)
                {
                    positiveBaseValues[i] = left;
                    negativeBaseValues[i] = this._leftOrigin;
                }
                else if(left < this._leftOrigin)
                {   
                    positiveBaseValues[i] = this._leftOrigin;
                    negativeBaseValues[i] = left;
                }
                else
                {
                    positiveBaseValues[i] = left;
                    negativeBaseValues[i] = this._leftOrigin;
                }
                left -= w;
            }
            else
            {
                if(left < this._leftOrigin)
                {
                    left = negativeBaseValues[i] - (this._leftOrigin - xcoords[i]);
                    w = negativeBaseValues[i] - left;
                    negativeBaseValues[i] = left;
                }
                else if(left > this._leftOrigin)
                {
                    left += (positiveBaseValues[i] - this._leftOrigin);
                    w = left - positiveBaseValues[i];
                    positiveBaseValues[i] = left;
                    left -= w;
                }
            }
            top -= h/2;        
            style.width = w;
            style.height = h;
            marker = this.getMarker(style, graphOrder, i);
            mnode = Y.one(marker.parentNode);
            mnode.setStyle("position", "absolute");
            mnode.setStyle("left", left);
            mnode.setStyle("top", top);
        }
        this._clearMarkerCache();
 	},
    
    /**
     * @private
     * Resizes and positions markers based on a mouse interaction.
     */
    updateMarkerState: function(type, i)
    {
        var state = this._getState(type),
            ycoords = this.get("ycoords"),
            marker = this._markers[i],
            graphic = this._graphicCollection[i],
            styles = this.get("styles").marker,
            h = styles.height,
            markerStyles = state == "off" || !styles[state] ? styles : styles[state]; 
        markerStyles.width = marker.width;
        marker.update(markerStyles);
        Y.one(graphic).setStyle("top", (ycoords[i] - h/2));    
    },
	
    _getPlotDefaults: function()
    {
        var defs = {
            fill:{
                type: "solid",
                alpha: 1,
                colors:null,
                alphas: null,
                ratios: null
            },
            border:{
                weight: 0,
                alpha: 1
            },
            width: 24,
            height: 24,
            shape: "rect",

            padding:{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
            }
        };
        defs.fill.color = this._getDefaultColor(this.get("graphOrder"), "fill");
        defs.border.color = this._getDefaultColor(this.get("graphOrder"), "border");
        return defs;
 	}
}, {
    ATTRS: {
        type: {
            value: "stackedBar"
        },
        direction: {
            value: "vertical"
        },

        negativeBaseValues: {
            value: null
        },

        positiveBaseValues: {
            value: null
        }
    }
});

Y.Axis = Y.Base.create("axis", Y.Widget, [Y.Renderer], {
    /**
     * @private
     * @description Triggered by a change in the dataSet attribute. Removes any old dataSet listeners and sets up listeners for the new dataSet.
     */
    dataSetChangeHandler: function(e)
    {
       var dataSet = e.newVal,
            oldDataSet = e.prevVal;
        if(oldDataSet)
        {
            oldDataSet.detach("dataReady", this._dataChangeHandler);
            oldDataSet.detach("dataUpdate", this._dataChangeHandler);
        }
        dataSet.after("dataReady", Y.bind(this._dataChangeHandler, this));
        dataSet.after("dataUpdate", Y.bind(this._dataChangeHandler, this));
    },

    /**
     * @private
     * @description Handler for data changes.
     */
    _dataChangeHandler: function(e)
    {
        if(this.get("rendered"))
        {
            this._drawAxis();
        }
    },

    /**
     * @private
     */
    _updateHandler: function(e)
    {
        if(this.get("rendered"))
        {
            this._drawAxis();
        }
    },

    /**
     * @private
     */
    _positionChangeHandler: function(e)
    {
        this._layout =this.getLayout(this.get("position"));
        if(this.get("rendered"))
        {
            this._drawAxis();
        }
    },

    /**
     * @private
     */
    renderUI: function()
    {
        this._layout =this.getLayout(this.get("position"));
        this._setCanvas();
    },
    
    /**
     * @private
     */
    bindUI: function()
    {
        var dataSet = this.get("dataSet");
        if(dataSet)
        {
            dataSet.after("dataReady", Y.bind(this._dataChangeHandler, this));
            dataSet.after("dataUpdate", Y.bind(this._dataChangeHandler, this));
        }
        this.after("axisChange", this.dataSetChangeHandler);
        this.after("stylesChange", this._updateHandler);
        this.after("positionChange", this._positionChangeHandler);
        this.after("overlapGraphChange", this._updateHandler);
        this.after("widthChange", this._handleSizeChange);
        this.after("heightChange", this._handleSizeChange);
    },
   
    /**
     * @private
     */
    syncUI: function()
    {
        this._drawAxis();
    },

    /**
     * @private
     * Creates a <code>Graphic</code> instance.
     */
    _setCanvas: function()
    {
        var cb = this.get("contentBox"),
            bb = this.get("boundingBox"),
            p = this.get("position"),
            pn = this._parentNode,
            w = this.get("width"),
            h = this.get("height");
        bb.setStyle("position", "absolute");
        w = w ? w + "px" : pn.getStyle("width");
        h = h ? h + "px" : pn.getStyle("height");
        if(p === "top" || p === "bottom")
        {
            cb.setStyle("width", w);
        }
        else
        {
            cb.setStyle("height", h);
        }
        cb.setStyle("position", "relative");
        cb.setStyle("left", "0px");
        cb.setStyle("top", "0px");
        this.set("graphic", new Y.Graphic());
        this.get("graphic").render(cb);
    },
	
    /**
     * @private
     * @description Returns the default style values for the axis.
     */
    _getDefaultStyles: function()
    {
        var axisstyles = {
            majorTicks: {
                display:"inside",
                length:4,
                color:"#808080",
                weight:1,
                alpha:1
            },
            minorTicks: {
                display:"none",
                length:2,
                color:"#808080",
                weight:1
            },
            line: {
                weight:1,
                color:"#808080",
                alpha:1
            },
            majorUnit: {
                determinant:"count",
                count:11,
                distance:75
            },
            top: "0px",
            left: "0px",
            width: "100px",
            height: "100px",
            label: {
                color:"#808080",
                fontSize:"85%",
                rotation: 0,
                margin: {
                    top:4,
                    right:4,
                    bottom:4,
                    left:4
                }
            },
            hideOverlappingLabelTicks: false
        };
        
        return Y.merge(Y.Renderer.prototype._getDefaultStyles(), axisstyles); 
    },

    _handleSizeChange: function(e)
    {
        var type = e.type,
            pos = this.get("position"),
            vert = pos == "left" || pos == "right",
            cb = this.get("contentBox"),
            hor = pos == "bottom" || pos == "top";
        cb.setStyle("width", this.get("width"));
        cb.setStyle("height", this.get("height"));
        if((hor && type == "widthChange") || (vert && type == "heightChange"))
        {
            this._drawAxis();
        }
    },

    /**
     * @private
     * @description Strategy for drawing the axis dependent upon the axis position.
     */
    _layout: null,

    /**
     * @private 
     * @description Returns the correct _layout class instance to be used for drawing the
     * axis.
     */
    getLayout: function(pos)
    {
        var l;
        switch(pos)
        {
            case "top" :
                l = new Y.TopAxisLayout({axisRenderer:this});
            break;
            case "bottom" : 
                l = new Y.BottomAxisLayout({axisRenderer:this});
            break;
            case "left" :
                l = new Y.LeftAxisLayout({axisRenderer:this});
            break;
            case "right" :
                l = new Y.RightAxisLayout({axisRenderer:this});
            break;
        }
        return l;
    },
    
    /**
     * @private
     * @description Draws line based on start point, end point and line object.
     */
    drawLine: function(startPoint, endPoint, line)
    {
        var graphic = this.get("graphic");
        graphic.lineStyle(line.weight, line.color, line.alpha);
        graphic.moveTo(startPoint.x, startPoint.y);
        graphic.lineTo(endPoint.x, endPoint.y);
        graphic.end();
    },

    /**
     * @private
     * Basic logic for drawing an axis.
     */
    _drawAxis: function ()
    {
        var styles = this.get("styles"),
            majorTickStyles = styles.majorTicks,
            drawTicks = majorTickStyles.display != "none",
            tickPoint,
            majorUnit = styles.majorUnit,
            dataSet = this.get("dataSet"),
            len,
            majorUnitDistance,
            i = 0,
            layoutLength,
            position,
            lineStart,
            label,
            layout = this._layout,
            labelFunction = this.get("labelFunction") || dataSet.get("labelFunction"),
            labelFunctionScope = this.get("labelFunctionScope") || this,
            labelFormat = this.get("labelFormat") || dataSet.get("labelFormat"),
            graphic = this.get("graphic");
        graphic.clear();
		layout.setTickOffsets();
        layoutLength = this.getLength();
        lineStart = layout.getLineStart();
        len = dataSet.getTotalMajorUnits(majorUnit, layoutLength);
        majorUnitDistance = dataSet.getMajorUnitDistance(len, layoutLength, majorUnit);
        this.set("edgeOffset", dataSet.getEdgeOffset(len, layoutLength) * 0.5);
        tickPoint = this.getFirstPoint(lineStart);
        this.drawLine(lineStart, this.getLineEnd(tickPoint), styles.line);
        if(drawTicks) 
        {
           layout.drawTick(tickPoint, majorTickStyles);
        }
        if(len < 1) 
        {
            return;
        }
        this._createLabelCache();
        this._tickPoints = [];
        layout.set("maxLabelSize", 0); 
        for(; i < len; ++i)
	    {
            if(drawTicks) 
            {
                layout.drawTick(tickPoint, majorTickStyles);
            }
            position = this.getPosition(tickPoint);
            label = this.getLabel(tickPoint);
            label.innerHTML = labelFunction.apply(labelFunctionScope, [dataSet.getLabelByIndex(i, len), labelFormat]);
            tickPoint = this.getNextPoint(tickPoint, majorUnitDistance);
        }
        layout.setSizeAndPosition();
        this._clearLabelCache();
        if(this.get("overlapGraph"))
        {
           layout.offsetNodeForTick(this.get("contentBox"));
        }
        layout.setCalculatedSize();
        for(i = 0; i < len; ++i)
        {
            layout.positionLabel(this.get("labels")[i], this._tickPoints[i]);
        }
        this.fire("axisRendered");
    },
    
    /**
     * @private
     * @description Collection of labels used in creating an axis.
     */
    _labels: null,

    /**
     * @private 
     * @description Collection of labels to be reused in creating an axis.
     */
    _labelCache: null,

    /**
     * @private
     * @description Draws and positions a label based on its style properties.
     */
    getLabel: function(pt, pos)
    {
        var i,
            label,
            cache = this._labelCache,
            styles = this.get("styles").label;
        if(cache.length > 0)
        {
            label = cache.shift();
        }
        else
        {
            label = document.createElement("span");
            label.style.whiteSpace = "nowrap";
            Y.one(label).addClass("axisLabel");
        }
        label.style.display = "block";
        label.style.position = "absolute";
        this.get("contentBox").appendChild(label);
        this._labels.push(label);
        this._tickPoints.push({x:pt.x, y:pt.y});
        this._layout.updateMaxLabelSize(label);
        for(i in styles)
        {
            if(styles.hasOwnProperty(i) && i != "rotation" && i != "margin")
            {
                label.style[i] = styles[i];
            }
        }
        return label;
    },   
    
    /**
     * @private
     * Creates a cache of labels for reuse.
     */
    _createLabelCache: function()
    {
        if(this._labels)
        {
            this._labelCache = this._labels.concat();
        }
        else
        {
            this._labelCache = [];
        }
        this._labels = [];
    },
    
    /**
     * @private
     * Removes unused labels from the label cache
     */
    _clearLabelCache: function()
    {
        var len = this._labelCache.length,
            i = 0,
            label,
            labelCache;
        for(; i < len; ++i)
        {
            label = labelCache[i];
            label.parentNode.removeChild(label);
        }
        this._labelCache = [];
    },

    /**
     * @private
     * Indicates how to include tick length in the size calculation of an
     * axis. If set to true, the length of the tick is used to calculate
     * this size. If false, the offset of tick will be used.
     */
    _calculateSizeByTickLength: true,

    /**
     * Indicate the end point of the axis line
     */
    getLineEnd: function(pt)
    {
        var w = this.get("width"),
            h = this.get("height"),
            pos = this.get("position");
        if(pos === "top" || pos === "bottom")
        {
            return {x:w, y:pt.y};
        }
        else
        {
            return {x:pt.x, y:h};
        }
    },

    /**
     * Returns the distance between the first and last data points.
     */
    getLength: function()
    {
        var l,
            style = this.get("styles"),
            padding = style.padding,
            w = this.get("width"),
            h = this.get("height"),
            pos = this.get("position");
        if(pos === "top" || pos === "bottom")
        {
            l = w - (padding.left + padding.right);
        }
        else
        {
            l = h - (padding.top + padding.bottom);
        }
        return l;
    },

    /**
     * Calculates the coordinates for the first point on an axis.
     */
    getFirstPoint:function(pt)
    {
        var style = this.get("styles"),
            pos = this.get("position"),
            padding = style.padding,
            np = {x:pt.x, y:pt.y};
        if(pos === "top" || pos === "bottom")
        {
            np.x += padding.left + this.get("edgeOffset");
        }
        else
        {
            np.y += this.get("height") - (padding.top + this.get("edgeOffset"));
        }
        return np;
    },

    /**
     * Returns the next majorUnit point.
     */
    getNextPoint: function(point, majorUnitDistance)
    {
        var pos = this.get("position");
        if(pos === "top" || pos === "bottom")
        {
            point.x = point.x + majorUnitDistance;		
        }
        else
        {
            point.y = point.y - majorUnitDistance;
        }
        return point;
    },

    /**
     * Calculates the coordinates for the last point on an axis.
     */
    getLastPoint: function()
    {
        var style = this.get("styles"),
            padding = style.padding,
            w = this.get("width"),
            pos = this.get("position");
        if(pos === "top" || pos === "bottom")
        {
            return {x:w - padding.right, y:padding.top};
        }
        else
        {
            return {x:padding.left, y:padding.top};
        }
    },

    /**
     * Calculates the position of a point on the axis.
     */
    getPosition: function(point)
    {
        var p,
            h = this.get("height"),
            style = this.get("styles"),
            padding = style.padding,
            pos = this.get("position"),
            dataType = this.get("dataSet").get("dataType");
        if(pos === "left" || pos === "right") 
        {
            //Numeric data on a vertical axis is displayed from bottom to top.
            //Categorical and Timeline data is displayed from top to bottom.
            if(dataType === "numeric")
            {
                p = (h - (padding.top + padding.bottom)) - (point.y - padding.top);
            }
            else
            {
                p = point.y - padding.top;
            }
        }
        else
        {
            p = point.x - padding.left;
        }
        return p;
    }
}, {
    ATTRS: 
    {
        edgeOffset: 
        {
            value: 0
        },

        /**
         * The graphic in which the axis line and ticks will be rendered.
         */
        graphic: {},
        
        /**
         * Reference to the <code>Axis</code> instance used for assigning 
         * <code>Axis</code>.
         */
        dataSet: {},

        /**
         * Contains the contents of the axis. 
         */
        node: {},

        /**
         * Direction of the axis.
         */
        position: {
            value: "bottom",

            validator: function(val)
            {
                return ((val === "bottom" || val === "top" || val === "left" || val === "right"));
            }
        },

        /**
         * Distance determined by the tick styles used to calculate the distance between the axis
         * line in relation to the top of the axis.
         */
        topTickOffset: {
            value: 0
        },

        /**
         * Distance determined by the tick styles used to calculate the distance between the axis
         * line in relation to the bottom of the axis.
         */
        bottomTickOffset: {
            value: 0
        },

        /**
         * Distance determined by the tick styles used to calculate the distance between the axis
         * line in relation to the left of the axis.
         */
        leftTickOffset: {
            value: 0
        },

        /**
         * Distance determined by the tick styles used to calculate the distance between the axis
         * line in relation to the right side of the axis.
         */
        rightTickOffset: {
            value: 0
        },
        
        labels: {
            readOnly: true,
            getter: function()
            {
                return this._labels;
            }
        },

        /**
         * Collection of points used for placement of labels and ticks along the axis.
         */
        tickPoints: {
            readOnly: true,

            getter: function()
            {
                return this._tickPoints;
            }
        },

        /**
         * Indicates whether the axis overlaps the graph. If an axis is the inner most axis on a given
         * position and the tick position is inside or cross, the axis will need to overlap the graph.
         */
        overlapGraph: {
            value:true,

            validator: function(val)
            {
                return Y.Lang.isBoolean(val);
            }
        },

        /**
         * Function used to format labels.
         */
        labelFunction: {},

        /**
         * Object which should have by the labelFunction
         */
        labelFunctionScope: {},

        /**
         * Pattern to be used by a labelFunction
         */
        labelFormat: {}
    }
});
/**
 * Contains algorithms for rendering a left axis.
 */
function LeftAxisLayout(config)
{
    LeftAxisLayout.superclass.constructor.apply(this, arguments);
}

LeftAxisLayout.ATTRS = {
    axisRenderer: {
        value: null
    },

    maxLabelSize: {
        value: 0
    }
};

Y.extend(LeftAxisLayout, Y.Base, {
    /**
     * Sets the length of the tick on either side of the axis line.
     */
    setTickOffsets: function()
    {
        var ar = this.get("axisRenderer"),
            majorTicks = ar.get("styles").majorTicks,
            tickLength = majorTicks.length,
            halfTick = tickLength * 0.5,
            display = majorTicks.display;
        ar.set("topTickOffset",  0);
        ar.set("bottomTickOffset",  0);
        
        switch(display)
        {
            case "inside" :
                ar.set("rightTickOffset",  tickLength);
            break;
            case "outside" : 
                ar.set("leftTickOffset",  tickLength);
            break;
            case "cross":
                ar.set("rightTickOffset", halfTick); 
                ar.set("leftTickOffset",  halfTick);
            break;
            default:
                ar.set("rightTickOffset", 0);
                ar.set("leftTickOffset", 0);
            break;
        }
    },
    
    /**
     * Draws a tick
     */
    drawTick: function(pt, tickStyles)
    {
        var ar = this.get("axisRenderer"),
            style = ar.get("styles"),
            padding = style.padding,
            tickLength = tickStyles.length,
            start = {x:padding.left, y:pt.y},
            end = {x:tickLength + padding.left, y:pt.y};
        ar.drawLine(start, end, tickStyles);
    },

    /**
     * Calculates the coordinates for the first point on an axis.
     */
    getLineStart: function()
    {
        var ar = this.get("axisRenderer"),
            style = ar.get("styles"),
            padding = style.padding,
            majorTicks = style.majorTicks,
            tickLength = majorTicks.length,
            display = majorTicks.display,
            pt = {x:padding.left, y:0};
        if(display === "outside")
        {
            pt.x += tickLength;
        }
        else if(display === "cross")
        {
            pt.x += tickLength/2;
        }
        return pt; 
    },
    
    /**
     * Calculates the point for a label.
     */
    getLabelPoint: function(point)
    {
        var ar = this.get("axisRenderer");
        return {x:point.x - ar.get("leftTickOffset"), y:point.y};
    },
    
    updateMaxLabelSize: function(label)
    {
        var ar = this.get("axisRenderer"),
            style = ar.get("styles").label,
            rot =  Math.min(90, Math.max(-90, style.rotation)),
            absRot = Math.abs(rot),
            radCon = Math.PI/180,
            sinRadians = parseFloat(parseFloat(Math.sin(absRot * radCon)).toFixed(8)),
            cosRadians = parseFloat(parseFloat(Math.cos(absRot * radCon)).toFixed(8)),
            max;
        if(Y.UA.ie)
        {
            label.style.filter = "progid:DXImageTransform.Microsoft.BasicImage(rotation=" + rot + ")";
            this.set("maxLabelSize", Math.max(this.get("maxLabelSize"), label.offsetWidth));
        }
        else
        {
            if(rot === 0)
            {
                max = label.offsetWidth;
            }
            else if(absRot === 90)
            {
                max = label.offsetHeight;
            }
            else
            {
                max = (cosRadians * label.offsetWidth) + (sinRadians * label.offsetHeight);
            }
            this.set("maxLabelSize",  Math.max(this.get("maxLabelSize"), max));
        }
    },

    positionLabel: function(label, pt)
    {
        var ar = this.get("axisRenderer"),
            style = ar.get("styles").label,
            margin = 0,
            leftOffset = pt.x,
            topOffset = pt.y,
            rot =  Math.min(90, Math.max(-90, style.rotation)),
            absRot = Math.abs(rot),
            radCon = Math.PI/180,
            sinRadians = parseFloat(parseFloat(Math.sin(absRot * radCon)).toFixed(8)),
            cosRadians = parseFloat(parseFloat(Math.cos(absRot * radCon)).toFixed(8)),
            m11 = cosRadians,
            m12 = rot > 0 ? -sinRadians : sinRadians,
            m21 = -m12,
            m22 = m11;
        if(style.margin && style.margin.right)
        {
            margin = style.margin.right;
        }
        if(Y.UA.ie)
        {
            label.style.filter = "progid:DXImageTransform.Microsoft.BasicImage(rotation=0)";
            if(rot === 0)
            {
                leftOffset -= label.offsetWidth;
                topOffset -= label.offsetHeight * 0.5;
            }
            else if(absRot === 90)
            {
                leftOffset -= label.offsetHeight;
                topOffset -= label.offsetWidth * 0.5;
            }
            else if(rot === -90)
            {
                leftOffset -= label.offsetHeight;
                topOffset -= label.offsetWidth * 0.5;
            }
            else if(rot > 0)
            {
                leftOffset -= (cosRadians * label.offsetWidth) + (label.offsetHeight * rot/90);
                topOffset -= (sinRadians * label.offsetWidth) + (cosRadians * (label.offsetHeight * 0.5));
            }
            else
            {
                leftOffset -= (cosRadians * label.offsetWidth) + (absRot/90 * label.offsetHeight);
                topOffset -= cosRadians * (label.offsetHeight * 0.5);
            }
            label.style.left = (this.get("maxLabelSize") + leftOffset) + "px";
            label.style.top = topOffset + "px";
            label.style.filter = 'progid:DXImageTransform.Microsoft.Matrix(M11=' + m11 + ' M12=' + m12 + ' M21=' + m21 + ' M22=' + m22 + ' sizingMethod="auto expand")';
            return;
        }
        if(rot === 0)
        {
            leftOffset -= label.offsetWidth;
            topOffset -= label.offsetHeight * 0.5;
        }
        else if(rot === 90)
        {
            topOffset -= label.offsetWidth * 0.5;
        }
        else if(rot === -90)
        {
            leftOffset -= label.offsetHeight;
            topOffset += label.offsetWidth * 0.5;
        }
        else
        {
            if(rot < 0)
            {
                leftOffset -= (cosRadians * label.offsetWidth) + (sinRadians * label.offsetHeight);
                topOffset += (sinRadians * label.offsetWidth) - (cosRadians * (label.offsetHeight * 0.6)); 
            }
            else
            {
                leftOffset -= (cosRadians * label.offsetWidth);
                topOffset -= (sinRadians * label.offsetWidth) + (cosRadians * (label.offsetHeight * 0.6));
            }
        }
        leftOffset -= margin;
        label.style.left = (this.get("maxLabelSize") + leftOffset) + "px";
        label.style.top = topOffset + "px";
        label.style.MozTransformOrigin =  "0 0";
        label.style.MozTransform = "rotate(" + rot + "deg)";
        label.style.webkitTransformOrigin = "0 0";
        label.style.webkitTransform = "rotate(" + rot + "deg)";
    },

    /**
     * Calculates the size and positions the content elements.
     */
    setSizeAndPosition: function()
    {
        var labelSize = this.get("maxLabelSize"),
            ar = this.get("axisRenderer"),
            style = ar.get("styles"),
            sz = style.line.weight,
            graphic = ar.get("graphic"),
            majorTicks = style.majorTicks,
            display = majorTicks.display,
            tickLen = majorTicks.length,
            margin = style.label.margin;
        if(display === "inside")
        {
            sz -= tickLen;
        }
        else if(display === "cross")
        {
            sz -= tickLen * 0.5;
        }
        if(margin && margin.right)
        {
            sz += margin.right;
        }
        sz += labelSize;
        sz = Math.round(sz);
        ar.set("width", sz);
        Y.one(graphic.node).setStyle("left", sz);
    },
    
    offsetNodeForTick: function(cb)
    {
        var ar = this.get("axisRenderer"),
            majorTicks = ar.get("styles").majorTicks,
            tickLength = majorTicks.length,
            display = majorTicks.display;
        if(display === "inside")
        {
            cb.setStyle("left", tickLength + "px");
        }
        else if (display === "cross")
        {
            cb.setStyle("left", (tickLength * 0.5) + "px");
        }
        else 
        {
            cb.setStyle("left", "0px");    
        }
    },

    setCalculatedSize: function()
    {
        var ar = this.get("axisRenderer"),
            style = ar.get("styles").label,
            ttl = ar.get("leftTickOffset") + this.get("maxLabelSize") + style.margin.right;
            ar.set("width", Math.round(ttl));
    }
});

Y.LeftAxisLayout = LeftAxisLayout;
/**
 * Contains algorithms for rendering a right axis.
 */
function RightAxisLayout(config)
{
    RightAxisLayout.superclass.constructor.apply(this, arguments);
}

RightAxisLayout.ATTRS = {
    axisRenderer: {
        value: null
    }
};

Y.extend(RightAxisLayout, Y.Base, {
    /**
     * Sets the length of the tick on either side of the axis line.
     */
    setTickOffsets: function()
    {
        var ar = this.get("axisRenderer"),
            majorTicks = ar.get("styles").majorTicks,
            tickLength = majorTicks.length,
            halfTick = tickLength * 0.5,
            display = majorTicks.display;
        ar.set("topTickOffset",  0);
        ar.set("bottomTickOffset",  0);
        
        switch(display)
        {
            case "inside" :
                ar.set("leftTickOffset",  tickLength);
            break;
            case "outside" : 
                ar.set("rightTickOffset",  tickLength);
            break;
            case "cross":
                ar.set("rightTickOffset",  halfTick);
                ar.set("leftTickOffset",  halfTick);
            break;
        }
    },

    drawTick: function(pt, tickStyles)
    {
        var ar = this.get("axisRenderer"),
            style = ar.get("styles"),
            padding = style.padding,
            tickLength = tickStyles.length,
            start = {x:padding.left, y:pt.y},
            end = {x:padding.left + tickLength, y:pt.y};
        ar.drawLine(start, end, tickStyles);
    },
    
    /**
     * Calculates the coordinates for the first point on an axis.
     */
    getLineStart: function()
    {
        var ar = this.get("axisRenderer"),
            style = ar.get("styles"),
            padding = style.padding,
            majorTicks = style.majorTicks,
            tickLength = majorTicks.length,
            display = majorTicks.display,
            pt = {x:padding.left, y:padding.top};
        if(display === "inside")
        {
            pt.x += tickLength;
        }
        else if(display === "cross")
        {
            pt.x += tickLength/2;
        }
        return pt;
    },
    
    /**
     * Calculates the point for a label.
     */
    getLabelPoint: function(point)
    {
        var ar = this.get("axisRenderer");
        return {x:point.x + ar.get("rightTickOffset"), y:point.y};
    },
    
    updateMaxLabelSize: function(label)
    {
        var ar = this.get("axisRenderer"),
            style = ar.get("styles").label,
            rot =  Math.min(90, Math.max(-90, style.rotation)),
            absRot = Math.abs(rot),
            radCon = Math.PI/180,
            sinRadians = parseFloat(parseFloat(Math.sin(absRot * radCon)).toFixed(8)),
            cosRadians = parseFloat(parseFloat(Math.cos(absRot * radCon)).toFixed(8)),
            max;
        if(Y.UA.ie)
        {
            label.style.filter = "progid:DXImageTransform.Microsoft.BasicImage(rotation=" + rot + ")";
            this.set("maxLabelSize", Math.max(this.get("maxLabelSize"), label.offsetWidth));
        }
        else
        {
            if(rot === 0)
            {
                max = label.offsetWidth;
            }
            else if(absRot === 90)
            {
                max = label.offsetHeight;
            }
            else
            {
                max = (cosRadians * label.offsetWidth) + (sinRadians * label.offsetHeight);
            }
            this.set("maxLabelSize",  Math.max(this.get("maxLabelSize"), max));
        }
    },

    positionLabel: function(label, pt)
    {
        var ar = this.get("axisRenderer"),
            style = ar.get("styles").label,
            margin = 0,
            leftOffset = pt.x,
            topOffset = pt.y,
            rot =  Math.min(Math.max(style.rotation, -90), 90),
            absRot = Math.abs(rot),
            radCon = Math.PI/180,
            sinRadians = parseFloat(parseFloat(Math.sin(absRot * radCon)).toFixed(8)),
            cosRadians = parseFloat(parseFloat(Math.cos(absRot * radCon)).toFixed(8)),
            m11 = cosRadians,
            m12 = rot > 0 ? -sinRadians : sinRadians,
            m21 = -m12,
            m22 = m11;
            if(style.margin && style.margin.right)
            {
                margin = style.margin.right;
            }
        if(Y.UA.ie)
        {
            label.style.filter = "progid:DXImageTransform.Microsoft.BasicImage(rotation=0)";
            if(rot === 0)
            {
                topOffset -= label.offsetHeight * 0.5;
            }
            else if(absRot === 90)
            {
                topOffset -= label.offsetWidth * 0.5;
            }
            else if(rot > 0)
            {
                topOffset -= (cosRadians * (label.offsetHeight * 0.5));
            }
            else
            {
                topOffset -= (sinRadians * label.offsetWidth) +  (cosRadians * (label.offsetHeight * 0.5));
            }
            leftOffset += margin;
            label.style.left = leftOffset + "px";
            label.style.top = topOffset + "px";
            label.style.filter = 'progid:DXImageTransform.Microsoft.Matrix(M11=' + m11 + ' M12=' + m12 + ' M21=' + m21 + ' M22=' + m22 + ' sizingMethod="auto expand")';
            return;
        }
        if(rot === 0)
        {
            topOffset -= label.offsetHeight * 0.5;
        }
        else if(rot === 90)
        {
            leftOffset += label.offsetHeight;
            topOffset -= label.offsetWidth * 0.5;
        }
        else if(rot === -90)
        {
            topOffset += label.offsetWidth * 0.5;
        }
        else if(rot < 0)
        {
            topOffset -= (cosRadians * (label.offsetHeight * 0.6)); 
        }
        else
        {
            topOffset -= cosRadians * (label.offsetHeight * 0.6);
            leftOffset += sinRadians * label.offsetHeight;
        }
        leftOffset += margin;
        label.style.left = leftOffset + "px";
        label.style.top = topOffset + "px";
        label.style.MozTransformOrigin =  "0 0";
        label.style.MozTransform = "rotate(" + rot + "deg)";
        label.style.webkitTransformOrigin = "0 0";
        label.style.webkitTransform = "rotate(" + rot + "deg)";
    },

    /**
     * Calculates the size and positions the content elements.
     */
    setSizeAndPosition: function()
    {
        var ar = this.get("axisRenderer"),
            labelSize = this.get("maxLabelSize"),
            style = ar.get("styles"),
            sz = style.line.weight,
            majorTicks = style.majorTicks,
            display = majorTicks.display,
            tickLen = majorTicks.length;
        if(display === "outside")
        {
            sz += tickLen;
        }
        else if(display === "cross")
        {
            sz += tickLen * 0.5;
        }
        sz += labelSize;
        ar.set("width", sz);
    },
    
    offsetNodeForTick: function(cb)
    {
        var ar = this.get("axisRenderer"),
            majorTicks = ar.get("styles").majorTicks,
            tickLength = majorTicks.length,
            display = majorTicks.display;
        if(display === "inside")
        {
            cb.setStyle("left", 0 - tickLength + "px");
        }
        else if (display === "cross")
        {
            cb.setStyle("left", 0 - (tickLength * 0.5) + "px");
        }
    },

    setCalculatedSize: function()
    {
        var ar = this.get("axisRenderer"),
            style = ar.get("styles").label,
            ttl = ar.get("rightTickOffset") + this.get("maxLabelSize") + style.margin.left;
            ar.set("width", ttl);
    }
});

Y.RightAxisLayout = RightAxisLayout;
/**
 * Contains algorithms for rendering a bottom axis.
 */
function BottomAxisLayout(config)
{
    BottomAxisLayout.superclass.constructor.apply(this, arguments);
}

BottomAxisLayout.ATTRS = {
    axisRenderer: {
        value:null
    },

    maxLabelSize: {
        value: 0
    }
};

Y.extend(BottomAxisLayout, Y.Base, {
    /**
     * Sets the length of the tick on either side of the axis line.
     */
    setTickOffsets: function()
    {
        var ar = this.get("axisRenderer"),
            majorTicks = ar.get("styles").majorTicks,
            tickLength = majorTicks.length,
            halfTick = tickLength * 0.5,
            display = majorTicks.display;
        ar.set("leftTickOffset",  0);
        ar.set("rightTickOffset",  0);

        switch(display)
        {
            case "inside" :
                ar.set("topTickOffset",  tickLength);
            break;
            case "outside" : 
                ar.set("bottomTickOffset",  tickLength);
            break;
            case "cross":
                ar.set("topTickOffset",  halfTick);
                ar.set("bottomTickOffset",  halfTick);
            break;
        }
    },

    /**
     * Calculates the coordinates for the first point on an axis.
     */
    getLineStart: function()
    {
        var ar = this.get("axisRenderer"),
            style = ar.get("styles"),
            padding = style.padding,
            majorTicks = style.majorTicks,
            tickLength = majorTicks.length,
            display = majorTicks.display,
            pt = {x:0, y:padding.top};
        if(display === "inside")
        {
            pt.y += tickLength;
        }
        else if(display === "cross")
        {
            pt.y += tickLength/2;
        }
        return pt; 
    },
    
    /**
     * Draws a tick
     */
    drawTick: function(pt, tickStyles)
    {
        var ar = this.get("axisRenderer"),
            style = ar.get("styles"),
            padding = style.padding,
            tickLength = tickStyles.length,
            start = {x:pt.x, y:padding.top},
            end = {x:pt.x, y:tickLength + padding.top};
        ar.drawLine(start, end, tickStyles);
    },

    /**
     * Calculates the point for a label.
     */
    getLabelPoint: function(point)
    {
        var ar = this.get("axisRenderer");
        return {x:point.x, y:point.y + ar.get("bottomTickOffset")};
    },
    
    updateMaxLabelSize: function(label)
    {
        var ar = this.get("axisRenderer"),
            style = ar.get("styles").label,
            rot =  Math.min(90, Math.max(-90, style.rotation)),
            absRot = Math.abs(rot),
            radCon = Math.PI/180,
            sinRadians = parseFloat(parseFloat(Math.sin(absRot * radCon)).toFixed(8)),
            cosRadians = parseFloat(parseFloat(Math.cos(absRot * radCon)).toFixed(8)),
            max;
        if(Y.UA.ie)
        {
            label.style.filter = "progid:DXImageTransform.Microsoft.BasicImage(rotation=" + rot + ")";
            this.set("maxLabelSize", Math.max(this.get("maxLabelSize"), label.offsetHeight));
        }
        else
        {
            if(rot === 0)
            {
                max = label.offsetHeight;
            }
            else if(absRot === 90)
            {
                max = label.offsetWidth;
            }
            else
            {
                max = (sinRadians * label.offsetWidth) + (cosRadians * label.offsetHeight); 
            }
            this.set("maxLabelSize",  Math.max(this.get("maxLabelSize"), max));
        }
    },
    
    /**
     * Rotate and position labels.
     */
    positionLabel: function(label, pt)
    {
        var ar = this.get("axisRenderer"),
            style = ar.get("styles").label,
            margin = 0,
            leftOffset = pt.x,
            topOffset = pt.y,
            rot =  Math.min(90, Math.max(-90, style.rotation)),
            absRot = Math.abs(rot),
            radCon = Math.PI/180,
            sinRadians = parseFloat(parseFloat(Math.sin(absRot * radCon)).toFixed(8)),
            cosRadians = parseFloat(parseFloat(Math.cos(absRot * radCon)).toFixed(8)),
            m11 = cosRadians,
            m12 = rot > 0 ? -sinRadians : sinRadians,
            m21 = -m12,
            m22 = m11;
        if(style.margin && style.margin.top)
        {
            margin = style.margin.top;
        }
        if(Y.UA.ie)
        {
            m11 = cosRadians;
            m12 = rot > 0 ? -sinRadians : sinRadians;
            m21 = -m12;
            m22 = m11;
            label.style.filter = "progid:DXImageTransform.Microsoft.BasicImage(rotation=0)";
            if(absRot === 90)
            {
                leftOffset -= label.offsetHeight * 0.5;
            }
            else if(rot < 0)
            {
                leftOffset -= cosRadians * label.offsetWidth;
                leftOffset -= sinRadians * (label.offsetHeight * 0.5);
            }
            else if(rot > 0)
            {
                leftOffset -= sinRadians * (label.offsetHeight * 0.5);
            }
            else
            {
                leftOffset -= label.offsetWidth * 0.5;
            }
            topOffset += margin;
            label.style.left = leftOffset + "px";
            label.style.top = topOffset + "px";
            label.style.filter = 'progid:DXImageTransform.Microsoft.Matrix(M11=' + m11 + ' M12=' + m12 + ' M21=' + m21 + ' M22=' + m22 + ' sizingMethod="auto expand")';
            return;
        }
        if(rot === 0)
        {
            leftOffset -= label.offsetWidth * 0.5;
        }
        else if(absRot === 90)
        {
            if(rot === 90)
            {
                leftOffset += label.offsetHeight * 0.5;
            }
            else
            {
                topOffset += label.offsetWidth;
                leftOffset -= label.offsetHeight * 0.5;
            }
        }
        else 
        {
            if(rot < 0)
            {
                leftOffset -= (cosRadians * label.offsetWidth) + (sinRadians * (label.offsetHeight * 0.6));
                topOffset += sinRadians * label.offsetWidth;
            }
            else
            {
                leftOffset += sinRadians * (label.offsetHeight * 0.6);
            }
        }
        topOffset += margin;
        label.style.left = leftOffset + "px";
        label.style.top = topOffset + "px";
        label.style.MozTransformOrigin =  "0 0";
        label.style.MozTransform = "rotate(" + rot + "deg)";
        label.style.webkitTransformOrigin = "0 0";
        label.style.webkitTransform = "rotate(" + rot + "deg)";
    },
    
    /**
     * Calculates the size and positions the content elements.
     */
    setSizeAndPosition: function()
    {
        var labelSize = this.get("maxLabelSize"),
            ar = this.get("axisRenderer"),
            style = ar.get("styles"),
            sz = style.line.weight,
            majorTicks = style.majorTicks,
            display = majorTicks.display,
            tickLen = majorTicks.length,
            margin = style.label.margin;
        if(display === "outside")
        {
            sz += tickLen;
        }
        else if(display === "cross")
        {
            sz += tickLen * 0.5;
        }
        if(margin && margin.top)
        {   
            sz += margin.top;
        }
        sz += labelSize;
        sz = Math.round(sz);
        ar.set("height", sz);
    },

    /**
     * Adjusts position for inner ticks.
     */
    offsetNodeForTick: function(cb)
    {
        var ar = this.get("axisRenderer"),
            styles = ar.get("styles"),
            majorTicks = styles.majorTicks,
            tickLength = majorTicks.length,
            display = majorTicks.display;
        if(display === "inside")
        {
            cb.setStyle("marginTop", (0 - tickLength) + "px");
        }
        else if (display === "cross")
        {
            cb.setStyle("marginTop", (0 - (tickLength * 0.5)) + "px");
        }
    },

    setCalculatedSize: function()
    {
        var ar = this.get("axisRenderer"),
            style = ar.get("styles").label,
            ttl = ar.get("bottomTickOffset") + this.get("maxLabelSize") + style.margin.top;
            ar.set("height", Math.round(ttl));
    }
});

Y.BottomAxisLayout = BottomAxisLayout;
/**
 * Contains algorithms for rendering a top axis.
 */
function TopAxisLayout(config)
{
    TopAxisLayout.superclass.constructor.apply(this, arguments);
}

TopAxisLayout.ATTRS = {
    axisRenderer: {
        value: null
    }
};

Y.extend(TopAxisLayout, Y.Base, {
    /**
     * Sets the length of the tick on either side of the axis line.
     */
    setTickOffsets: function()
    {
        var ar = this.get("axisRenderer"),
            majorTicks = ar.get("styles").majorTicks,
            tickLength = majorTicks.length,
            halfTick = tickLength * 0.5,
            display = majorTicks.display;
        ar.set("leftTickOffset",  0);
        ar.set("rightTickOffset",  0);
        
        switch(display)
        {
            case "inside" :
                ar.set("bottomTickOffset",  tickLength);
            break;
            case "outside" : 
                ar.set("topTickOffset",  tickLength);
            break;
            case "cross":
                ar.set("topTickOffset",  halfTick);
                ar.set("bottomTickOffset",  halfTick);
            break;
        }
    },

    /**
     * Calculates the coordinates for the first point on an axis.
     */
    getLineStart: function()
    {
        var ar = this.get("axisRenderer"),
            style = ar.get("styles"),
            padding = style.padding,
            majorTicks = style.majorTicks,
            tickLength = majorTicks.length,
            display = majorTicks.display,
            pt = {x:0, y:padding.top};
        if(display === "outside")
        {
            pt.y += tickLength;
        }
        else if(display === "cross")
        {
            pt.y += tickLength/2;
        }
        return pt; 
    },
    
    /**
     * Draws a tick
     */
    drawTick: function(pt, tickStyles)
    {
        var ar = this.get("axisRenderer"),
            style = ar.get("styles"),
            padding = style.padding,
            tickLength = tickStyles.length,
            start = {x:pt.x, y:padding.top},
            end = {x:pt.x, y:tickLength + padding.top};
        ar.drawLine(start, end, tickStyles);
    },
    
    /**
     * Calculates the point for a label.
     */
    getLabelPoint: function(pt)
    {
        var ar = this.get("axisRenderer");
        return {x:pt.x, y:pt.y - ar.get("topTickOffset")};
    },
    
    updateMaxLabelSize: function(label)
    {
        var ar = this.get("axisRenderer"),
            style = ar.get("styles").label,
            rot =  Math.min(90, Math.max(-90, style.rotation)),
            absRot = Math.abs(rot),
            radCon = Math.PI/180,
            sinRadians = parseFloat(parseFloat(Math.sin(absRot * radCon)).toFixed(8)),
            cosRadians = parseFloat(parseFloat(Math.cos(absRot * radCon)).toFixed(8)),
            max;
        if(Y.UA.ie)
        {
            label.style.filter = "progid:DXImageTransform.Microsoft.BasicImage(rotation=" + rot + ")";
            this.set("maxLabelSize", Math.max(this.get("maxLabelSize"), label.offsetHeight));
        }
        else
        {
            if(rot === 0)
            {
                max = label.offsetHeight;
            }
            else if(absRot === 90)
            {
                max = label.offsetWidth;
            }
            else
            {
                max = (sinRadians * label.offsetWidth) + (cosRadians * label.offsetHeight); 
            }
            this.set("maxLabelSize",  Math.max(this.get("maxLabelSize"), max));
        }
    },

    positionLabel: function(label, pt)
    {
        var ar = this.get("axisRenderer"),
            style = ar.get("styles").label,
            margin = 0,
            leftOffset = pt.x,
            topOffset = pt.y,
            rot =  Math.max(-90, Math.min(90, style.rotation)),
            absRot = Math.abs(rot),
            radCon = Math.PI/180,
            sinRadians = parseFloat(parseFloat(Math.sin(absRot * radCon)).toFixed(8)),
            cosRadians = parseFloat(parseFloat(Math.cos(absRot * radCon)).toFixed(8)),
            m11,
            m12,
            m21,
            m22;
        rot = Math.min(90, rot);
        rot = Math.max(-90, rot);
        if(style.margin && style.margin.bottom)
        {
            margin = style.margin.bottom;
        }
        if(Y.UA.ie)
        {
            label.style.filter = "progid:DXImageTransform.Microsoft.BasicImage(rotation=0)";
            m11 = cosRadians;
            m12 = rot > 0 ? -sinRadians : sinRadians;
            m21 = -m12;
            m22 = m11;
            if(rot === 0)
            {
                leftOffset -= label.offsetWidth * 0.5;
                topOffset -= label.offsetHeight;
            }
            else if(absRot === 90)
            {
                leftOffset -= label.offsetHeight * 0.5;
                topOffset -= label.offsetWidth;
            }
            else if(rot > 0)
            {
                leftOffset -= (cosRadians * label.offsetWidth) + Math.min((sinRadians * label.offsetHeight), (rot/180 * label.offsetHeight));
                topOffset -= (sinRadians * label.offsetWidth) + (cosRadians * (label.offsetHeight));
            }
            else
            {
                leftOffset -= sinRadians * (label.offsetHeight * 0.5);
                topOffset -= (sinRadians * label.offsetWidth) + (cosRadians * (label.offsetHeight));
            }
            topOffset -= margin;
            label.style.left = leftOffset;
            label.style.top = topOffset;
            label.style.filter = 'progid:DXImageTransform.Microsoft.Matrix(M11=' + m11 + ' M12=' + m12 + ' M21=' + m21 + ' M22=' + m22 + ' sizingMethod="auto expand")';
            return;
        }
        if(rot === 0)
        {
            leftOffset -= label.offsetWidth * 0.5;
            topOffset -= label.offsetHeight;
        }
        else if(rot === 90)
        {
            leftOffset += label.offsetHeight * 0.5;
            topOffset -= label.offsetWidth;
        }
        else if(rot === -90)
        {
            leftOffset -= label.offsetHeight * 0.5;
            topOffset -= 0;
        }
        else if(rot < 0)
        {
            
            leftOffset -= (sinRadians * (label.offsetHeight * 0.6));
            topOffset -= (cosRadians * label.offsetHeight);
        }
        else
        {
            leftOffset -= (cosRadians * label.offsetWidth) - (sinRadians * (label.offsetHeight * 0.6));
            topOffset -= (sinRadians * label.offsetWidth) + (cosRadians * label.offsetHeight);
        }
        topOffset -= margin;
        label.style.left = leftOffset + "px";
        label.style.top =  topOffset + "px";
        label.style.MozTransformOrigin =  "0 0";
        label.style.MozTransform = "rotate(" + rot + "deg)";
        label.style.webkitTransformOrigin = "0 0";
        label.style.webkitTransform = "rotate(" + rot + "deg)";
    },

    /**
     * Calculates the size and positions the content elements.
     */
    setSizeAndPosition: function(labelSize)
    {
        var ar = this.get("axisRenderer"),
            style = ar.get("styles"),
            sz = style.line.weight,
            majorTicks = style.majorTicks,
            display = majorTicks.display,
            tickLen = majorTicks.length;
        if(display === "outside")
        {
            sz += tickLen;
        }
        else if(display === "cross")
        {
            sz += tickLen * 0.5;
        }
        sz += labelSize;
        ar.get("contentBox").setStyle("top", labelSize + "px");
        ar.set("height", sz);
    },
    
    offsetNodeForTick: function(cb)
    {
        var ar = this.get("axisRenderer"),
            majorTicks = ar.get("styles").majorTicks,
            tickLength = majorTicks.length,
            display = majorTicks.display;
        if(display === "inside")
        {
            cb.setStyle("marginBottom", (0 - tickLength) + "px");
        }
        else if (display === "cross")
        {
            cb.setStyle("marginBottom", (0 - (tickLength * 0.5)) + "px");
        }
    },

    setCalculatedSize: function()
    {
        var ar = this.get("axisRenderer"),
            style = ar.get("styles").label,
            ttl = ar.get("topTickOffset") + this.get("maxLabelSize") + style.margin.bottom;
            ar.set("height", ttl);
    }
});

Y.TopAxisLayout = TopAxisLayout;

Y.Gridlines = Y.Base.create("gridlines", Y.Base, [Y.Renderer], {
    /**
     * @private
     */
    render: function()
    {
        this._setCanvas();
    },

    remove: function()
    {
        var graphic = this.get("graphic"),
            gNode;
        if(graphic)
        {
            gNode = graphic.node;
            if(gNode)
            {
                Y.one(gNode).remove();
            }
        }
    },

    /**
     * Draws the gridlines
     */
    draw: function()
    {
        if(this.get("axis") && this.get("graph"))
        {
            this._drawGridlines();
        }
    },

    /**
     * @private
     */
    _drawGridlines: function()
    {
        var graphic = this.get("graphic"),
            axis = this.get("axis"),
            points = axis.get("tickPoints"),
            i = 0,
            l = points.length,
            direction = this.get("direction"),
            graph = this.get("graph"),
            w = graph.get("width"),
            h = graph.get("height"),
            line = this.get("styles").line,
            color = line.color,
            weight = line.weight,
            alpha = line.alpha,
            lineFunction = direction == "vertical" ? this._verticalLine : this._horizontalLine;
        if(!graphic)
        {
            this._setCanvas();
            graphic = this.get("graphic");
        }
        graphic.clear();
        graphic.setSize(w, h);
        graphic.lineStyle(weight, color, alpha);
        for(; i < l; ++i)
        {
            lineFunction(graphic, points[i], w, h);
        }
        graphic.end();
    },

    _horizontalLine: function(graphic, pt, w, h)
    {
        graphic.moveTo(0, pt.y);
        graphic.lineTo(w, pt.y);
    },

    _verticalLine: function(graphic, pt, w, h)
    {
        graphic.moveTo(pt.x, 0);
        graphic.lineTo(pt.x, h);
    },

    /**
     * @private
     * Creates a <code>Graphic</code> instance.
     */
    _setCanvas: function()
    {
        this.set("graphic", new Y.Graphic());
        this.get("graphic").render(this.get("graph").get("contentBox"));
    },
    
    /**
     * @private
     */
    _getDefaultStyles: function()
    {
        var defs = {
            line: {
                color:"#fff",
                weight: 1,
                alpha: 1
            }
        };
        return defs;
    }

},
{
    ATTRS: {
        direction: {},
        axis: {},
        graph: {}
    }
});
Y.Graph = Y.Base.create("graph", Y.Widget, [Y.Renderer], {
    bindUI: function()
    {
        var bb = this.get("boundingBox");
        bb.setStyle("position", "absolute");
        this.after("widthChange", this._sizeChangeHandler);
        this.after("heightChange", this._sizeChangeHandler);
        this.after("stylesChange", this._updateStyles);
    },

    /**
     * @private
     */
    syncUI: function()
    {
        if(this.get("showBackground"))
        {
            var graphic = new Y.Graphic(),
                cb = this.get("contentBox"),
                bg = this.get("styles").background,
                w = this.get("width"),
                h = this.get("height");
            if(w)
            {
                bg.width = w;
            }   
            if(h)
            {
                bg.height = h;
            }
            this._background = graphic.getShape(bg);
            graphic.render(cb);
            Y.one(graphic.node).setStyle("zIndex", -1);
        }
    },
   
    /**
     * @private
     */
    renderUI: function()
    {
        var sc = this.get("seriesCollection"),
            series,
            i = 0,
            len = sc.length;
        for(; i < len; ++i)
        {
            series = sc[i];
            if(series instanceof Y.CartesianSeries)
            {
                series.render();
            }
        }
    },

    /**
     * Hash of arrays containing series mapped to a series type.
     */
    seriesTypes: null,

    /**
     * Returns a series instance based on an index.
     */
    getSeriesByIndex: function(val)
    {
        var col = this.get("seriesCollection"),
            series;
        if(col && col.length > val)
        {
            series = col[val];
        }
        return series;
    },

    /**
     * Returns a series instance based on a key value.
     */
    getSeriesByKey: function(val)
    {
        var obj = this._seriesDictionary,
            series;
        if(obj && obj.hasOwnProperty(val))
        {
            series = obj[val];
        }
        return series;
    },

    /**
     * Adds dispatcher to collection
     */
    addDispatcher: function(val)
    {
        if(!this._dispatchers)
        {
            this._dispatchers = [];
        }
        this._dispatchers.push(val);
    },

    /**
     * @private 
     * @description Collection of series to be displayed in the graph.
     */
    _seriesCollection: null,
    
    /**
     * @private
     */
    _seriesDictionary: null,

    /**
     * @private
     * @description Parses series instances to be displayed in the graph.
     * @param {Array} Collection of series instances or object literals containing necessary properties for creating a series instance.
     */
    _parseSeriesCollection: function(val)
    {
        if(!val)
        {
            return;
        }	
        var len = val.length,
            i = 0,
            series,
            seriesKey;
        if(!this.get("seriesCollection"))
        {
            this._seriesCollection = [];
        }
        if(!this._seriesDictionary)
        {
            this._seriesDictionary = {};
        }
        if(!this.seriesTypes)
        {
            this.seriesTypes = [];
        }
        for(; i < len; ++i)
        {	
            series = val[i];
            if(!(series instanceof Y.CartesianSeries) && !(series instanceof Y.PieSeries))
            {
                this._createSeries(series);
                continue;
            }
            this._addSeries(series);
        }
        len = this.get("seriesCollection").length;
        for(i = 0; i < len; ++i)
        {
            series = this.get("seriesCollection")[i];
            seriesKey = series.get("direction") == "horizontal" ? "yKey" : "xKey";
            this._seriesDictionary[series.get(seriesKey)] = series;
        }
    },

    /**
     * @private
     * @description Adds a series to the graph.
     * @param {Series}
     */
    _addSeries: function(series)
    {
        var type = series.get("type"),
            seriesCollection = this.get("seriesCollection"),
            graphSeriesLength = seriesCollection.length,
            seriesTypes = this.seriesTypes,
            typeSeriesCollection;	
        if(!series.get("graph")) 
        {
            series.set("graph", this);
        }
        seriesCollection.push(series);
        if(!seriesTypes.hasOwnProperty(type))
        {
            this.seriesTypes[type] = [];
        }
        typeSeriesCollection = this.seriesTypes[type];
        series.set("graphOrder", graphSeriesLength);
        series.set("order", typeSeriesCollection.length);
        typeSeriesCollection.push(series);
        this.addDispatcher(series);
        series.after("drawingComplete", Y.bind(this._drawingCompleteHandler, this));
        this.fire("seriesAdded", series);
    },

    _createSeries: function(seriesData)
    {
        var type = seriesData.type,
            seriesCollection = this.get("seriesCollection"),
            seriesTypes = this.seriesTypes,
            typeSeriesCollection,
            seriesType,
            series;
            seriesData.graph = this;
        if(!seriesTypes.hasOwnProperty(type))
        {
            seriesTypes[type] = [];
        }
        typeSeriesCollection = seriesTypes[type];
        seriesData.graph = this;
        seriesData.order = typeSeriesCollection.length;
        seriesData.graphOrder = seriesCollection.length;
        seriesType = this._getSeries(seriesData.type);
        series = new seriesType(seriesData);
        this.addDispatcher(series);
        series.after("drawingComplete", Y.bind(this._drawingCompleteHandler, this));
        typeSeriesCollection.push(series);
        seriesCollection.push(series);
    },

    /**
     * @private
     * @description Creates a series instance based on a specified type.
     * @param {String} Indicates type of series instance to be created.
     * @return {Series} Series instance created.
     */
    _getSeries: function(type)
    {
        var seriesClass;
        switch(type)
        {
            case "line" :
                seriesClass = Y.LineSeries;
            break;
            case "column" :
                seriesClass = Y.ColumnSeries;
            break;
            case "bar" :
                seriesClass = Y.BarSeries;
            break;
            case "area" : 
                seriesClass = Y.AreaSeries;
            break;
            case "candlestick" :
                seriesClass = Y.CandlestickSeries;
            break;
            case "ohlc" :
                seriesClass = Y.OHLCSeries;
            break;
            case "stackedarea" :
                seriesClass = Y.StackedAreaSeries;
            break;
            case "stackedline" :
                seriesClass = Y.StackedLineSeries;
            break;
            case "stackedcolumn" :
                seriesClass = Y.StackedColumnSeries;
            break;
            case "stackedbar" :
                seriesClass = Y.StackedBarSeries;
            break;
            case "markerseries" :
                seriesClass = Y.MarkerSeries;
            break;
            case "spline" :
                seriesClass = Y.SplineSeries;
            break;
            case "areaspline" :
                seriesClass = Y.AreaSplineSeries;
            break;
            case "stackedspline" :
                seriesClass = Y.StackedSplineSeries;
            break;
            case "stackedareaspline" :
                seriesClass = Y.StackedAreaSplineSeries;
            break;
            case "stackedmarkerseries" :
                seriesClass = Y.StackedMarkerSeries;
            break;
            case "pie" :
                seriesClass = Y.PieSeries;
            break;
            case "combo" :
                seriesClass = Y.ComboSeries;
            break;
            case "stackedcombo" :
                seriesClass = Y.StackedComboSeries;
            break;
            case "combospline" :
                seriesClass = Y.ComboSplineSeries;
            break;
            case "stackedcombospline" :
                seriesClass = Y.StackedComboSplineSeries;
            break;
            default:
                seriesClass = Y.CartesianSeries;
            break;
        }
        return seriesClass;
    },

    /**
     * @private
     */
    _markerEventHandler: function(e)
    {
        var type = e.type,
            markerNode = e.currentTarget,
            strArr = markerNode.getAttribute("id").split("_"),
            series = this.getSeriesByIndex(strArr[1]),
            index = strArr[2];
        series.updateMarkerState(type, index);
    },

    /**
     * @private
     */
    _dispatchers: null,

    /**
     * @private
     */
    _updateStyles: function()
    {
        this._background.update(this.get("styles").background);
        this._sizeChangeHandler();
    },

    /**
     * @private
     */
    _sizeChangeHandler: function(e)
    {
        var sc = this.get("seriesCollection"),
            hgl = this.get("horizontalGridlines"),
            vgl = this.get("verticalGridlines"),
            i = 0,
            l,
            w = this.get("width"),
            h = this.get("height");
        if(this._background)
        {
            if(w && h)
            {
                this._background.update({width:w, height:h});
            }
        }
        if(hgl && hgl instanceof Y.Gridlines)
        {
            hgl.draw();
        }
        if(vgl && vgl instanceof Y.Gridlines)
        {
            vgl.draw();
        }
        if(sc)
        {
            l = sc.length;
            for(; i < l; ++i)
            {
                sc[i].draw();
            }
        }
    },

    /**
     * @private
     */
    _drawingCompleteHandler: function(e)
    {
        var series = e.currentTarget,
            index = Y.Array.indexOf(this._dispatchers, series);
        if(index > -1)
        {
            this._dispatchers.splice(index, 1);
        }
        if(this._dispatchers.length < 1)
        {
            this.fire("chartRendered");
        }
    },

    /**
     * @private
     */
    _getDefaultStyles: function()
    {
        var defs = {
            background: {
                shape: "rect",
                fill:{
                    color:"#faf9f2"
                },
                border: {
                    color:"#ccc",
                    weight: 1
                }
            }
        };
        return defs;
    }
}, {
    ATTRS: {
        seriesCollection: {
            getter: function()
            {
                return this._seriesCollection;
            },

            setter: function(val)
            {
                this._parseSeriesCollection(val);
                return this._seriesCollection;
            }
        },
        
        showBackground: {
            value: true
        },

        seriesDictionary: {
            readOnly: true,

            getter: function()
            {
                return this._seriesDictionary;
            }
        },

        horizontalGridlines: {
            value: null,

            setter: function(val)
            {
                var gl = this.get("horizontalGridlines");
                if(gl && gl instanceof Y.Gridlines)
                {
                    gl.remove();
                }
                if(val instanceof Y.Gridlines)
                {
                    gl = val;
                    val.set("graph", this);
                    val.render();
                    return val;
                }
                else if(val && val.axis)
                {
                    gl = new Y.Gridlines({direction:"horizontal", axis:val.axis, graph:this, styles:val.styles});
                    gl.render();
                    return gl;
                }
            }
        },
        
        verticalGridlines: {
            value: null,

            setter: function(val)
            {
                var gl = this.get("verticalGridlines");
                if(gl && gl instanceof Y.Gridlines)
                {
                    gl.remove();
                }
                if(val instanceof Y.Gridlines)
                {
                    gl = val;
                    val.set("graph", this);
                    val.render();
                    return val;
                }
                else if(val && val.axis)
                {
                    gl = new Y.Gridlines({direction:"vertical", axis:val.axis, graph:this, styles:val.styles});
                    gl.render();
                    return gl;
                }
            }
        }
    }
});
function ChartBase() {}

ChartBase.ATTRS = {
    tooltip: {
        valueFn: "_getTooltip",

        setter: function(val)
        {
            return this._updateTooltip(val);
        }
    },

    /**
     * @description Indicates the the type of interactions that will fire events.
     * <ul>
     *  <li>marker</li>
     *  <li>all</li>
     *  <li>none</li>
     */
    interactionType: {
        value: "marker"
    },

    /**
     * Reference to graph instance
     * @type Graph 
     */
    graph: {
        valueFn: "_getGraph"
   }
};

ChartBase.prototype = {
    /**
     * @private
     * @description Default value function for the <code>graph</code> attribute.
     */
    _getGraph: function()
    {
        var graph = new Y.Graph();
        graph.after("chartRendered", Y.bind(function(e) {
            this.fire("chartRendered");
        }, this));
        return graph; 
    },

    /**
     * Returns a series instance
     * @method getSeries
     */
    getSeries: function(val)
    {
        var series = null, 
            graph = this.get("graph");
        if(graph)
        {
            if(Y.Lang.isNumber(val))
            {
                series = graph.getSeriesByIndex(val);
            }
            else
            {
                series = graph.getSeriesByKey(val);
            }
        }
        return series;
    },

    /**
     * Returns axis by key reference
     * @method getAxisByKey
     */
    getAxisByKey: function(val)
    {
        var axis,
            axes = this.get("axes");
        if(axes.hasOwnProperty(val))
        {
            axis = axes[val];
        }
        return axis;
    },

    /**
     * Returns the category axis for the chart.
     * @method getCategoryAxis
     */
    getCategoryAxis: function()
    {
        var axis,
            key = this.get("categoryKey"),
            axes = this.get("axes");
        if(axes.hasOwnProperty(key))
        {
            axis = axes[key];
        }
        return axis;
    },

    /**
     * @private
     */
    _direction: "horizontal",
    
    /**
     * @private
     */
    _dataProvider: null,

    /**
     * @private
     */
    _setDataValues: function(val)
    {
        if(Y.Lang.isArray(val[0]))
        {
            var hash, 
                dp = [], 
                cats = val[0], 
                i = 0, 
                l = cats.length, 
                n, 
                sl = val.length;
            for(; i < l; ++i)
            {
                hash = {category:cats[i]};
                for(n = 1; n < sl; ++n)
                {
                    hash["series" + n] = val[n][i];
                }
                dp[i] = hash; 
            }
            this._dataProvider = dp;
            return;
        }
        this._dataProvider = val;
    },

    /**
     * @private 
     */
    _seriesCollection: null,

    /**
     * @private
     */
    _setSeriesCollection: function(val)
    {
        this._seriesCollection = val;
    },
    /**
     * @private
     */
    _getDataClass: function(t)
    {
        return this._dataClass[t];
    },
    /**
     * @private
     */
    _dataClass: {
        stacked: Y.StackedAxis,
        numeric: Y.NumericAxis,
        category: Y.CategoryAxis,
        time: Y.TimeAxis
    },
    /**
     * @private
     */
    _dataAxes: null,

    /**
     * @private
     */
    _axes: null,

    /**
     * @private
     */
    renderUI: function()
    {
        //move the position = absolute logic to a class file
        this.get("boundingBox").setStyle("position", "absolute");
        this.get("contentBox").setStyle("position", "absolute");
        this._addAxes();
        this._addSeries();
        if(this.get("showTooltip"))
        {
            this._addTooltip();
        }
        this._redraw();
    },
    
    /**
     * @private
     */
    bindUI: function()
    {
        this.after("showTooltipChange", Y.bind(this._showTooltipChangeHandler, this));
        this.after("widthChange", this._sizeChanged);
        this.after("heightChange", this._sizeChanged);
        var cb = this.get("contentBox"),
            interactionType = this.get("interactionType"),
            defaultTooltipFunction;
        if(interactionType == "marker")
        {
            Y.delegate("mouseenter", Y.bind(this._markerEventHandler, this), cb, ".yui3-seriesmarker");
            Y.delegate("mousedown", Y.bind(this._markerEventHandler, this), cb, ".yui3-seriesmarker");
            Y.delegate("mouseup", Y.bind(this._markerEventHandler, this), cb, ".yui3-seriesmarker");
            Y.delegate("mouseleave", Y.bind(this._markerEventHandler, this), cb, ".yui3-seriesmarker");
            Y.delegate("mousemove", Y.bind(this._positionTooltip, this), cb, ".yui3-seriesmarker");
            defaultTooltipFunction = this._displayTooltip;
        }
        else if(interactionType == "all")
        {
            this._overlay.on("mousemove", Y.bind(this._mouseMoveHandler, this));
            this.on("mouseout", this._hideTooltip);
            defaultTooltipFunction = this._displayMultiTooltip;
        }
        if(this.get("tooltip"))
        {
            this.on("markerEvent:mouseover", defaultTooltipFunction);
            this.on("markerEvent:mouseout", this._hideTooltip);
        }
    },
    
    /**
     * @private
     */
    _markerEventHandler: function(e)
    {
        var type = e.type,
            cb = this.get("contentBox"),
            markerNode = e.currentTarget,
            strArr = markerNode.getAttribute("id").split("_"),
            seriesIndex = strArr[0],
            series = this.getSeries(parseInt(strArr[1], 10)),
            index = strArr[2],
            x = e.pageX - cb.getX(),
            y = e.pageY - cb.getY();
        if(type == "mouseenter")
        {
            type = "mouseover";
        }
        else if(type == "mouseleave")
        {
            type = "mouseout";
        }
        series.updateMarkerState(type, index);
        this.fire("markerEvent:" + type, {node:markerNode, x:x, y:y, series:series, index:index, seriesIndex:seriesIndex});
    },

    /**
     * @private
     */
    _showTooltip: function(msg, x, y)
    {
        var tt = this.get("tooltip"),
            node = tt.node;
        if(msg)
        {
            node.set("innerHTML", msg);
            node.setStyle("top", y + "px");
            node.setStyle("left", x + "px");
            node.removeClass("yui3-widget-hidden");
        }
    },

    /**
     * @private
     */
    _positionTooltip: function(e)
    {
        var tt = this.get("tooltip"),
            node = tt.node,
            cb = this.get("contentBox"),
            x = (e.pageX + 10) - cb.getX(),
            y = (e.pageY + 10) - cb.getY();
        if(node)
        {
            node.setStyle("left", x + "px");
            node.setStyle("top", y + "px");
        }
    },

    /**
     * @private
     */
    _hideTooltip: function()
    {
        var tt = this.get("tooltip"),
            node = tt.node;
        node.set("innerHTML", "");
        node.setStyle("left", -10000);
        node.setStyle("top", -10000);
        node.addClass("yui3-widget-hidden");
    },

    /**
     * @private
     */
    _addTooltip: function()
    {
        var tt = this.get("tooltip");
        this.get("contentBox").appendChild(tt.node);
    },

    /**
     * @private
     */
    _updateTooltip: function(val)
    {
        var tt = this._tooltip,
            i,
            styles = val.styles;
        if(styles)
        {
            for(i in styles)
            {
                if(styles.hasOwnProperty(i))
                {
                    tt.node.setStyle(i, styles[i]);
                }
            }
        }
        if(val.hasOwnProperty("labelFunction"))
        {
            tt.labelFunction = val.labelFunction;
        }
        return tt;
    },

    /**
     * @private
     */
    _getTooltip: function()
    {
        var node = document.createElement("div"),
            tt = {
                labelFunction: this._tooltipLabelFunction
            };
        node = Y.one(node);
        node.setStyle("fontSize", "9px");
        node.setStyle("fontWeight", "bold");
        node.setStyle("position", "absolute");
        node.setStyle("paddingTop", "2px");
        node.setStyle("paddingRight", "5px");
        node.setStyle("paddingBottom", "5px");
        node.setStyle("paddingLeft", "2px");
        node.setStyle("backgroundColor", "#edeeee");
        node.setStyle("border", "1px solid #aeae9e");
        node.setStyle("zIndex", 3);
        node.setStyle("whiteSpace", "noWrap");
        node.addClass("yui3-widget-hidden");
        tt.node = Y.one(node);
        this._tooltip = tt;
        return tt;
    },

    /**
     * @private
     */
    _tooltipLabelFunction: function(categoryItem, valueItem, itemIndex, series, seriesIndex)
    {
        var msg = categoryItem.displayName +
        ":&nbsp;" + categoryItem.axis.get("labelFunction").apply(this, [categoryItem.value, categoryItem.axis.get("labelFormat")]) + 
        "<br/>" + valueItem.displayName + 
        ":&nbsp;" + valueItem.axis.get("labelFunction").apply(this, [valueItem.value, valueItem.axis.get("labelFormat")]);
        return msg; 
    },

    /**
     * @private
     */
    _showTooltipChangeHandler: function(e)
    {
        if(this.get("showTooltip"))
        {
            this._addTooltip();
        }
    }
};
Y.ChartBase = ChartBase;
/**
 * A basic chart application.
 */
Y.CartesianChart = Y.Base.create("cartesianChart", Y.Widget, [Y.ChartBase], {
    /**
     * @private
     */
    renderUI: function()
    {
        //move the position = absolute logic to a class file
        this.get("boundingBox").setStyle("position", "absolute");
        this.get("contentBox").setStyle("position", "absolute");
        this._addAxes();
        this._addGridlines();
        this._addSeries();
        if(this.get("showTooltip"))
        {
            this._addTooltip();
        }
        //If there is a style definition. Force them to set.
        this.get("styles");
        if(this.get("interactionType") == "all")
        {
            var overlay = document.createElement("div");
            this.get("contentBox").appendChild(overlay);
            this._overlay = Y.one(overlay); 
            this._overlay.setStyle("position", "absolute");
            this._overlay.setStyle("background", "#fff");
            this._overlay.setStyle("opacity", 0);
            this._overlay.addClass("yui3-overlay");
            this._overlay.setStyle("zIndex", 4);
        }
        this._redraw();
    },

    /**
     * @private
     */
    _mouseMoveHandler: function(e)
    {
        var graph = this.get("graph"),
            bb = this.get("boundingBox"),
            cb = graph.get("contentBox"),
            x = e.pageX,
            offsetX = x - cb.getX(),
            posX = x - bb.getX(),
            y = e.pageY,
            offsetY = y - cb.getY(),
            posY = y - bb.getY(),
            sc = graph.get("seriesCollection"),
            series,
            i = 0,
            index,
            oldIndex = this._selectedIndex,
            items = [],
            direction = this.get("direction"),
            hasMarkers,
            coord = direction == "horizontal" ? offsetX : offsetY,
            //data columns and area data could be created on a graph level
            markerPlane = direction == "horizontal" ? sc[0].get("xMarkerPlane") : sc[0].get("yMarkerPlane"),
            len = markerPlane.length;
       //only change on whole numbers
       if(coord % 1 > 0)
       {
            return;
       }
      
       for(; i < len; ++i)
       {
            if(coord <= markerPlane[i].end && coord >= markerPlane[i].start)
            {
                index = i;
                break;
            }
       }
       len = sc.length;
       for(i = 0; i < len; ++i)
       {
            series = sc[i];
            hasMarkers = series.get("markers");
            if(hasMarkers && !isNaN(oldIndex) && oldIndex > -1)
            {
                series.updateMarkerState("mouseout", oldIndex);
            }
            if(series.get("ycoords")[index] > -1)
            {
                if(hasMarkers && !isNaN(index) && index > -1)
                {
                    series.updateMarkerState("mouseover", index);
                }
                items.push(series);
            }
                
        }
        this._selectedIndex = index;
        
        if(index > -1)
        {
            this.fire("markerEvent:mouseover", {x:posX, y:posY, index:index, items:items, direction:direction, graph:graph});
        }
        else
        {
            this.fire("markerEvent:mouseout");
        }
    },

    /**
     * @private
     */
    _type: "combo",

    /**
     * @private
     */
    _axesRenderQueue: null,

    /**
     * Adds an axis to the queue
     */
    _addToAxesRenderQueue: function(axis)
    {
        if(!this._axesRenderQueue)
        {
            this._axesRenderQueue = [];
        }
        if(Y.Array.indexOf(this._axesRenderQueue, axis) < 0)
        {
            this._axesRenderQueue.push(axis);
        }
    },

    /**
     * @private
     */
    _getDefaultSeriesCollection: function(val)
    {
        var dir = this.get("direction"), 
            categoryAxisName = this.get("categoryAxisName") || this.get("categoryKey"),
            valueAxisName = this.get("valueAxisName"),
            sc = val || [], 
            catAxis,
            valAxis,
            tempKeys = [],
            series,
            seriesKeys = this.get("seriesKeys").concat(),
            i,
            index,
            l,
            type = this.get("type"),
            key,
            catKey,
            seriesKey,
            categoryKey = this.get("categoryKey"),
            showMarkers = this.get("showMarkers"),
            showAreaFill = this.get("showAreaFill"),
            showLines = this.get("showLines");
        if(dir == "vertical")
        {
            catAxis = "yAxis";
            catKey = "yKey";
            valAxis = "xAxis";
            seriesKey = "xKey";
        }
        else
        {
            catAxis = "xAxis";
            catKey = "xKey";
            valAxis = "yAxis";
            seriesKey = "yKey";
        }
        l = sc.length;
        for(i = 0; i < l; ++i)
        {
            key = this._getBaseAttribute(sc[i], seriesKey);
            if(key)
            {
                index = Y.Array.indexOf(seriesKeys, key);
                if(index > -1)
                {
                    seriesKeys.splice(index, 1);
                }
               tempKeys.push(key);
            }
        }
        if(seriesKeys.length > 0)
        {
            tempKeys = tempKeys.concat(seriesKeys);
        }
        l = tempKeys.length;
        for(i = 0; i < l; ++i)
        {
            series = sc[i] || {type:type};
            if(series instanceof Y.CartesianSeries)
            {
                continue;
            }
            series[catKey] = series[catKey] || categoryKey;
            series[seriesKey] = series[seriesKey] || seriesKeys.shift();
            series[catAxis] = series[catAxis] || categoryAxisName;
            series[valAxis] = this._getSeriesAxis(series[seriesKey], valueAxisName);
            series.type = series.type || type;
            if((series.type == "combo" || series.type == "stackedcombo" || series.type == "combospline" || series.type == "stackedcombospline"))
            {
                if(showAreaFill !== null)
                {
                    series.showAreaFill = series.showAreaFill || showAreaFill;
                }
                if(showMarkers !== null)
                {
                    series.showMarkers = series.showMarkers || showMarkers;
                }
                if(showLines !== null)
                {
                    series.showLines = series.showLines || showLines;
                }
            }
            sc[i] = series;
        }
        if(val)
        {
            var graph = this.get("graph");
            graph.set("seriesCollection", sc);
            sc = graph.get("seriesCollection");
        }
        return sc;
    },

    /**
     * @private
     * @description Gets the appropriate axis to bind a series to when one is not explicitly
     * set.
     */
    _getSeriesAxis:function(key, axis)
    {
        var axes = this.get("axes"),
            i,
            keys;
        if(axes)
        {
            for(i in axes)
            {
                if(axes.hasOwnProperty(i))
                {
                    keys = axes[i].get("dataSet").get("keys");
                    if(keys && keys.hasOwnProperty(key))
                    {
                        axis = i;
                        break;
                    }
                }
            }
        }
        return axis;
    },

    /**
     * @private
     * @description Gets an attribute from an object, using a getter for Base objects and a property for object
     * literals. Used for determining attributes from series/axis references which can be an actual class instance
     * or a hash of properties that will be used to create a class instance.
     */
    _getBaseAttribute: function(item, key)
    {
        if(item instanceof Y.Base)
        {
            return item.get(key);
        }
        if(item.hasOwnProperty(key))
        {
            return item[key];
        }
        return null;
    },

    /**
     * @private
     * @description Sets an attribute on an object, using a setter of Base objects and a property for object
     * literals. Used for setting attributes on a Base class, either directly or to be stored in an object literal
     * for use at instantiation.
     */
    _setBaseAttribute: function(item, key, value)
    {
        if(item instanceof Y.Base)
        {
            item.set(key, value);
        }
        else
        {
            item[key] = value;
        }
    },

    /**
     * @private
     * Creates Axis and Axis data classes based on hashes of properties.
     */
    _parseAxes: function(val)
    {
        var hash = this._getDefaultAxes(val),
            axes = {},
            axesAttrs = {
                edgeOffset: "edgeOffset", 
                position: "position",
                overlapGraph:"overlapGraph",
                labelFunction:"labelFunction",
                labelFunctionScope:"labelFunctionScope",
                labelFormat:"labelFormat"
            },
            ai,
            i, pos, axis, dataAxis, dh, config, dataClass, dcfg,
            axesCollection;
        for(i in hash)
        {
            if(hash.hasOwnProperty(i))
            {
                dh = hash[i];
                if(dh instanceof Y.Axis)
                {
                    axis = dh;
                }
                else
                {
                    dataClass = this._getDataClass(dh.type);
                    dcfg = {dataProvider:this.get("dataProvider"), keys:dh.keys};
                    
                    if(dh.hasOwnProperty("roundingUnit"))
                    {
                        dcfg.roundingUnit = dh.roundingUnit;
                    }
                    
                    
                    dataAxis = new dataClass(dcfg);
                    pos = dh.position;
                    config = {};
                    if(dh.styles)
                    {
                        config.styles = dh.styles;
                    }
                    config.dataSet = dataAxis;
                    config.position = dh.position;
                    for(ai in axesAttrs)
                    {
                        if(axesAttrs.hasOwnProperty(ai) && dh.hasOwnProperty(ai))
                        {
                            config[ai] = dh[ai];
                        }
                    }
                    if(pos && pos != "none")
                    {
                        axis = new Y.Axis(config);
                    }
                }

                if(axis)
                {
                    axesCollection = this.get(pos + "AxesCollection");
                    if(axesCollection && Y.Array.indexOf(axesCollection, axis) > 0)
                    {
                        axis.set("overlapGraph", false);
                    }
                    axis.after("axisRendered", Y.bind(this._axisRendered, this));
                    axes[i] = axis;
                }
                if(!this._dataAxes)
                {
                    this._dataAxes = {};
                }
                if(axes[i])
                {
                    this._dataAxes[i] = axes[i].get("dataSet");
                }
                else
                {
                    this._dataAxes[i] = dataAxis;
                }
            }
        }
        return axes;
    },
    
    /**
     * @private
     */
    _addAxes: function()
    {
        var axes = this.get("axes"),
            i, 
            axis, 
            pos,
            w = this.get("width"),
            h = this.get("height"),
            node = Y.Node.one(this._parentNode);
        if(!this._axesCollection)
        {   
            this._axesCollection = [];
        }
        for(i in axes)
        {
            if(axes.hasOwnProperty(i))
            {
                axis = axes[i];
                if(axis instanceof Y.Axis)
                {
                    if(!w)
                    {
                        this.set("width", node.get("offsetWidth"));
                        w = this.get("width");
                    }
                    if(!h)
                    {
                        this.set("height", node.get("offsetHeight"));
                        h = this.get("height");
                    }
                    axis.set("width", w);
                    axis.set("height", h);
                    this._addToAxesRenderQueue(axis);
                    pos = axis.get("position");
                    if(!this.get(pos + "AxesCollection"))
                    {
                        this.set(pos + "AxesCollection", [axis]);
                    }
                    else
                    {
                        this.get(pos + "AxesCollection").push(axis);
                    }
                    this._axesCollection.push(axis);
                    if(axis.get("dataSet").get("keys").hasOwnProperty(this.get("categoryKey")))
                    {
                        this.set("categoryAxis", axis.get("dataSet"));
                    }
                    axis.render(this.get("contentBox"));
                }
            }
        }
    },

    /**
     * @private
     */
    _addSeries: function()
    {
        var graph = this.get("graph"),
            sc = this.get("seriesCollection");
        this._parseSeriesAxes(sc);
        graph.render(this.get("contentBox"));

    },

    /**
     * @private
     * @description Adds gridlines to the chart.
     */
    _addGridlines: function()
    {
        var graph = this.get("graph"),
            hgl = this.get("horizontalGridlines"),
            vgl = this.get("verticalGridlines");
        if(hgl)
        {
            if(!this._getBaseAttribute(hgl, "axis"))
            {
                this._setBaseAttribute(hgl, "axis", this.get("leftAxesCollection")[0] || this.get("rightAxesCollection")[0]);
                if(this._getBaseAttribute(hgl, "axis"))
                {
                    graph.set("horizontalGridlines", hgl);
                }
            }
        }
        if(vgl)
        {
            if(!this._getBaseAttribute(vgl, "axis"))
            {
                this._setBaseAttribute(vgl, "axis", this.get("bottomAxesCollection")[0] || this.get("topAxesCollection")[0]);
                if(this._getBaseAttribute(vgl, "axis"))
                {
                    graph.set("verticalGridlines", vgl);
                }
            }
        }
    },

    /**
     * @private
     */
    _parseSeriesAxes: function(c)
    {
        var i = 0, 
            len = c.length, 
            s,
            axis;
        for(; i < len; ++i)
        {
            s = c[i];
            if(s)
            {
           
                this._setBaseAttribute(s, "xAxis", this._dataAxes[this._getBaseAttribute(s, "xAxis")]);
                this._setBaseAttribute(s, "yAxis", this._dataAxes[this._getBaseAttribute(s, "yAxis")]);
            }
        }
    },

    /**
     * @private
     */
    _getDefaultAxes: function(axes)
    {
        var catKey = this.get("categoryKey"),
            axis,
            attr,
            keys,
            newAxes = {},
            claimedKeys = [],
            categoryAxisName = this.get("categoryAxisName") || this.get("categoryKey"),
            valueAxisName = this.get("valueAxisName"),
            seriesKeys = this.get("seriesKeys") || [], 
            i, 
            l,
            ii,
            ll,
            cIndex,
            dv = this.get("dataProvider")[0],
            direction = this.get("direction"),
            seriesPosition,
            categoryPosition,
            valueAxes = [],
            seriesAxis = this.get("stacked") ? "stacked" : "numeric";
        if(direction == "vertical")
        {
            seriesPosition = "bottom";
            categoryPosition = "left";
        }
        else
        {
            seriesPosition = "left";
            categoryPosition = "bottom";
        }
        if(axes)
        {
            for(i in axes)
            {
                if(axes.hasOwnProperty(i))
                {
                    axis = axes[i];
                    keys = this._getBaseAttribute(axis, "keys");
                    attr = this._getBaseAttribute(axis, "type");
                    if(attr == "time" || attr == "category")
                    {
                        categoryAxisName = i;
                        this.set("categoryAxisName", i);
                        if(Y.Lang.isArray(keys) && keys.length > 0)
                        {
                            catKey = keys[0];
                            this.set("categoryKey", catKey);
                        }
                        newAxes[i] = axis;
                    }
                    else if(i == categoryAxisName)
                    {
                        newAxes[i] = axis;
                    }
                    else 
                    {
                        newAxes[i] = axis;
                        if(i != valueAxisName && keys && Y.Lang.isArray(keys))
                        {
                            ll = keys.length;
                            for(ii = 0; ii < ll; ++ii)
                            {
                                claimedKeys.push(keys[ii]);
                            }
                            valueAxes.push(newAxes[i]);
                        }
                        if(!(this._getBaseAttribute(newAxes[i], "type")))
                        {
                            this._setBaseAttribute(newAxes[i], "type", seriesAxis);
                        }
                        if(!(this._getBaseAttribute(newAxes[i], "position")))
                        {
                            this._setBaseAttribute(newAxes[i], "position", this._getDefaultAxisPosition(newAxes[i], valueAxes, seriesPosition));
                        }
                    }
                }
            }
        }
        if(seriesKeys.length < 1)
        {
            for(i in dv)
            {
                if(dv.hasOwnProperty(i) && i != catKey && Y.Array.indexOf(claimedKeys, i) == -1)
                {
                    seriesKeys.push(i);
                }
            }
        }
        cIndex = Y.Array.indexOf(seriesKeys, catKey);
        if(cIndex > -1)
        {
            seriesKeys.splice(cIndex, 1);
        }
        l = claimedKeys.length;
        for(i = 0; i < l; ++i)
        {
            cIndex = Y.Array.indexOf(seriesKeys, claimedKeys[i]); 
            if(cIndex > -1)
            {
                seriesKeys.splice(cIndex, 1);
            }
        }
        if(!newAxes.hasOwnProperty(categoryAxisName))
        {
            newAxes[categoryAxisName] = {};
        }
        if(!(this._getBaseAttribute(newAxes[categoryAxisName], "keys")))
        {
            this._setBaseAttribute(newAxes[categoryAxisName], "keys", [catKey]);
        }
        
        if(!(this._getBaseAttribute(newAxes[categoryAxisName], "position")))
        {
            this._setBaseAttribute(newAxes[categoryAxisName], "position", categoryPosition);
        }
         
        if(!(this._getBaseAttribute(newAxes[categoryAxisName], "type")))
        {
            this._setBaseAttribute(newAxes[categoryAxisName], "type", this.get("categoryType"));
        }
        if(!newAxes.hasOwnProperty(valueAxisName) && seriesKeys && seriesKeys.length > 0)
        {
            newAxes[valueAxisName] = {keys:seriesKeys};
            valueAxes.push(newAxes[valueAxisName]);
        }
        if(claimedKeys.length > 0)
        {
            if(seriesKeys.length > 0)
            {
                seriesKeys = claimedKeys.concat(seriesKeys);
            }
            else
            {
                seriesKeys = claimedKeys;
            }
        }
        if(newAxes.hasOwnProperty(valueAxisName))
        {
            if(!(this._getBaseAttribute(newAxes[valueAxisName], "position")))
            {
                this._setBaseAttribute(newAxes[valueAxisName], "position", this._getDefaultAxisPosition(newAxes[valueAxisName], valueAxes, seriesPosition));
            }
            if(!(this._getBaseAttribute(newAxes[valueAxisName], "type")))
            {
                this._setBaseAttribute(newAxes[valueAxisName], "type", seriesAxis);
            }
            if(!(this._getBaseAttribute(newAxes[valueAxisName], "keys")))
            {
                this._setBaseAttribute(newAxes[valueAxisName], "keys", seriesKeys);
            }
        } 
        this.set("seriesKeys", seriesKeys);
        return newAxes;
    },

    _getDefaultAxisPosition: function(axis, valueAxes, position)
    {
        var i = Y.Array.indexOf(valueAxes, axis);
        if(valueAxes[i - 1] && valueAxes[i - 1].position)
        {
            if(valueAxes[i - 1].position == "left")
            {
                position = "right";
            }
            else if(valueAxes[i - 1].position == "right")
            {
                position = "left";
            }
            else if (valueAxes[i -1].position == "bottom")
            {
                position = "top";
            }       
            else
            {
                position = "bottom";
            }
        }
        return position;
    },

    _displayTooltip: function(e) {
        var node = e.node,
        graph = Y.Widget.getByNode(node),
        strArr = e.node.getAttribute("id").split("_"),
        seriesIndex = strArr[1],
        series = graph.getSeriesByIndex(seriesIndex),
        index = strArr[2],
        xAxis = series.get("xAxis"),
        yAxis = series.get("yAxis"),
        xKey = series.get("xKey"),
        yKey = series.get("yKey"),
        categoryItem = {},
        valueItem = {},
        tt = this.get("tooltip"),
        msg;
        if(this.get("direction") == "vertical")
        {
            categoryItem = {
                axis:yAxis,
                key:yKey,
                value:yAxis.getKeyValueAt(yKey, index)
            };
            valueItem = {
                axis:xAxis,
                key:xKey,
                value: xAxis.getKeyValueAt(xKey, index)
            };
        }
        else
        {
            valueItem = {
                axis:yAxis,
                key:yKey,
                value:yAxis.getKeyValueAt(yKey, index)
            };
            categoryItem = {
                axis:xAxis,
                key:xKey,
                value: xAxis.getKeyValueAt(xKey, index)
            };
        }
        categoryItem.displayName = series.get("categoryDisplayName");
        valueItem.displayName = series.get("valueDisplayName");

        
        msg = tt.labelFunction.apply(this, [categoryItem, valueItem, index, series, seriesIndex]);
        if (node) {
           this._showTooltip(msg, e.x + 10, e.y + 10);
        }

    },

    /**
     * @private
     */
    _displayMultiTooltip: function(e)
    {
        var items = e.items,
            len = items.length,
            i = 0,
            index = e.index,
            msg = "",
            series,
            xAxis,
            yAxis,
            categoryAxis = this.get("categoryAxis"),
            horizontal = e.direction == "horizontal";
        if(categoryAxis)
        {
            msg = categoryAxis.get("labelFunction").apply(this, [categoryAxis.getKeyValueAt(this.get("categoryKey"), index), categoryAxis.get("labelFormat")]);
        }

        for(; i < len; ++i)
        {
            series = items[i];
            if(series.get("visible"))
            {
                if(horizontal)
                {
                    yAxis = series.get("yAxis");
                    msg += "<br/><span>" + series.get("yDisplayName") + ":&nbsp;"  + yAxis.get("labelFunction").apply(this, [yAxis.getKeyValueAt(series.get("yKey"), index), yAxis.get("labelFormat")]) + "</span>";
                }
                else
                {
                    xAxis = series.get("xAxis");
                    msg += "<br/><span>" + series.get("xDisplayName") + "&nbsp;" + xAxis.get("labelFunction").apply(this, [xAxis.getKeyValueAt(series.get("xKey"), index), xAxis.get("labelFormat")]) + "</span>";
                }
            }
        }
        this._showTooltip(msg, e.x + 10, e.y + 10);
    },

    /**
     * @private
     */
    _showTooltipChangeHandler: function(e)
    {
        if(this.get("showTooltip") && this.get("rendered"))
        {
            this._addTooltip();
        }
    },

    /**
     * @private
     * @description Listender for axisRendered event.
     */
    _axisRendered: function(e)
    {
        this._axesRenderQueue = this._axesRenderQueue.splice(1 + Y.Array.indexOf(this._axesRenderQueue, e.currentTarget), 1);
        if(this._axesRenderQueue.length < 1)
        {
            this._redraw();
        }
    },

    _sizeChanged: function(e)
    {
        if(this._axesCollection)
        {
            var ac = this._axesCollection,
                i = 0,
                l = ac.length;
            for(; i < l; ++i)
            {
                this._addToAxesRenderQueue(ac[i]);
            }
            this._redraw();
        }
    },

    _redraw: function()
    {
        var w = this.get("width"),
            h = this.get("height"),
            lw = 0,
            rw = 0,
            th = 0,
            bh = 0,
            lc = this.get("leftAxesCollection"),
            rc = this.get("rightAxesCollection"),
            tc = this.get("topAxesCollection"),
            bc = this.get("bottomAxesCollection"),
            i = 0,
            l,
            axis,
            pos,
            pts = [],
            graph = this.get("graph"); 
        if(lc)
        {
            l = lc.length;
            for(i = l - 1; i > -1; --i)
            {
                pts[Y.Array.indexOf(this._axesCollection, lc[i])] = {x:lw + "px"};
                lw += lc[i].get("width");
            }
        }
        if(rc)
        {
            l = rc.length;
            i = 0;
            for(i = l - 1; i > -1; --i)
            {
                rw += rc[i].get("width");
                pts[Y.Array.indexOf(this._axesCollection, rc[i])] = {x:(w - rw) + "px"};
            }
        }
        if(tc)
        {
            l = tc.length;
            for(i = l - 1; i > -1; --i)
            {
                pts[Y.Array.indexOf(this._axesCollection, tc[i])] = {y:th + "px"};
                th += tc[i].get("height");
            }
        }
        if(bc)
        {
            l = bc.length;
            for(i = l - 1; i > -1; --i)
            {
                bh += bc[i].get("height");
                pts[Y.Array.indexOf(this._axesCollection, bc[i])] = {y:(h - bh) + "px"};
            }
        }
        l = this._axesCollection.length;
        i = 0;
        
        for(; i < l; ++i)
        {
            axis = this._axesCollection[i];
            pos = axis.get("position");
            if(pos == "left" || pos === "right")
            {
                axis.get("boundingBox").setStyle("top", th + "px");
                axis.get("boundingBox").setStyle("left", pts[i].x);
                if(axis.get("height") !== h - (bh + th))
                {
                    axis.set("height", h - (bh + th));
                }
                continue;
            }
            if(axis.get("width") !== w - (lw + rw))
            {
                axis.set("width", w - (lw + rw));
            }
            axis.get("boundingBox").setStyle("left", lw + "px");
            axis.get("boundingBox").setStyle("top", pts[i].y);
        }
        
        if(graph)
        {
            graph.get("boundingBox").setStyle("left", lw + "px");
            graph.get("boundingBox").setStyle("top", th + "px");
            graph.set("width", w - (lw + rw));
            graph.set("height", h - (th + bh));
        }

        if(this._overlay)
        {
            this._overlay.setStyle("left", lw + "px");
            this._overlay.setStyle("top", th + "px");
            this._overlay.setStyle("width", (w - (lw + rw)) + "px");
            this._overlay.setStyle("height", (h - (th + bh)) + "px");
        }
    }
}, {
    ATTRS: {
        axesStyles: {
            getter: function()
            {
                var axes = this.get("axes"),
                    i,
                    styles = this._axesStyles;
                if(axes)
                {
                    for(i in axes)
                    {
                        if(axes.hasOwnProperty(i) && axes[i] instanceof Y.Axis)
                        {
                            if(!styles)
                            {
                                styles = {};
                            }
                            styles[i] = axes[i].get("styles");
                        }
                    }
                }
                return styles;
            },
            
            setter: function(val)
            {
                var axes = this.get("axes"),
                    i;
                for(i in val)
                {
                    if(val.hasOwnProperty(i) && axes.hasOwnProperty(i))
                    {
                        this._setBaseAttribute(axes[i], "styles", val[i]);
                    }
                }
            }
        },

        seriesStyles: {
            getter: function()
            {
                var styles = this._seriesStyles,
                    graph = this.get("graph"),
                    dict,
                    i;
                if(graph)
                {
                    dict = graph.get("seriesDictionary");
                    if(dict)
                    {
                        styles = {};
                        for(i in dict)
                        {
                            if(dict.hasOwnProperty(i))
                            {
                                styles[i] = dict[i].get("styles");
                            }
                        }
                    }
                }
                return styles;
            },
            
            setter: function(val)
            {
                var i,
                    l,
                    s;
    
                if(Y.Lang.isArray(val))
                {
                    s = this.get("seriesCollection");
                    i = 0;
                    l = val.length;

                    for(; i < l; ++i)
                    {
                        this._setBaseAttribute(s[i], "styles", val[i]);
                    }
                }
                else
                {
                    for(i in val)
                    {
                        if(val.hasOwnProperty(i))
                        {
                            s = this.getSeries(i);
                            this._setBaseAttribute(s, "styles", val[i]);
                        }
                    }
                }
            }
        },

        graphStyles: {
            getter: function()
            {
                var graph = this.get("graph");
                if(graph)
                {
                    return(graph.get("styles"));
                }
                return this._graphStyles;
            },

            setter: function(val)
            {
                var graph = this.get("graph");
                this._setBaseAttribute(graph, "styles", val);
            }

        },

        styles: {
            getter: function()
            {
                var styles = { 
                    axes: this.get("axesStyles"),
                    series: this.get("seriesStyles"),
                    graph: this.get("graphStyles")
                };
                return styles;
            },
            setter: function(val)
            {
                if(val.hasOwnProperty("axes"))
                {
                    if(this.get("axesStyles"))
                    {
                        this.set("axesStyles", val.axes);
                    }
                    else
                    {
                        this._axesStyles = val.axes;
                    }
                }
                if(val.hasOwnProperty("series"))
                {
                    if(this.get("seriesStyles"))
                    {
                        this.set("seriesStyles", val.series);
                    }
                    else
                    {
                        this._seriesStyles = val.series;
                    }
                }
                if(val.hasOwnProperty("graph"))
                {
                    this.set("graphStyles", val.graph);
                }
            }
        },

        /**
         * Data used to generate the chart.
         */
        dataProvider: {
            getter: function()
            {
                return this._dataProvider;
            },

            setter: function(val)
            {
                if(this._dataAxes)
                {
                    var i;
                    for(i in this._dataAxes)
                    {
                        if(this._dataAxes.hasOwnProperty(i))
                        {
                            this._dataAxes[i].set("dataProvider", val);
                        }
                    }
                    this._dataProvider = val;
                }
                else
                {
                    this._setDataValues(val);
                }
            }
        },

        /**
         * Axes to appear in the chart. 
         */
        axes: {
            valueFn: "_parseAxes",

            setter: function(val)
            {
                return this._parseAxes(val);
            }
        },
        /**
         * Collection of series to appear on the chart. This can be an array of Series instances or object literals
         * used to describe a Series instance.
         */
        seriesCollection: {
            valueFn: "_getDefaultSeriesCollection",
            
            setter: function(val)
            {
                return this._getDefaultSeriesCollection(val);
            }
        },

        /**
         * Element that contains left axes
         */
        leftAxesCollection: {},

        /**
         * Element that contains bottom axes
         */
        bottomAxesCollection: {},

        /**
         * Element that contains right axes
         */
        rightAxesCollection: {},

        /**
         * Element that contains top axes
         */
        topAxesCollection: {},

        /**
         * All axes in a chart
         */
        axesCollection: {},
        
        /**
         * Indicates whether or not the chart is stacked.
         * @type Boolean
         */
        stacked: {
            value: false
        },

        /**
         * Direction of chart's category axis when there is no series collection specified. Charts can
         * be horizontal or vertical. When the chart type is column, the chart is horizontal.
         * When the chart type is bar, the chart is vertical. 
         * @type String
         * @default Horizontal
         */
        direction: {
            getter: function()
            {
                var type = this.get("type");
                if(type == "bar")
                {   
                    return "vertical";
                }
                else if(type == "column")
                {
                    return "horizontal";
                }
                return this._direction;
            },

            setter: function(val)
            {
                this._direction = val;
                return this._direction;
            }
        },

        /**
         * Indicates whether or not to show a tooltip.
         */
        showTooltip: {
            value:true
        },

        /** 
         * The key value used for the chart's category axis. 
         * @default "category"
         * @type String
         */
        categoryKey: {
            value: "category"
        },
        
        /**
         * A collection of keys that map to the series axes. If no keys are set,
         * they will be generated automatically depending on the data structure passed into 
         * the chart.
         * @type Array
         */
        seriesKeys: {},

        /**
         * Indicates whether or not an area is filled in a combo chart.
         */
        showAreaFill: {},

        showMarkers:{},

        showLines:{},
        
        /**
         * Indicates the type of axis to use for the category axis.
         */
        categoryType:{
            value:"category"
        },

        /**
         * Indicates the key value used to identify a category axis in the <code>axes</code> hash.
         */
        categoryAxisName: {
        },

        valueAxisName: {
            value: "values"
        },

        horizontalGridlines: {
            getter: function()
            {
                var graph = this.get("graph");
                if(graph)
                {
                    return graph.get("horizontalGridlines");
                }
                return this._horizontalGridlines;
            },
            setter: function(val)
            {
                var graph = this.get("graph");
                if(val && !Y.Lang.isObject(val))
                {
                    val = {};
                }
                if(graph)
                {
                    graph.set("horizontalGridlines", val);
                }
                else
                {
                    this._horizontalGridlines = val;
                }
            }
        },

        verticalGridlines: {
            getter: function()
            {
                var graph = this.get("graph");
                if(graph)
                {
                    return graph.get("verticalGridlines");
                }
                return this._verticalGridlines;
            },
            setter: function(val)
            {
                var graph = this.get("graph");
                if(val && !Y.Lang.isObject(val))
                {
                    val = {};
                }
                if(graph)
                {
                    graph.set("verticalGridlines", val);
                }
                else
                {
                    this._verticalGridlines = val;
                }
            }
        },
        
        /**
         * Type of chart when there is no series collection specified.
         * @type String 
         */
        type: {
            getter: function()
            {
                if(this.get("stacked"))
                {
                    return "stacked" + this._type;
                }
                return this._type;
            },

            setter: function(val)
            {
                if(this._type == "bar")
                {
                    if(val != "bar")
                    {
                        this.set("direction", "horizontal");
                    }
                }
                else
                {
                    if(val == "bar")
                    {
                        this.set("direction", "vertical");
                    }
                }
                this._type = val;
                return this._type;
            }
        },
        
        /**
         * Reference to the category axis used by the chart.
         */
        categoryAxis:{}
    }
});
Y.PieChart = Y.Base.create("pieChart", Y.Widget, [Y.ChartBase], {
    /**
     * @private
     */
    _getSeriesCollection: function()
    {
        if(this._seriesCollection)
        {
            return this._seriesCollection;
        }
        var axes = this.get("axes"),
            sc = [], 
            seriesKeys,
            i = 0,
            l,
            type = this.get("type"),
            key,
            catAxis = "categoryAxis",
            catKey = "categoryKey",
            valAxis = "valueAxis",
            seriesKey = "valueKey";
        if(axes)
        {
            seriesKeys = axes.values.get("dataSet").get("keyCollection");
            key = axes.category.get("dataSet").get("keyCollection")[0];
            l = seriesKeys.length;
            for(; i < l; ++i)
            {
                sc[i] = {type:type};
                sc[i][catAxis] = "category";
                sc[i][valAxis] = "values";
                sc[i][catKey] = key;
                sc[i][seriesKey] = seriesKeys[i];
            }
        }
        this._seriesCollection = sc;
        return sc;
    },

    /**
     * @private
     */
    _parseAxes: function(hash)
    {
        if(!this._axes)
        {
            this._axes = {};
        }
        if(!this._dataAxes)
        {
            this._dataAxes = {};
        }
        var i, pos, axis, dataAxis, dh, config, dataClass,
            type = this.get("type"),
            w = this.get("width"),
            h = this.get("height"),
            node = Y.Node.one(this._parentNode);
        if(!w)
        {
            this.set("width", node.get("offsetWidth"));
            w = this.get("width");
        }
        if(!h)
        {
            this.set("height", node.get("offsetHeight"));
            h = this.get("height");
        }
        for(i in hash)
        {
            if(hash.hasOwnProperty(i))
            {
                dh = hash[i];
                pos = type == "pie" ? "none" : dh.position;
                dataClass = this._getDataClass(dh.type);
                config = {dataProvider:this.get("dataProvider"), keys:dh.keys};
                if(dh.hasOwnProperty("roundingUnit"))
                {
                    config.roundingUnit = dh.roundingUnit;
                }
                dataAxis = new dataClass(config);
                if(pos && pos != "none")
                {
                    axis = new Y.Axis({dataSet:dataAxis, width:w, height:h, position:dh.position, styles:dh.styles});
                    axis.on("axisRendered", Y.bind(this._axisRendered, this));
                    this._axes[i] = axis;
                }
                this._dataAxes[i] = dataAxis;
            }
        }
    },

    /**
     * @private
     */
    _addAxes: function()
    {
        var axes = this.get("axes"),
            i, 
            axis, 
            p;
        if(!axes)
        {
            this.set("axes", this._getDefaultAxes());
            axes = this.get("axes");
        }
        if(!this._axesCollection)
        {   
            this._axesCollection = [];
        }
        for(i in axes)
        {
            if(axes.hasOwnProperty(i))
            {
                axis = axes[i];
                p = axis.get("position");
                if(!this.get(p + "AxesCollection"))
                {
                    this.set(p + "AxesCollection", [axis]);
                }
                else
                {
                    this.get(p + "AxesCollection").push(axis);
                }
                this._axesCollection.push(axis);
            }
        }
    },

    /**
     * @private
     */
    _addSeries: function()
    {
        var graph = this.get("graph"),
            seriesCollection = this.get("seriesCollection");
        this._parseSeriesAxes(seriesCollection);
        graph.set("showBackground", false);
        graph.set("width", this.get("width"));
        graph.set("height", this.get("height"));
        graph.set("seriesCollection", seriesCollection);
        this._seriesCollection = graph.get("seriesCollection");
        graph.render(this.get("contentBox"));
    },

    /**
     * @private
     */
    _parseSeriesAxes: function(c)
    {
        var i = 0, 
            len = c.length, 
            s,
            axis;
        for(; i < len; ++i)
        {
            s = c[i];
            if(s)
            {
                //If series is an actual series instance, 
                //replace axes attribute string ids with axes
                if(s instanceof Y.PieSeries)
                {
                    axis = s.get("categoryAxis");
                    if(axis && !(axis instanceof Y.BaseAxis))
                    {
                        s.set("categoryAxis", this._dataAxes[axis]);
                    }
                    axis = s.get("valueAxis");
                    if(axis && !(axis instanceof Y.BaseAxis))
                    {
                        s.set("valueAxis", this._dataAxes[axis]);
                    }
                    continue;
                }
                s.categoryAxis = this._dataAxes.category;
                s.valueAxis = this._dataAxes.values;
                if(!s.type)
                {
                    s.type = this.get("type");
                }
            }
        }
    },

    /**
     * @private
     */
    _getDefaultAxes: function()
    {
        var catKey = this.get("categoryKey"),
            seriesKeys = this.get("seriesKeys") || [], 
            seriesAxis = "numeric",
            i, 
            dv = this.get("dataProvider")[0];
        if(seriesKeys.length < 1)
        {
            for(i in dv)
            {
                if(i != catKey)
                {
                    seriesKeys.push(i);
                }
            }
            if(seriesKeys.length > 0)
            {
                this.set("seriesKeys", seriesKeys);
            }
        }
        return {
            values:{
                keys:seriesKeys,
                type:seriesAxis
            },
            category:{
                keys:[catKey],
                type:this.get("categoryType")
            }
        };
    },
        
    _displayTooltip: function(e) {
        var tt = this.get("tooltip"),
            node = e.node,
            graph = Y.Widget.getByNode(node),
            strArr = e.node.getAttribute("id").split("_"),
            seriesIndex = strArr[1],
            series = graph.getSeriesByIndex(seriesIndex),
            index = strArr[2],
            categoryItem = {
                axis: series.get("categoryAxis"),
                key: series.get("categoryKey"),
                displayName: series.get("categoryDisplayName")
            },
            valueItem = {
                axis: series.get("valueAxis"),
                key: series.get("valueKey"),
                displayName: series.get("valueDisplayName")
            },
            msg;
        categoryItem.value = categoryItem.axis.getKeyValueAt(categoryItem.key, index);
        valueItem.value = valueItem.axis.getKeyValueAt(valueItem.key, index);
        msg = tt.labelFunction.apply(this, [categoryItem, valueItem, index, series, seriesIndex]);
        this._showTooltip(msg, e.x + 10, e.y + 10);
    },

    _sizeChanged: function(e)
    {
        this._redraw();
    },

    _redraw: function()
    {
        var graph = this.get("graph");
        if(graph)
        {
            graph.set("width", this.get("width"));
            graph.set("height", this.get("height"));
        }
    }
}, {
    ATTRS: {
        /**
         * Data used to generate the chart.
         */
        dataProvider: {
            getter: function()
            {
                return this._dataProvider;
            },

            setter: function(val)
            {
                if(this._dataAxes)
                {
                    var i;
                    for(i in this._dataAxes)
                    {
                        if(this._dataAxes.hasOwnProperty(i))
                        {
                            this._dataAxes[i].set("dataProvider", val);
                        }
                    }
                    this._dataProvider = val;
                }
                else
                {
                    this._setDataValues(val);
                }
            }
        },

        /**
         * Axes to appear in the chart. 
         */
        axes: {
            getter: function()
            {
                return this._axes;
            },

            setter: function(val)
            {
                this._parseAxes(val);
            }
        },

        /**
         * Collection of series to appear on the chart. This can be an array of Series instances or object literals
         * used to describe a Series instance.
         */
        seriesCollection: {
            getter: function()
            {
                return this._getSeriesCollection();
            },
            
            setter: function(val)
            {
                return this._setSeriesCollection(val);
            }
        },

        /**
         * All axes in a chart
         */
        axesCollection: {
            value: null
        },
        
        type: {
            value: "pie"
        },

        /**
         * Reference to graph instance
         * @type Graph 
         */
        graph: {},

        /**
         * Direction of chart's category axis when there is no series collection specified. Charts can
         * be horizontal or vertical. When the chart type is column, the chart is horizontal.
         * When the chart type is bar, the chart is vertical. 
         * @type String
         * @default Horizontal
         */
        direction: {
            getter: function()
            {
                var type = this.get("type");
                if(type == "bar")
                {   
                    return "vertical";
                }
                else if(type == "column")
                {
                    return "horizontal";
                }
                return this._direction;
            },

            setter: function(val)
            {
                this._direction = val;
            }
        },

        /**
         * Indicates whether or not to show a tooltip.
         */
        showTooltip: {
            value:true
        },

        /** 
         * The key value used for the chart's category axis. 
         * @default "category"
         * @type String
         */
        categoryKey: {
            value: "category"
        },
        
        /**
         * A collection of keys that map to the series axes. If no keys are set,
         * they will be generated automatically depending on the data structure passed into 
         * the chart.
         * @type Array
         */
        seriesKeys: {
            value: null    
        },

        categoryType:{
            value:"category"
        }
    }
});
function Chart(cfg)
{
    if(cfg.type != "pie")
    {
        return new Y.CartesianChart(cfg);
    }
    else
    {
        return new Y.PieChart(cfg);
    }
}
Y.Chart = Chart;


}, 'gallery-2010.11.17-21-32' ,{requires:['dom', 'datatype', 'event-custom', 'event-mouseenter', 'widget', 'widget-position', 'widget-stack']});
