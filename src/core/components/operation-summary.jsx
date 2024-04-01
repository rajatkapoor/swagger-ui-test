import React, { PureComponent } from "react"
import PropTypes from "prop-types"
import { Iterable, List } from "immutable"
import ImPropTypes from "react-immutable-proptypes"
import toString from "lodash/toString"

export const getCompleteApiUrl = (
  host,
  basePath,
  relativePath
) => {
  return `https://${host}${basePath}${relativePath}`;
}

export default class OperationSummary extends PureComponent {

  static propTypes = {
    specPath: ImPropTypes.list.isRequired,
    operationProps: PropTypes.instanceOf(Iterable).isRequired,
    specSelectors: PropTypes.object.isRequired,
    isShown: PropTypes.bool.isRequired,
    toggleShown: PropTypes.func.isRequired,
    getComponent: PropTypes.func.isRequired,
    getConfigs: PropTypes.func.isRequired,
    authActions: PropTypes.object,
    authSelectors: PropTypes.object,
  }

  static defaultProps = {
    operationProps: null,
    specPath: List(),
    summary: ""
  }

  render() {
    const {
      specSelectors,
      getComponent,
    } = this.props
    const Badge = getComponent("Badge")
    console.log("this.props in operation-summary: ", this.props)
    const basePath = specSelectors.basePath()
    const host = specSelectors.host()
    let {
      operationProps,
    } = this.props

    let {
      summary,
      op,
      method,
      path,
    } = operationProps.toJS()

    let {
      summary: resolvedSummary,
    } = op

    return (

           <div className="flex flex-col gap-4 items-center self-stretch">
              <div

                className="flex flex-col gap-2 text-4xl font-bold leading-[44px] text-slate-800 self-stretch"
              >
                 {toString(resolvedSummary || summary)}
              </div>
              <div className="flex items-center self-stretch gap-2">
                <Badge theme="blue" size="sm">
                  {method.toUpperCase()}
                </Badge>
                <div className="text-base leading-6 font-normal text-slate-600">
                  {getCompleteApiUrl(
                    host,
                    basePath,
                    path
                  )}
                </div>
              </div>
            </div>

    )
  }
}
