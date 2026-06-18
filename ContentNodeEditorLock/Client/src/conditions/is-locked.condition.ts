import { UmbLockConditionBase } from './lock-condition.base.js';
import type { UmbConditionConfigBase, UmbConditionControllerArguments, UmbExtensionCondition } from '@umbraco-cms/backoffice/extension-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';

/**
 * Permitted when the open node is read-only because another editor holds the lock — used to show
 * the "Request access" and "Force access" buttons only for the blocked second editor.
 */
export class UmbIsLockedCondition extends UmbLockConditionBase implements UmbExtensionCondition {
	constructor(host: UmbControllerHost, args: UmbConditionControllerArguments<UmbConditionConfigBase>) {
		super(host, args, true);
	}
}

export { UmbIsLockedCondition as api };
export default UmbIsLockedCondition;
