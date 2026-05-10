export type XhrRuleAction = 'networkError'

export interface XhrRequestMeta {
  method: string
  url: string
  async: boolean
}

export type XhrRuleMatcher = string | RegExp | ((meta: XhrRequestMeta) => boolean)

export interface XhrRule {
  id: string
  match: XhrRuleMatcher
  action: XhrRuleAction
  description?: string
}

export interface XhrMatchedRule extends XhrRule {
  action: XhrRuleAction
}
