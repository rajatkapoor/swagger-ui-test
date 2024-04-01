import React, { PureComponent, useEffect } from "react"
import PropTypes from "prop-types"
import { getList } from "core/utils"
import { getExtensions, sanitizeUrl, escapeDeepLinkPath } from "core/utils"
import { safeBuildUrl } from "core/utils/url"
import { Iterable, List } from "immutable"
import ImPropTypes from "react-immutable-proptypes"
import Oas from "oas"
import oasToHar from "@readme/oas-to-har"
import { HTTPSnippet } from "httpsnippet"



import petstore from "./petstore.json"

function expandObjectKeys(obj) {
  const result = {}

  for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
          const keys = key.split(".")
          let current = result

          for (let i = 0; i < keys.length; i++) {
              const k = keys[i]
              if (i === keys.length - 1) {
                  current[k] = obj[key]
              } else {
                  current[k] = current[k] || {}
                  current = current[k]
              }
          }
      }
  }

  return result
}


export default class Operation extends PureComponent {
  static propTypes = {
    specPath: ImPropTypes.list.isRequired,
    operation: PropTypes.instanceOf(Iterable).isRequired,
    summary: PropTypes.string,
    response: PropTypes.instanceOf(Iterable),
    request: PropTypes.instanceOf(Iterable),

    toggleShown: PropTypes.func.isRequired,
    onTryoutClick: PropTypes.func.isRequired,
    onResetClick: PropTypes.func.isRequired,
    onCancelClick: PropTypes.func.isRequired,
    onExecute: PropTypes.func.isRequired,

    getComponent: PropTypes.func.isRequired,
    getConfigs: PropTypes.func.isRequired,
    authActions: PropTypes.object,
    authSelectors: PropTypes.object,
    specActions: PropTypes.object.isRequired,
    specSelectors: PropTypes.object.isRequired,
    oas3Actions: PropTypes.object.isRequired,
    oas3Selectors: PropTypes.object.isRequired,
    layoutActions: PropTypes.object.isRequired,
    layoutSelectors: PropTypes.object.isRequired,
    fn: PropTypes.object.isRequired
  }

  static defaultProps = {
    operation: null,
    response: null,
    request: null,
    specPath: List(),
    summary: ""
  }

