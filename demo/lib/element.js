var _ = require('./util')


// //通过VElement，可以很简单地用js对象表示dom结构，参数分别为标签名，属性对象，子dom列表
function Element(tagName, props, children) {
  if (!(this instanceof Element)) {
    //保证只能通过如下方式调用： new Element
    if (!_.isArray(children) && children != null) {
      children = _.slice(arguments, 2).filter(_.truthy)
    }
    return new Element(tagName, props, children)
  }
  //可以通过只传递tagName和children参数
  if (_.isArray(props)) {
    children = props
    props = {}
  }
  //设置虚拟DOM的相关属性
  this.tagName = tagName
  this.props = props || {}
  this.children = children || []
  this.key = props
    ? props.key
    : void 666

  var count = 0

  _.each(this.children, function (child, i) {
    if (child instanceof Element) {
      count += child.count
    } else {
      children[i] = '' + child
    }
    count++
  })

  this.count = count
}

/**
 * 构建真实dom树(根据dom节点的属性和子节点递归地构建初真实的dom树)
 */
Element.prototype.render = function () {
  var el = document.createElement(this.tagName) // 根据tagName创建标签
  var props = this.props //设置标签的属性

  for (var propName in props) { // 设置节点的DOM属性
    var propValue = props[propName]
    _.setAttr(el, propName, propValue)
  }
 //依次创建子节点的标签
  _.each(this.children, function (child) {
    var childEl = (child instanceof Element)
      ? child.render()    // 如果子节点也是虚拟DOM，递归构建DOM节点
      : document.createTextNode(child) // 如果字符串，只构建文本节点
    el.appendChild(childEl)
  })

  return el
}

module.exports = Element
