import { isType } from "./utils.js";

export function isElement(value){
    return ['Element', 'Fragment'].some((type)=> isType(value, type));
}

export function isNodeList(value) {
    return isType(value, 'NodeList');
}

export function getArrayOfElements(value){
    if(isElement(value)) {
        return [value];
    }

    if(Array.isArray(value)) {
        return value;
    }
    if(isNodeList(value)){
        return Array.from(value)
    }

    return Array.from(document.querySelectorAll(value));
}
export function getBodyElement(){
    return document.querySelector('body');
}

export function getElementAbsolutePosition(element){
    let x = element.getBoundingClientRect().left + document.documentElement.scrollLeft;
    let y = element.getBoundingClientRect().top + document.documentElement.scrollTop;
    return {
        x,
        y
    }
}
