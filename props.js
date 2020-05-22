/**
 * 渲染相关的默认配置参数
 * @type {{maxWidth: number, zIndex: number}}
 */
const renderProps = {
    maxWidth: 350,
    backgroundColor: '#333',
    fontColor: '#fff',
    zIndex: 9999
};

/**
 * 默认配置参数
 * @type {{duration: number[], delay: number, onShow(), ignoreAttributes: boolean, offset: number[], onHide(), placement: string, trigger: string, content: string, maxWidth: number, zIndex: number}}
 */
export const defaultProps = {
    content: '',
    delay: 0,
    duration: [300, 250],
    ignoreAttributes: false,
    offset: [0, 0],
    onHide(){},
    onShow(){},
    placement: 'top', // top, bottom, left, right
    ...renderProps
};

const defaultKeys = Object.keys(defaultProps);

/**
 * 获取元素属性data-tooltip-上所带的配置参数
 * @param reference
 * @param props
 */
export function evaluateProps(reference, props){
    return {
        ...props,
        ...(props.ignoreAttributes
            ? {}
            : getDataAttributeProps(reference))
    }
}

function getDataAttributeProps(reference){

    const props = defaultKeys.reduce((acc, key) =>{
        const valueAsString = (
            reference.getAttribute(`data-tooltip-${key}`) || ''
        ).trim();
        if(!valueAsString) {
            return acc;
        }
        if(key === 'content') {
            acc[key] = valueAsString;
        } else {


            try{
                acc[key] = JSON.parse(valueAsString);
            }catch(e){
                acc[key] = valueAsString;
            }
        }
        return acc;

    }, {});

    return props;
}
