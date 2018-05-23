var _ = require('./util')
var patch = require('./patch')
var listDiff = require('list-diff2')

// diff 函数，对比两棵树
function diff(oldTree, newTree) {
  var index = 0  // 节点的遍历顺序
  var patches = {} // 在遍历过程中记录节点的差异
  dfsWalk(oldTree, newTree, index, patches) //深度优先遍历两棵树
  return patches
}

// 节点差异归结为4种类型
// 修改节点属性，用PROPS表示  例如：{type:PROPS,props: newProps}
// 修改节点文本内容，用TEXT表示
// 替换原有节点，用REPLACE表示  例如：{type:REPLACE,node:newNode}
// 调整子节点，包括移动、删除等，用REORDER表示


// 对两棵树进行深度优先遍历
//在深度优先遍历的过程中，每个节点都有一个编号，如果对应的节点有变化，只需要把相应变化的类别记录下来即可。
function dfsWalk(oldNode, newNode, index, patches) {
  var currentPatch = []

  if (newNode === null) {
    //依赖listdiff算法进行标记为删除
  } else if (_.isString(oldNode) && _.isString(newNode)) {
    if (newNode !== oldNode) {
      //如果是文本节点则直接替换文本
      currentPatch.push({ type: patch.TEXT, content: newNode })
    }

  } else if (
    oldNode.tagName === newNode.tagName &&
    oldNode.key === newNode.key
  ) {
    //节点类型相同
    //比较节点的属性是否相同
    var propsPatches = diffProps(oldNode, newNode)
    if (propsPatches) {
      currentPatch.push({ type: patch.PROPS, props: propsPatches })
    }
    //比较子节点是否相同
    if (!isIgnoreChildren(newNode)) {
      diffChildren(
        oldNode.children,
        newNode.children,
        index,
        patches,
        currentPatch
      )
    }
    //节点的类型不同，直接替换
  } else {
    currentPatch.push({ type: patch.REPLACE, node: newNode })
  }

  if (currentPatch.length) {
    patches[index] = currentPatch
  }
}
// 遍历子节点
function diffChildren(oldChildren, newChildren, index, patches, currentPatch) {
  var diffs = listDiff(oldChildren, newChildren, 'key')
  newChildren = diffs.children

  if (diffs.moves.length) {
    var reorderPatch = { type: patch.REORDER, moves: diffs.moves }
    currentPatch.push(reorderPatch)
  }

  var leftNode = null
  var currentNodeIndex = index
  _.each(oldChildren, function (child, i) {
    var newChild = newChildren[i]
    currentNodeIndex = (leftNode && leftNode.count) // 计算节点的标识
      ? currentNodeIndex + leftNode.count + 1
      : currentNodeIndex + 1
    dfsWalk(child, newChild, currentNodeIndex, patches)  // 深度遍历子节点
    leftNode = child
  })
}

function diffProps(oldNode, newNode) {
  var count = 0
  var oldProps = oldNode.props
  var newProps = newNode.props

  var key, value
  var propsPatches = {}

  // Find out different properties
  for (key in oldProps) {
    value = oldProps[key]
    if (newProps[key] !== value) {
      count++
      propsPatches[key] = newProps[key]
    }
  }

  // Find out new property
  for (key in newProps) {
    value = newProps[key]
    if (!oldProps.hasOwnProperty(key)) {
      count++
      propsPatches[key] = newProps[key]
    }
  }

  // If properties all are identical
  if (count === 0) {
    return null
  }

  return propsPatches
}

function isIgnoreChildren(node) {
  return (node.props && node.props.hasOwnProperty('ignore'))
}

module.exports = diff
