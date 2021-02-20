/**
 * 树形选择器组件
 *
 * @class TreeBox2
 * @file "treebox2.js"
 * @requires Jquery.js
 * @author Gping123 iguoping@qq.com
 * @date 2021/02/03
 */


class TreeBox {

    /**
     * 选择器
     */
    selector = '';

    /**
     * 数据
     */
    data = [];

    /**
     * 主键名称
     */
    pkName = 'id';

    /**
     * 标题名称
     */
    titleName = 'title';

    /**
     * 选中部分数据
     */
    selected = new Set([]);

    /**
     * ID 关系映射
     */
    mapIdObj = {};

    /**
     * 组件值对象
     */
    value = {};

    /**
     * 是否启用搜索工具
     */
    showLabels = true;

    /**
     * 统一上下级关系字段
     */
    parentIdField = 'parent_id';

    /**
     * 选择事件回调
     */
    eventCallBack = undefined;

    /**
     * 是否上下级联动
     */
    isLinkage = true;

    /**
     * 一些默认类选择器名称
     */
    _Class = 'tree-box';
    _HeaderClass = 'tree-box-header';
    _ToolClass = 'tree-box-tools';
    _SearchInputClass = 'tree-box-search';
    _ClearBtnClass = ['tree-box-btn','tree-box-clear-all'];
    _SelectAllClass = ['tree-box-btn','tree-box-select-all'];
    _LabelClass = 'tree-box-labels';
    _ContainerClass = 'tree-box-container';

    /**
     * 复选框前缀
     */
    _CheckBoxIdPrefix = 'treebox_';


    /**
     * 构造方法
     *
     * @param {String} selector
     * @param {Array} data
     * @param {Array} selected
     */
    constructor(selector, data, selected = [], dataType = 'parent_id', titleName = 'name', pkName = 'id', showLabels = false, isLinkage = true, eventCallBack = undefined) {

        this.selector = selector;

        this.showLabels = showLabels;

        this.pkName = pkName;

        this.titleName = titleName;

        this.eventCallBack = eventCallBack;

        this.isLinkage = isLinkage;

        this.initData(data, pkName, dataType);

        this.render(pkName, titleName);

        this.setDefaultSelected(selected);

    }

    /**
     * 初始化数据结构
     *
     * @param {Array} data
     */
    initData(data, pkName, dataType) {

        const oldThis = this;

        if (!data || data.length == 0) {
            oldThis.data = [];
        }

        // 判断数据格式是哪种
        if (dataType == 'parent_id') {

            oldThis.data = oldThis.formatDataByParentId(data, dataType, pkName);
            return ;
        }

        oldThis.data = oldThis.formatDataByChildren(data, 0, pkName, dataType);
        return ;

    }

    /**
     * 格式化数据结构[children]
     *
     * @param {Array} data
     * @param {Integer|String} parendId
     * @param {String} pkName
     * @param {String} dataType
     */
    formatDataByChildren(data, parendId = 0, pkName = 'id', dataType = 'children') {
        let _data = {};

        for(let key in data) {
            let d = data[key];
            d[this.parentIdField] = parendId;

            if (typeof(_data[d[this.parentIdField]]) != 'object') {
                _data[d[this.parentIdField]] = [d];
                this.mapIdObj[d.parent_id] = [d[pkName]];
            } else {
                _data[d[this.parentIdField]].push(d);
                this.mapIdObj[d.parent_id].push(d[pkName]);
            }

            if (d.hasOwnProperty(dataType)) {
                let __data = this.formatDataByChildren(d[dataType], d[pkName], pkName, dataType);

                _data = Object.assign(_data, __data);
            }

        }

        return _data;
    }

    /**
     * 格式化ParentId类型数据
     *
     * @param {Array|Object} data
     * @param {String} dataType
     */
    formatDataByParentId(data, dataType, pkName) {
        let _data = {};

        for(let i in data){
            let d = data[i];
            if(!d.hasOwnProperty(this.parentIdField)){
                d[this.parentIdField] = "0";
            }

            let parentId = d[this.parentIdField];
            if(typeof(_data[parentId]) != 'object'){
                _data[parentId] = [d];
                this.mapIdObj[parentId] = [d.id];
            }else{
                _data[parentId].push(d);
                this.mapIdObj[parentId].push(d.id);
            }
        }

        return _data;
    }

