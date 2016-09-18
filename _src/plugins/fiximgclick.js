///import core
///commands 修复chrome下图片不能点击的问题，出现八个角可改变大小
///commandsName  FixImgClick
///commandsTitle  修复chrome下图片不能点击的问题，出现八个角可改变大小
//修复chrome下图片不能点击的问题，出现八个角可改变大小

UE.plugins['fiximgclick'] = (function () {

    var elementUpdated = false;
    function Scale() {
        this.editor = null;
        this.resizer = null;
        this.cover = null;
        this.doc = document;
        this.prePos = {x: 0, y: 0};
        this.startPos = {x: 0, y: 0};
    }

    (function () {
        var rect = [
            //[left, top, width, height]
            [0, 0, -1, -1],
            [0, 0, 0, -1],
            [0, 0, 1, -1],
            [0, 0, -1, 0],
            [0, 0, 1, 0],
            [0, 0, -1, 1],
            [0, 0, 0, 1],
            [0, 0, 1, 1]
        ];

        Scale.prototype = {
            init: function (editor) {
                var me = this;
                me.editor = editor;
                me.startPos = this.prePos = {x: 0, y: 0};
                me.dragId = -1;

                var hands = [],
                    resizer = me.resizer = document.createElement('div');

                // for (i = 0; i < 8; i++) {
                //     // hands.push('<span class="edui-editor-imagescale-hand' + i + '"></span>');
                // }
                //
                hands.push('<div class="edui-scale-toolbar">' +
                    '<a href="javascript:;" class="edui-scale-item" data-type="0">原始大小</a>' +
                    '<a href="javascript:;" class="edui-scale-item" data-type="1" id="J_scaleBigger">放大</a>' +
                    '<a href="javascript:;" class="edui-scale-item" data-type="2">缩小</a>' +
                    '<a href="javascript:;" class="edui-scale-item" data-type="3">删除</a>' +
                    '<a href="javascript:;" class="edui-scale-item" data-type="4">关闭</a>' +
                    '</div>' );
                resizer.id = me.editor.ui.id + '_imagescale';
                resizer.className = 'edui-editor-imagescale';
                resizer.innerHTML = hands.join('');
                resizer.style.cssText += ';display:none;border:1px solid #3b77ff;z-index:' + (me.editor.options.zIndex) + ';';

                me.editor.ui.getDom().appendChild(resizer);

                me.initStyle();
                me.initEvents();
            },
            initStyle: function () {
                utils.cssRule('imagescale', '.edui-editor-imagescale{display:none;position:absolute;border:1px solid #38B2CE;cursor:hand;-webkit-box-sizing: content-box;-moz-box-sizing: content-box;box-sizing: content-box;}' +
                    '.edui-editor-imagescale span{position:absolute;width:6px;height:6px;overflow:hidden;font-size:0px;display:block;background-color:#3C9DD0;}'
                    + '.edui-editor-imagescale .edui-editor-imagescale-hand0{cursor:nw-resize;top:0;margin-top:-4px;left:0;margin-left:-4px;}'
                    + '.edui-editor-imagescale .edui-editor-imagescale-hand1{cursor:n-resize;top:0;margin-top:-4px;left:50%;margin-left:-4px;}'
                    + '.edui-editor-imagescale .edui-editor-imagescale-hand2{cursor:ne-resize;top:0;margin-top:-4px;left:100%;margin-left:-3px;}'
                    + '.edui-editor-imagescale .edui-editor-imagescale-hand3{cursor:w-resize;top:50%;margin-top:-4px;left:0;margin-left:-4px;}'
                    + '.edui-editor-imagescale .edui-editor-imagescale-hand4{cursor:e-resize;top:50%;margin-top:-4px;left:100%;margin-left:-3px;}'
                    + '.edui-editor-imagescale .edui-editor-imagescale-hand5{cursor:sw-resize;top:100%;margin-top:-3px;left:0;margin-left:-4px;}'
                    + '.edui-editor-imagescale .edui-editor-imagescale-hand6{cursor:s-resize;top:100%;margin-top:-3px;left:50%;margin-left:-4px;}'
                    + '.edui-editor-imagescale .edui-editor-imagescale-hand7{cursor:se-resize;top:100%;margin-top:-3px;left:100%;margin-left:-3px;}'
                    + '.edui-scale-toolbar{width: 200px; height: 30px; position: absolute; top: 0; background-color: rgba(255,255,255,0.85);}'
                    + '.edui-scale-item{display: inlink-block; float: left; margin: 0 5px; font-size: 12px; line-height: 30px; color: #7eaed9; text-decoration:none;}'
                    + '.edui-scale-item:hover{color: #0a5296;}'
                    + '.edui-scale-disabled{color: #999999; cursor: default;}'
                    + '.edui-scale-disabled:hover{color: #999999; cursor: default;}');
            },
            initEvents: function () {
                var me = this;

                me.startPos.x = me.startPos.y = 0;
                me.isDraging = false;
            },

            updateTargetElement: function () {
                var me = this;
                domUtils.setStyles(me.target, {
                    'width': me.resizer.style.width,
                    'height': me.resizer.style.height
                });
                me.target.width = parseInt(me.resizer.style.width);
                me.target.height = parseInt(me.resizer.style.height);
                me.attachTo(me.target);
            },
            updateContainerStyle: function (dir, offset) {
                var me = this,
                    dom = me.resizer, tmp;

                if (rect[dir][0] != 0) {
                    tmp = parseInt(dom.style.left) + offset.x;
                    dom.style.left = me._validScaledProp('left', tmp) + 'px';
                }
                if (rect[dir][1] != 0) {
                    tmp = parseInt(dom.style.top) + offset.y;
                    dom.style.top = me._validScaledProp('top', tmp) + 'px';
                }
                if (rect[dir][2] != 0) {
                    tmp = dom.clientWidth + rect[dir][2] * offset.x;
                    dom.style.width = me._validScaledProp('width', tmp) + 'px';
                }
                if (rect[dir][3] != 0) {
                    tmp = dom.clientHeight + rect[dir][3] * offset.y;
                    dom.style.height = me._validScaledProp('height', tmp) + 'px';
                }
            },
            _validScaledProp: function (prop, value) {
                var ele = this.resizer,
                    wrap = document;

                value = isNaN(value) ? 0 : value;
                switch (prop) {
                    case 'left':
                        return value < 0 ? 0 : (value + ele.clientWidth) > wrap.clientWidth ? wrap.clientWidth - ele.clientWidth : value;
                    case 'top':
                        return value < 0 ? 0 : (value + ele.clientHeight) > wrap.clientHeight ? wrap.clientHeight - ele.clientHeight : value;
                    case 'width':
                        return value <= 0 ? 1 : (value + ele.offsetLeft) > wrap.clientWidth ? wrap.clientWidth - ele.offsetLeft : value;
                    case 'height':
                        return value <= 0 ? 1 : (value + ele.offsetTop) > wrap.clientHeight ? wrap.clientHeight - ele.offsetTop : value;
                }
            },

            ScaleClick: function(e){
                var me = window.globalValueScale;
                e.stopPropagation();
                var hand = e.target || e.srcElement, hand;
                var targetType = hand.getAttribute("data-type");
                if(targetType){
                    me.changeTargetElement(e,targetType);
                }
            },

            changeTargetElement:function(e, type){
                var me = this;
                var $target = me.target;
                var height = $target.height;
                var width = $target.width;
                switch (type){
                    case "0":
                        me.resetTargetElement($target, height, width);
                        break;
                    case "1":
                        var wrapWidth = me.editor.body.offsetWidth;
                        if(wrapWidth <= width * 1.1 ){
                            var delat = wrapWidth - width;
                            var x = delat;
                            var y = delat / wrapWidth * height
                            me.updateContainerStyle(7, {x: x, y: y});
                            me.updateTargetElement();
                            return;
                        }
                        me.updateContainerStyle(7, {x: width * 0.1 , y: height * 0.1});
                        me.updateTargetElement();
                        break;
                    case "2":
                        me.updateContainerStyle(7, {x: -width * 0.1, y: -height * 0.1});
                        me.updateTargetElement();
                        break;
                    case "3":
                        $target.parentNode.removeChild($target);
                        me.hide();
                        break;
                    case "4":
                        me.hide();
                        break;
                    default:
                        break;
                }
            },

            resetTargetElement: function($target, height, width){
                var me = this;
                var naturalSize = [me.target.naturalWidth, me.target.naturalHeight];

                me.updateContainerStyle(7, {x: naturalSize[0] - width, y: naturalSize[1] - height});
                me.updateTargetElement();
            },

            show: function (targetObj) {
                var me = this;
                me.resizer.style.display = 'block';
                if(targetObj) me.attachTo(targetObj);
                window.globalValueScale = me;

                me.bind(me.resizer, "click", me.ScaleClick)

                me.editor.fireEvent('afterscaleshow', me);
                me.editor.fireEvent('saveScene');
            },
            hide: function () {
                var me = this;
                me.resizer.style.display = 'none';

                me.unbind(me.resizer, "click", me.ScaleClick)
                me.editor.fireEvent('afterscalehide', me);

            },

            bind: function(target, type, func) {
                if (target.addEventListener) {// 非ie 和ie9
                    target.addEventListener(type, func, false);
                } else if (target.attachEvent) { // ie6到ie8
                    target.attachEvent("on" + type, func);
                } else {
                    target["on" + type] = func; // ie5
                }
            },

            unbind:function(target, type, func) {
                if (target.removeEventListener) {
                    target.removeEventListener(type, func, false);
                } else if (target.detachEvent) {
                    target.detachEvent("on" + type, func);
                } else {
                    target["on" + type] = null;
                }
            },

            proxy: function( fn, context ) {
                return function(e) {
                    return fn.apply( context || this, arguments);
                };
            },
            attachTo: function (targetObj) {
                var me = this,
                    target = me.target = targetObj,
                    resizer = this.resizer,
                    imgPos = domUtils.getXY(target),
                    iframePos = domUtils.getXY(me.editor.iframe),
                    editorPos = domUtils.getXY(resizer.parentNode);

                domUtils.setStyles(resizer, {
                    'width': target.width + 'px',
                    'height': target.height + 'px',
                    'left': iframePos.x + imgPos.x - me.editor.document.body.scrollLeft - editorPos.x - parseInt(resizer.style.borderLeftWidth) + 'px',
                    'top': iframePos.y + imgPos.y - me.editor.document.body.scrollTop - editorPos.y - parseInt(resizer.style.borderTopWidth) + 'px'
                });
            }
        }
    })();

    return function () {
        var me = this,
            imageScale;

        me.setOpt('imageScaleEnabled', true);

        if (me.options.imageScaleEnabled) {
            me.addListener('click', function (type, e) {

                var range = me.selection.getRange(),
                    img = range.getClosedNode(),
                    target = e.target;

                if (img && img.tagName == 'IMG' && e.target.tagName == 'IMG' && me.body.contentEditable!="false") {

                    if (img.className.indexOf("edui-faked-music") != -1 ||
                        img.getAttribute("anchorname") ||
                        domUtils.hasClass(img, 'loadingclass') ||
                        domUtils.hasClass(img, 'loaderrorclass')) { return }
                    if (!imageScale) {
                        imageScale = new Scale();
                        imageScale.init(me);

                        me.ui.getDom().appendChild(imageScale.resizer);

                        var _keyDownHandler = function (e) {
                            imageScale.hide();
                            if(imageScale.target) me.selection.getRange().selectNode(imageScale.target).select();
                        }, _mouseDownHandler = function (e) {
                            var ele = e.target || e.srcElement;

                            if (ele && (ele.className===undefined || ele.className.indexOf('edui-editor-imagescale') == -1)) {
                                _keyDownHandler(e);
                            }
                        };
                        me.removeListener('afterscaleshow');
                        me.removeListener('afterscalehide');
                        me.addListener('afterscaleshow', function (e) {
                            me.addListener('beforekeydown', _keyDownHandler);
                            me.addListener('beforemousedown', _mouseDownHandler);
                            domUtils.on(document, 'keydown', _keyDownHandler);
                            domUtils.on(document,'click', _mouseDownHandler);
                            if(!browser.ie9below){
                                me.selection.getNative().removeAllRanges();
                            }else{
                                document.selection.empty();
                            }

                        });
                        me.addListener('afterscalehide', function (e) {
                            me.removeListener('beforekeydown', _keyDownHandler);
                            me.removeListener('beforemousedown', _mouseDownHandler);
                            domUtils.un(document, 'keydown', _keyDownHandler);
                            domUtils.un(document,'click', _mouseDownHandler);

                        });
                        // TODO 有iframe的情况，mousedown不能往下传。。
                        domUtils.on(imageScale.resizer, 'click', function (e) {
                            var ele = e.target || e.srcElement;
                            if (ele && ele.className.indexOf('edui-editor-imagescale-hand') == -1) {
                                if(imageScale.target) me.selection.getRange().selectNode(ele).select();
                            }
                        });

                    }
                    imageScale.show(img);
                } else {
                    if (imageScale && imageScale.resizer.style.display != 'none') imageScale.hide();
                }
            });
        }

        if (browser.webkit) {
            me.addListener('click', function (type, e) {
                if (e.target.tagName == 'IMG' && me.body.contentEditable!="false") {
                    var range = new dom.Range(me.document);
                    range.selectNode(e.target).select();
                }
            });
        }
    }
})();