  render() {
    let {
      specPath,
      response,
      request,
      toggleShown,
      onTryoutClick,
      onResetClick,
      onCancelClick,
      onExecute,
      fn,
      getComponent,
      getConfigs,
      specActions,
      specSelectors,
      authActions,
      authSelectors,
      oas3Actions,
      oas3Selectors
    } = this.props
    const { showMutatedRequest, requestSnippetsEnabled } = getConfigs()
    let operationProps = this.props.operation
    let {
      deprecated,
      path,
      method,
      op,
      tag,
      operationId,
      allowTryItOut,
      displayRequestDuration,
      tryItOutEnabled,
      executeInProgress
    } = operationProps.toJS()
    console.log("path: ", path)
    console.log("method: ", method)
    console.log("specSelectors: ", specSelectors)
    console.log("showMutatedRequest: ", showMutatedRequest)
    const curlRequest = specSelectors.requestFor(path, method)



    const isShown = true
    let {
      description,
      externalDocs,
      schemes,
    } = op

    const externalDocsUrl = externalDocs ? safeBuildUrl(externalDocs.url, specSelectors.url(), { selectedServer: oas3Selectors.selectedServer() }) : ""
    let operation = operationProps.getIn(["op"])
    let responses = operation.get("responses")
    let parameters = getList(operation, ["parameters"])
    let operationScheme = specSelectors.operationScheme(path, method)
    let isShownKey = ["operations", tag, operationId]
    let extensions = getExtensions(operation)

    const Responses = getComponent("responses")
    const Parameters = getComponent("parameters")
    const Execute = getComponent("execute")
    const Clear = getComponent("clear")
    const Collapse = getComponent("Collapse")
    const Markdown = getComponent("Markdown", true)
    const Schemes = getComponent("schemes")
    const OperationServers = getComponent("OperationServers")
    const OperationExt = getComponent("OperationExt")
    const OperationSummary = getComponent("OperationSummary")
    const Link = getComponent("Link")
    const RequestSnippets = getComponent("RequestSnippets", true)
    const Curl = getComponent("curl")


    const { showExtensions } = getConfigs()
    let { requestContentType, responseContentType } = specSelectors.contentTypeValues([path, method]).toJS()
    let isXml = /xml/i.test(requestContentType)
    let parametersVar = specSelectors.parameterValues([path, method], isXml).toJS()
    // Merge in Live Response
    if (responses && response && response.size > 0) {
      let notDocumented = !responses.get(String(response.get("status"))) && !responses.get("default")
      response = response.set("notDocumented", notDocumented)
    }

    let onChangeKey = [path, method] // Used to add values to _this_ operation ( indexed by path and method )


    const validationErrors = specSelectors.validationErrors([path, method])


    let params = expandObjectKeys(parametersVar)
    params = {
      ...params,
      body: params.formData,
    }

    const spec = new Oas(petstore)
    const oasOp = spec.operation(path, method)

    // useEffect(async () => {
    //   const def = await oas.validate()
    //   const newOas = new Oas(def)
    //   const har = oasToHar(newOas, oasOp, params)
    //   console.log(`🚀 INTERNAL HAR: ${path} ${method}}`, { path, params, har })




    // }, [parametersVar, path, method])


    const isMP = oasOp.isMultipart()
    const isjson = oasOp.isJson()

    const har = oasToHar(spec, oasOp, params)
    console.log(`🚀 HAR: ${path} ${method}}`, { path, params,  har , isMP, isjson})


    const snippet = new HTTPSnippet(har.log.entries[0].request)
    const options = { indent: "\t" }
    const output = snippet.convert("node", undefined, options)


    return (
        <div className="flex mb-10 grid grid-cols-3" id={escapeDeepLinkPath(isShownKey.join("-"))} >
          <div className="flex flex-col items-center pr-6 pl-8 gap-11 col-span-2">
            <div className="flex flex-col gap-8 items-center self-stretch">
              <OperationSummary operationProps={operationProps} specSelectors={specSelectors} isShown={isShown} toggleShown={toggleShown} getComponent={getComponent} authActions={authActions} authSelectors={authSelectors} specPath={specPath} />
              <div className="flex flex-col items-start self-stretch gap-7">
                { deprecated && <h4 className="opblock-title_normal"> Warning: Deprecated</h4>}
                { description &&
                  <div className="text-base leading-6 font-normal text-slate-600">
                    <span className="font-semibold">Note:</span>
                    <Markdown source={ description } />
                  </div>
                }
                {
                  externalDocsUrl ?
                  <div className="opblock-external-docs-wrapper">
                    <h4 className="opblock-title_normal">Find more details</h4>
                    <div className="opblock-external-docs">
                      {externalDocs.description &&
                        <span className="opblock-external-docs__description">
                          <Markdown source={ externalDocs.description } />
                        </span>
                      }
                      <Link target="_blank" className="opblock-external-docs__link" href={sanitizeUrl(externalDocsUrl)}>{externalDocsUrl}</Link>
                    </div>
                  </div> : null
                }
                <div className="flex flex-col gap-8 w-full">
                  { !operation || !operation.size ? null :
                    <Parameters
                      parameters={parameters}
                      specPath={specPath.push("parameters")}
                      operation={operation}
                      onChangeKey={onChangeKey}
                      onTryoutClick = { onTryoutClick }
                      onResetClick = { onResetClick }
                      onCancelClick = { onCancelClick }
                      tryItOutEnabled = { tryItOutEnabled }
                      allowTryItOut={allowTryItOut}

                      fn={fn}
                      getComponent={ getComponent }
                      specActions={ specActions }
                      specSelectors={ specSelectors }
                      pathMethod={ [path, method] }
                      getConfigs={ getConfigs }
                      oas3Actions={ oas3Actions }
                      oas3Selectors={ oas3Selectors }
                    />
                  }
                   { !responses ? null :
                    <Responses
                      responses={ responses }
                      request={ request }
                      tryItOutResponse={ response }
                      getComponent={ getComponent }
                      getConfigs={ getConfigs }
                      specSelectors={ specSelectors }
                      oas3Actions={oas3Actions}
                      oas3Selectors={oas3Selectors}
                      specActions={ specActions }
                      produces={specSelectors.producesOptionsFor([path, method]) }
                      producesValue={ specSelectors.currentProducesFor([path, method]) }
                      specPath={specPath.push("responses")}
                      path={ path }
                      method={ method }
                      displayRequestDuration={ displayRequestDuration }
                      fn={fn} />
                }
                </div>


                { !tryItOutEnabled ? null :
                  <OperationServers
                    getComponent={getComponent}
                    path={path}
                    method={method}
                    operationServers={operation.get("servers")}
                    pathServers={specSelectors.paths().getIn([path, "servers"])}
                    getSelectedServer={oas3Selectors.selectedServer}
                    setSelectedServer={oas3Actions.setSelectedServer}
                    setServerVariableValue={oas3Actions.setServerVariableValue}
                    getServerVariable={oas3Selectors.serverVariableValue}
                    getEffectiveServerValue={oas3Selectors.serverEffectiveValue}
                  />
                }

                {!tryItOutEnabled || !allowTryItOut ? null : schemes && schemes.size ? <div className="opblock-schemes">
                      <Schemes schemes={ schemes }
                              path={ path }
                              method={ method }
                              specActions={ specActions }
                              currentScheme={ operationScheme } />
                    </div> : null
                }

                { !tryItOutEnabled || !allowTryItOut || validationErrors.length <= 0 ? null : <div className="validation-errors errors-wrapper">
                    Please correct the following validation errors and try again.
                    <ul>
                      { validationErrors.map((error, index) => <li key={index}> { error } </li>) }
                    </ul>
                  </div>
                }

              <div className="btn-group">
                <Execute
                  operation={ operation }
                  specActions={ specActions }
                  specSelectors={ specSelectors }
                  oas3Selectors={ oas3Selectors }
                  oas3Actions={ oas3Actions }
                  path={ path }
                  method={ method }
                  onExecute={ onExecute }
                  disabled={executeInProgress}/>
              </div>

              {executeInProgress ? <div className="loading-container"><div className="loading"></div></div> : null}



                { !showExtensions || !extensions.size ? null :
                  <OperationExt extensions={ extensions } getComponent={ getComponent } />
                }
              </div>
            </div>
          </div>
           <div className="col-span-1 flex flex-col">
          <div>


            <pre>

            {JSON.stringify({
              parametersVar,
              path, method
            })}
              </pre>
          </div>
          <div>
            <pre>

            {JSON.stringify({
              har
            })}

            </pre>
          </div>
          <div>
            <pre>

            {output}

            </pre>
          </div>


          {/* { curlRequest && (requestSnippetsEnabled === true || requestSnippetsEnabled === "true"
          ? <RequestSnippets request={ curlRequest }/>
          : <Curl request={ curlRequest } getConfigs={ getConfigs } />) } */}
          </div>
        </div>
    )
  }

}
