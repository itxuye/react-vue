import {
  COMMON,
  WEB,
  NATIVE
} from '../config'
import {
  specialObserver
} from '../helpers'
import {
  RENDER_HELPER_MODULE_NAME
} from '../constants'

class BaseGenerator {
  constructor (ast, options) {
    this.ast = ast
    this.level = options.level
    this.variableDependency = []
    this.slots = []
    this.vueConfig = options.vueConfig || {}
    this.uid = 0

    specialObserver(COMMON, this.setVariableDependency.bind(this))
    specialObserver(WEB, this.setVariableDependency.bind(this))
    specialObserver(NATIVE, this.setVariableDependency.bind(this))
  }

  setSlots (name) {
    if (this.slots.indexOf(name) === -1) {
      this.slots.push(name)
    }
  }

  setVariableDependency (variable) {
    if (this.variableDependency.indexOf(variable) === -1) {
      this.variableDependency.push(variable)
    }
  }

  generate () {
    const coreCode = this.genElement(this.ast, this.level)
    const importDep = this.genDependence()
    let render = coreCode.trim()
    let slot = ''
    render = `return ${render}`
    if (this.slots.length) {
      slot = `const ${COMMON.renderSlot.value} = ${COMMON.renderSlot.name}.call(this, [${this.slots.join(',')}], this.props.children)`
      render = `${slot}\n${render}`
    }
    return `${importDep} export default function render (vm) {${render}}`
  }

  genDependence () {
    let code = ``
    const helperDependency = this.variableDependency
      .filter(v => v !== COMMON.createElement && v !== COMMON.component && v.alias)
    if (helperDependency.length) {
      code += 'import { '
      code += helperDependency.map(v => `${v.alias} as ${v.name}`).join(',')
      code += ` } from '${RENDER_HELPER_MODULE_NAME}'\n`
    }
    code += `import {
      ${COMMON.createElement.alias} as ${COMMON.createElement.name},
      ${COMMON.component.alias} as ${COMMON.component.name}
    } from 'react'\n`
    if (this.variableDependency.indexOf(COMMON.directive) !== -1) {
      code += `const ${COMMON.directive.component} = ${COMMON.directive.name}(${COMMON.component.name}, ${COMMON.createElement.name})\n`
    }
    if (this.variableDependency.indexOf(WEB.emptyComponent) !== -1) {
      code += `const ${WEB.emptyComponent.component} = ${WEB.emptyComponent.name}(${COMMON.component.name}, ${COMMON.createElement.name})\n`
    }
    if (this.variableDependency.indexOf(WEB.transition) !== -1) {
      code += `const ${WEB.transition.component} = ${WEB.transition.name}(${COMMON.component.name}, ${COMMON.createElement.name})\n`
    }
    // if (this.variableDependency.indexOf(WEB.transitionGroup) !== -1) {
    //   code += `const ${WEB.transitionGroup.component} = ${WEB.transitionGroup.name}(${COMMON.component.name}, ${COMMON.createElement.name})\n`
    // }
    if (this.variableDependency.indexOf(WEB.inputComponent) !== -1) {
      code += `const ${WEB.inputComponent.component} = ${WEB.inputComponent.name}(${COMMON.component.name}, ${COMMON.createElement.name})\n`
    }
    return code
  }
}

export default BaseGenerator
