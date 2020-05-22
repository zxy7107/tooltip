export function isType(value, type){
    const str = {}.toString.call(value);
    return str.indexOf('[object') === 0 && str.indexOf(`${type}`) > -1;

}

export function normalizeToArray(value){
    return [].concat(value);
}

export function splitBySpace(value){
    return value.split(/\s+/).filter(Boolean);
}

export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
const ua = isBrowser ? navigator.userAgent : '';
export const isIE = /MSIE|Trident\//.test(ua);

export function getValueAtIndexOrReturn(value, index){
    if(Array.isArray(value)){
        return value[index];
    }
    return value;
}
