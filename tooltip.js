import { getArrayOfElements, isElement, getBodyElement, getElementAbsolutePosition } from './dom-utils.js'
import { defaultProps, evaluateProps} from "./props.js";
import { normalizeToArray, splitBySpace, isIE } from "./utils.js";
const bodyElement = getBodyElement();

class TooltipClass {

    constructor(reference, passedProps) {
        this.id = ++TooltipClass.id;
        this.reference = reference;
        this.props = evaluateProps(reference, {
            ...defaultProps,
            ...passedProps
        });
        this.state = {
            isDisabled: false,
            // isVisible: false,
            isDestroyed: false,
            isMounted: false
        }
        this.listeners = []; // 监听器
        this.instanceWrapper; // tooltip容器
        this.tooltipBox; // tooltipBox盒子
        this.currentTarget = reference; // 事件目标对象(默认是tooltip实例元素)
        this.lastTriggerEvent = Event; //Event
        this.showTimeout; // 显示的定时器
        this.hideTimeout; // 隐藏的定时器
        this._addListeners(); // 监听事件
    }

    show() {
        if(this.state.isDestroyed || this.state.isDisabled){
            return;
        }
        if(this.props.onShow(this) === false) {
            return;
        }
        if (!this.state.isMounted) {
            this._mount();
        }
        this.instanceWrapper.style.zIndex = this.props.zIndex;

        setTimeout(() => {
            this.tooltipBox.style.opacity = 1;
        }, 0)
    }

    hide(){
        if(!this.state.isMounted || this.state.isDestroyed || this.state.isDisabled)  {
            return;
        }
        if(this.props.onHide(this) === false) {
            return;
        }
        const duration = this._getDuration(true);
        this.tooltipBox.style.transitionDuration = duration + 's';
        this.tooltipBox.style.opacity = 0;
        this.instanceWrapper.style.zIndex = -1;

    }

    destroy(){
        if(this.state.isDestroyed) {
            return;
        }
        this._clearDelayTimeouts();
        this._removeListeners();
        this._unmount();
        this.state.isDestroyed = true;
    }

    enable(){
        this.state.isDisabled = false;
    }

    disable(){
        this.hide();
        this.state.isDisabled = true;
    }

    /**
     * 删除body中实例tooltip的DOM节点
     * @private
     */
    _unmount(){
        bodyElement.removeChild(this.instanceWrapper)
        this.state.isMounted = false;
    }

    /**
     * 将tooltip DOM节点添加到body中
     * @private
     */
    _mount(){
        this.tooltipBox = this._prepareTooltipBox();
        this.instanceWrapper.appendChild(this.tooltipBox);
        bodyElement.appendChild(this.instanceWrapper);
        this.state.isMounted = true;
        this._handleStyle();
    }

    /**
     * 动态添加tooltip的DOM节点
     * @returns {HTMLDivElement}
     * @private
     */
    _prepareTooltipBox(){
        this.instanceWrapper = document.createElement('div');
        this.instanceWrapper.setAttribute('id', `tooltip-${this.id}`);
        // this.instanceWrapper.setAttribute(data-tooltip-root);
        let tooltipBox = document.createElement('div');
        tooltipBox.classList.add('tooltip-box');
        tooltipBox.style.maxWidth = this.props.maxWidth + 'px';
        tooltipBox.style.backgroundColor = this.props.backgroundColor;
        tooltipBox.style.color = this.props.fontColor;
        tooltipBox.setAttribute('data-placement', this.props.placement);


        tooltipBox.style.transitionProperty = "opacity";
        tooltipBox.style.opacity = 1;

        let tooltipContent = document.createElement('div');
        tooltipContent.classList.add('tooltip-content');
        tooltipContent.innerHTML = this.props.content;


        let tooltipArrow = document.createElement('div');
        tooltipArrow.classList.add('tooltip-arrow');
        tooltipArrow.style.color = this.props.backgroundColor;
        tooltipBox.appendChild(tooltipContent);
        tooltipBox.appendChild(tooltipArrow);
        return tooltipBox
    }