    /**
     * 渲染方法
     *
     */
    render(pkName, titleName) {

        this.renderHtml(pkName, titleName);

        this.showDefaultLavel2Dom();

        this.listenEvent();

    }

    /**
     * 渲染基础HTML
     */
    renderHtml(pkName, titleName) {

        $(this.selector).addClass(this._Class).html(`
        <div class="${this._HeaderClass}">
            <div class="${this._LabelClass}"></div>
            <div class="${this._ToolClass}"></div>
        </div>
        <div class="${this._ContainerClass}"></div>
        `);

        this.renderTools();

        this.renderContainer(this.data, pkName, titleName);

    }

    /**
     * 渲染搜索栏
     */
    renderTools() {
        let html = `<div>
            <input type="text" class="${this._SearchInputClass}" placeholder="搜索关键字...">
            <span>
                <button type="button" class="${this._SelectAllClass.join(' ')}">全选</button>
            </span>
            <span>
                <button type="button" class="${this._ClearBtnClass.join(' ')}">清空</button>
            </span>
        </div>`;

        $(this.selector + ' .' + this._HeaderClass + ' .' + this._ToolClass).html(html);
    }

    /**
     * 渲染选择
     */
    renderSelected(pid = null) {
        const oldThis = this;
        let data = pid || this.selected;

        if (pid == null) {
            $(this.selector + ' input[type="checkbox"]').prop('checked', false);
        }

        // 渲染选择状态
        data.forEach((v) => {
            $(oldThis.selector + ' [value="' + v + '"]').prop('checked', true);
            this.isLinkage && oldThis.mapIdObj.hasOwnProperty(v) && oldThis.renderSelected(oldThis.mapIdObj[v]);
        });

        if (oldThis.showLabels) {
            // 渲染头部显示
            $(this.selector + ' .' + oldThis._LabelClass).html('');
            for (let i in oldThis.value) {
                oldThis.addHeaderLabelItem(i);
            }
        }

        // 如果存在回调，就回调函数
        if (oldThis.eventCallBack) {
            oldThis.eventCallBack(oldThis.getValue(), oldThis.getSelected());
        }
    }

    /**
     * 添加头部标签显示
     * @param id
     */
    addHeaderLabelItem(id) {
        let text = this.getText(id);
        let html = `<div class="tree-box-label" value='${id}'> ${text} <span class="close" title="取消">✖</span></div>`;
        $(this.selector + ' .' + this._HeaderClass + ' .' + this._LabelClass).append(html);

        // 标签关闭事件
        this.listenCloseLabelEvent();
    }

    /**
     * 渲染容器内容
     *
     * @param {*} data
     * @param {String} pkName
     * @param {String} titleName
     */
    renderContainer(data, pkName, titleName, displayName = null) {
        if (!displayName) {
            displayName = titleName;
        }
        let html = '';
        let isHasData = false;
        for(let parendId in data){
            // 按组渲染
            let list = data[parendId];
            let html_list = "";

            for(let j in list){
                let item = list[j];

                // 默认选择项
                let checked = '';
                if(this.selected && $.inArray(item[pkName] , this.selected) != -1){
                    checked = " checked='checked'";
                }else{
                    checked = "";
                    try{
                        if(item.selected){
                            checked = " checked='checked'";
                        }
                    }catch(err){}
                }

                // 设置 class
                let _class = "";
                if(typeof(this.data[item[pkName]]) == 'object'){
                    _class += " children";
                }

                try{
                    if(item.is_hidden){
                        _class += " hide2";
                    }
                }catch(err){}

                if(_class){
                    _class = " class='"+_class+"'";
                }

                // 设置复选框ID
                let id = this._CheckBoxIdPrefix + item[pkName] ;
                let box = "<input "+checked+" type='checkbox' id='"+ id +"' name='"+ item[titleName] +"' value='"+ item[pkName] +"' />";

                try{
                    // 判断是否显示复选框
                    if(item.no_box){
                        box = '';
                    }
                }catch(err){}

                html_list += "<li "+_class+" v="+item[pkName]+" title='"+item[titleName]+"'><em>"+box+"</em><div class='label-panel'>"+item[displayName]+"</div><span></span></li>";
                isHasData = true;
            }

            let _class = 'box';
            if(parendId === '0'){
                _class += " root";
            }else{
                _class += " hide";
            }

            _class = " class='" + _class + "'";

            html += "<div parent_id=" + parendId + _class + "><ul>" + html_list + "</ul></div>";
        }

        if(isHasData) {
            $(this.selector + ' .' + this._ContainerClass + ' .not-data').remove();
            $(this.selector + ' .' + this._ContainerClass).html(html);
        } else {
            $(this.selector + ' .' + this._ContainerClass).html('<div class="not-data">暂无数据</div>');
        }
    }

