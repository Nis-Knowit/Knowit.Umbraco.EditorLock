import { UmbLockConditionBase } from './lock-condition.base.js';
import type { UmbConditionConfigBase, UmbConditionControllerArguments, UmbExtensionCondition } from '@umbraco-cms/backoffice/extension-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';

/**
 * Permitted unless the open node is read-only because another editor holds the lock. Appended to
 * the core Save / Save and publish / Save and preview actions so they hide while locked out.
 */
export class UmbIsNotLockedCondition extends UmbLockConditionBase implements UmbExtensionCondition {
	constructor(host: UmbControllerHost, args: UmbConditionControllerArguments<UmbConditionConfigBase>) {
		super(host, args, false);
	}
}

export { UmbIsNotLockedCondition as api };
export default UmbIsNotLockedCondition;