    /**
     * 设置Tooltip实例的位置
     * @private
     */
    _handleStyle(){
        const {x, y} = getElementAbsolutePosition(this.reference)
        this.instanceWrapper.style.position = 'absolute';
        this.instanceWrapper.style.top = 0;
        this.instanceWrapper.style.left = 0;

        let { posX, posY } = this._calcuPosition(x, y);

        this.instanceWrapper.style.transform = `translate3d(${posX}px, ${posY}px, 0)`;

        const duration = this._getDuration(true);
        this.tooltipBox.style.transitionDuration = duration + 's';
    }

    /**
     * 计算四个方位下，tooltip的x、y坐标
     * @param x
     * @param y
     * @returns {{posX: *, posY: number}|{posX: number, posY: *}|{posX: *, posY: *}}
     * @private
     */
    _calcuPosition(x, y){
        switch (this.props.placement) {
            case 'top':
                return {
                    posX: x + (this.reference.clientWidth/2 - this.tooltipBox.clientWidth/2) + this.props.offset[0],
                    posY: y - this.tooltipBox.clientHeight - 8 - this.props.offset[1]
                };
            case 'bottom':
                return {
                    posX: x + (this.reference.clientWidth/2 - this.tooltipBox.clientWidth/2) + this.props.offset[0],
                    posY: y + this.reference.clientHeight + 8 + this.props.offset[1]
                };
            case 'left':
                return {
                    posX: x - this.tooltipBox.clientWidth - 8 - this.props.offset[0],
                    posY: y + (this.reference.clientHeight/2 - this.tooltipBox.clientHeight/2) + this.props.offset[1]
                };
            case 'right':
                return {
                    posX: x + this.reference.clientWidth + 8 + this.props.offset[0] ,
                    posY: y + (this.reference.clientHeight/2 - this.tooltipBox.clientHeight/2) + this.props.offset[1]
                };
        }
    }

    _on(eventType, handler, options){
        const nodes = normalizeToArray(this.reference);
        nodes.forEach(node => {
            node.addEventListener(eventType, handler, options);
            this.listeners.push({node, eventType, handler, options});
        })
    }

    _addListeners() {
        // 添加事件监听器
        this._on('mouseenter', this._triggerHandle.bind(this));
        this._on('mouseleave', this._mouseLeaveHandle.bind(this));
    }

    _removeListeners(){
        // 移除事件监听器
        this.listeners.forEach(({node, eventType, handler, options}) => {
            node.removeEventListener(eventType, handler, options);
        });
        this.listeners = [];
    }

    /**
     * 鼠标进入时的事件处理程序
     * @param event
     * @private
     */
    _triggerHandle(event){
        if(this.state.isDisabled) {
            return;
        }
        this.lastTriggerEvent = event;
        this.currentTarget = event.currentTarget;
        this._scheduleShow();
    }

    /**
     * 鼠标离开时的事件处理程序
     * @param event
     * @private
     */
    _mouseLeaveHandle(event){
        this._scheduleHide();
    }


    /**
     * 显示tooltip实例前的准备工作
     * @private
     */
    _scheduleShow(){
        this._clearDelayTimeouts();
        let delay = this._getDelay(true);
        if(delay) {
            this.showTimeout = setTimeout(()=>{
                this.show();
            }, delay);

        } else {
            this.show();
        }
    }

    /**
     * 隐藏tooltip实例前的准备工作
     * @private
     */
    _scheduleHide(){
        this._clearDelayTimeouts();

        let delay = this._getDelay(false);
        if(delay) {
            this.hideTimeout = setTimeout(()=>{
                this.hide();
            }, delay);

        } else {
            this.hide();
        }

    }

    _getDelay(isShow) {
        const index = isShow ? 0 : 1;
        return Array.isArray(this.props.delay) ? this.props.delay[index] : this.props.delay;
    }

    _getDuration(isShow) {
        const index = isShow ?  0 : 1;
        return (Array.isArray(this.props.duration) ? this.props.duration[index] : this.props.duration) / 1000 ;
    }

    _clearDelayTimeouts(){
        clearTimeout(this.showTimeout)
        clearTimeout(this.hideTimeout)
    }
}

TooltipClass.id = 0;

export default function Tooltip(targets, optionalProps){
    const elements = getArrayOfElements(targets);
    const instances = elements.reduce((acc, reference)=>{
        const instance = reference && new TooltipClass(reference, optionalProps)
        if(instance) {
            acc.push(instance)
        }
        return acc;
    }, []);
    return instances;
}