    /**
     * 组件所有事件监听
     */
    listenEvent() {

        this.listenRowEvent();

        this.listenSelectedEvent();

        this.listenClearEvent();

        this.listenSelectAllEvent();

        this.listenSearchEvent();

        this.listenLiClickEvent();

    }

    /**
     * 行点击事件
     */
    listenLiClickEvent() {
        const oldThis = this;

        $(this.selector + ' ul li').on('click' ,  function(e){
            let childrenCheckbox = $(this).find('input[type="checkbox"]');
            let id = $(this).attr('v');
            let status = childrenCheckbox.is(':checked');
            childrenCheckbox.prop('checked', !status);
            oldThis.setSelected(id, !status);
        });
    }

    /**
     * 监听行事件
     *      展开|显示某部分
     */
    listenRowEvent() {
        const oldThis = this;

        $(this.selector + ' .children').on('click' ,  function(e){

            oldThis.showChildren(this);

            // 实现自动滚动到最右边
            // let _selector = oldThis.selector + ' .' + oldThis._ContainerClass;
            // $(_selector).scrollLeft($(_selector)[0].scrollLeft);
            // console.log($(_selector)[0].scrollLeft);

        });
    }

    /**
     * 显示节点
     * @param that
     */
    showChildren(that) {

        var li = $(that);
        li.parent().find('.cur').removeClass('cur');
        li.addClass('cur');

        var id = li.attr('v');
        var col = li.parent().parent().attr('col');
        if(!col){
            col = 0;
        }
        var _col = col;
        while(1){
            _col++;
            var o = $(this.selector + " div[col=" + _col + "]");
            if(o.size()>0){
                o.hide();
            }else{
                break;
            }
        }
        $(this.selector + " div[parent_id="+ id +"]").attr('col' , col*1+1).removeClass('hide').show();

    }

    /**
     * 监听选择事件
     */
    listenSelectedEvent() {
        const oldThis = this;

        $(this.selector + ' input[type="checkbox"]').click(function(e){

            let id = $(this).parents('li').attr('v');
            let status = $(this).is(':checked');

            oldThis.setSelected(id, status);
            e.stopPropagation();
        });
    }

    /**
     * 设置选中状态
     *
     * @param {*} id
     * @param {Boolean} status
     */
    setSelected(id, status) {

        // 计算选择状态
        this.calcSelectStatus(id, status, true, true);

        // 渲染选择状态
        this.renderSelected();
    }

    /**
     * 监听label关闭事件
     */
    listenCloseLabelEvent() {
        const oldThis = this;

        $(this.selector+ ' .close').on('click', function () {
            let id = $(this).parents('.tree-box-label').attr('value');
            oldThis.calcSelectStatus(id, false, true, true);
            oldThis.renderSelected();
        });
    }

    /**
     * 监听清除所有事件
     */
    listenClearEvent() {
        const oldThis = this;
        let _selector = this.selector+ ' .' + this._HeaderClass + ' .' + this._ToolClass + ' .' + this._ClearBtnClass.join('.');
        $(_selector).on('click', function () {
             oldThis.selected = new Set([]);
             oldThis.value = {};
             oldThis.renderSelected();
        });
    }

    /**
     * 默认展开二级
     */
    showDefaultLavel2Dom(){
        let l2ID = $(this.selector + ' .root .children:first-child').attr('v');
        $(this.selector + ' .box[parent_id="'+l2ID+'"]').attr('col', 1).removeClass('hide');
    }

    /**
     * 全选事件
     */
    listenSelectAllEvent() {
        const oldThis = this;
        let _selector = this.selector + ' .' + this._HeaderClass + ' .' + this._ToolClass + ' .' + this._SelectAllClass.join('.');
        $(_selector).on('click', function() {
            if(oldThis.isLinkage){
                oldThis.data['0'].forEach(function (v, i) {
                    oldThis.setValue(v[oldThis.pkName], v[oldThis.titleName]);
                });
            } else {
                for (let key in oldThis.data){
                    let list = oldThis.data[key];
                    for(let k in list) {
                        oldThis.setValue(list[k][oldThis.pkName], list[k][oldThis.titleName]);
                    }
                }
            }

            oldThis.renderSelected();
        });
    }

    /**
     * 搜索功能事件
     */
    listenSearchEvent() {
        const oldThis = this;

        let _selector = this.selector + ' .' + this._HeaderClass + ' .' + this._ToolClass + ' .' + this._SearchInputClass;
        $(_selector).on('input', function() {
            let val = $(this).val().trim();
            let displayName = oldThis.titleName;
            if (val.length == 0) {
                oldThis.renderContainer(oldThis.data, oldThis.pkName, oldThis.titleName, displayName);
            } else {
                let tmpData = {0:[]};
                for(let i in oldThis.data) {
                    let list = oldThis.data[i];
                    list.forEach((item, index) => {
                        if (item[oldThis.titleName].indexOf(val) != -1) {
                            displayName = 'displayName';
                            item[displayName] = oldThis.getAbxText(item[oldThis.pkName]);
                            tmpData[0].push(item);
                            // 如果有下级，就显示下级所有列表
                            if(oldThis.data.hasOwnProperty(item[oldThis.pkName])) {
                                let childrens = oldThis.data[item[oldThis.pkName]];
                                for(let cindex in childrens) {
                                    childrens[cindex][displayName] = item[displayName] + ' / ' + childrens[cindex][oldThis.titleName];
                                    tmpData[0].push(childrens[cindex]);
                                }
                            }

                        }
                    });
                }
                oldThis.renderContainer(tmpData, oldThis.pkName, oldThis.titleName, displayName);
            }

            oldThis.renderSelected();
            oldThis.listenRowEvent();
            oldThis.listenSelectedEvent();
            oldThis.listenClearEvent();
            oldThis.listenSelectAllEvent();
        });
    }

    /**
     * 设置默认选择值
     *
     * @param selected
     */
    setDefaultSelected(selected) {
        if (!(selected instanceof Array)) {
            selected = [selected];
        }

        if (selected.length == 0) {
            return ;
        }

        // 默认值
        this.selected = new Set([]);
        this.value = {};
        selected.forEach((id) => {
            this.setValue(id, true);
        });

        this.renderSelected();
    }

    /**
     * 计算选择状态
     *
     * @param id
     * @param status
     * @param calcSubset
     * @param calcParent
     */
    calcSelectStatus(id, status, calcSubset, calcParent) {
        if (id == 0) {
            return ;
        }

        if (!this.isLinkage) {
            this.setValue(id, status);
            return false;
        }

        let parentId = this.getParentId(id);
        let oldThis = this;

        // 同级计算
        if (calcParent && this.mapIdObj.hasOwnProperty(parentId)) {
            if (status) {

                /**
                 * 算法：
                 *      1、设置当前元素的选择状态
                 *      2、判断当前元素的同级所有元素是否全部已选
                 *      3、如果没全选，则直接跳过
                 *      4、如果已经选，则设置父级元素选择状态并且删除所有存在在this.selected中的当前同级所有元素
                 *      5、递归父级选择状态
                 */
                this.setValue(id, status);

                // 取消所有子集的选择状态
                if (calcSubset && this.mapIdObj.hasOwnProperty(id)) {
                    this.calcSelectStatus(id, status, true, false);
                }

                // 如果全选了
                if (parentId != 0 && this.contain(this.mapIdObj[parentId])) {
                    this.setValue(parentId, status);

                    // 清除子集选中状态
                    this.calcSelectStatus(parentId, status, true, false);

                    // 所有父级操作
                    this.calcSelectStatus(parentId, status, false, true);
                }
            } else {

                /**
                 *  算法：
                 *      1、如果当前元素存在于this.selected中，直接取消选择状态
                 *      2、不存在，则
                 *          2.1 查询当前元素最顶级并且已选状态的元素ID 并且ID值是非0
                 *          2.2 取消（1）元素的选择状态
                 *          2.3 保持非直接顶级元素的选择状态
                 *          2.4 保存当前元素级别的其它元素（非本身）选择状态
                 */
                if (this.contain(id)) {
                    this.setValue(id, status);
                } else {
                    // 找出离当前点击元素最近的低级选择元素
                    let ids = this.getSelectedParentIds(id);

                    this.setValue(this.getTopSelectedParentId(id), status);

                    ids.forEach((supperId) => {
                        if (this.mapIdObj.hasOwnProperty(supperId)) {
                            this.mapIdObj[supperId].forEach((tmpId) => {
                                if (
                                    !ids.includes(tmpId)
                                ) {
                                    oldThis.setValue(tmpId, !status);
                                }
                            });
                        }
                    });

                    // 设置当前级别除了当前元素外的所有元素
                    this.mapIdObj[parentId].forEach((tmpId) => {
                        if (id != tmpId) {
                            oldThis.setValue(tmpId, !status);
                        } else {
                            this.setValue(tmpId, status);
                        }
                    });
                }
            }

        }

        // 子集计算
        if (calcSubset && this.mapIdObj.hasOwnProperty(id)) {
            if (status) {
                this.mapIdObj[id].forEach((tmpId) => {

                    oldThis.setValue(tmpId, !status);

                    // 递归取消所有
                    oldThis.calcSelectStatus(tmpId, status, true, false);
                });
            }
        }

    }

    /**
     * 获取指定ID选中状态
     *
     * @param id
     * @returns {boolean}
     */
    getIdSelectStatus(id) {
        return $(this.selector + ' input[type="checkbox"][value="'+id+'"]').is(':checked');
    }

    /**
     * 获取父节点ID
     *
     * @param id
     * @returns {string|number}
     */
    getParentId(id) {
        return $(this.selector+ ' [v="'+id+'"]').parents('.box').attr('parent_id');
    }

    /**
     * 设置选择值
     *
     * @param id
     * @param status
     */
    setValue(id, status) {

        if ($.isNumeric(id)) {
            id = parseInt(id);
        }

        if (status) {
            // 设置选择状态
            let text = this.getText(id);
            // 如果找不到 就不添加
            if(!text) {
                return ;
            }
            this.value[id] = text;
            this.selected.add(id);
        } else {
            this.selected.delete(id);
            delete this.value[id];
        }
    }

    /**
     * 获取所有已经选择的直接父级ID列表
     *
     * @param id
     * @return Array
     */
    getSelectedParentIds(id) {
        let Ids = [];
        let parentId = id;
        while ((parentId = this.getParentId(id)) && this.getIdSelectStatus(parentId)) {
            id = parentId;
            Ids.unshift(parentId);
        }

        return Ids;
    }

    /**
     * 获取绝对标签
     *
     * @param {String|Number} id
     * @param {String} separate
     */
    getAbxText(id, separate = ' / ') {
        let title = '';

        if (id == 0 || id == '0') {
            return title;
        }

        let pid = 0;
        let nowTitle = '';

        for( let index in this.mapIdObj) {
            let list = this.mapIdObj[index];

            if (list.includes(id)) {
                pid = index;

                for( let key in this.data) {
                    let v = this.data[key];
                    for( let i in v) {
                        let item = v[i];
                        if (item[this.pkName] == id) {
                            nowTitle = item[this.titleName];
                        }
                    }
                }

                break;
            }
        }

        // 递归获取父级
        title = this.getAbxText(pid, separate);

        return (title + separate + nowTitle).replace(/^ \//g, "");
    }

    /**
     * 获取id的text
     *
     * @param id
     * @returns {string|null}
     */
    getText(id) {
        return $(this.selector+ ' li[v="'+id+'"]').attr('title');
    }

    /**
     * 已经选择包含判断
     *
     * @param subset
     * @returns {boolean|*}
     */
    contain(subset) {
        if (typeof(subset) == 'array' || typeof(subset) == 'set' || typeof(subset) == 'object') {

            var status = true;
            subset.forEach((v) => {
                if (!this.contain(v)) {
                    return status = false;
                }
            });

            return status;
        }

        if ($.isNumeric(subset)) {
            subset = parseInt(subset);
        }

        return this.selected.has(subset);
    }

    /**
     * 获取最顶级已选的父级ID
     *
     * @param id
     * @returns {*}
     */
    getTopSelectedParentId(id) {
        let parentId = id;
        while ((parentId = this.getParentId(id)) && this.getIdSelectStatus(parentId)) {
            id = parentId;
        }

        return id;
    }

    /**
     * 获取value
     */
    getValue() {
        return this.value;
    }

    /**
     * 获取已选值
     */
    getSelected() {
        return this.selected;
    }

}
