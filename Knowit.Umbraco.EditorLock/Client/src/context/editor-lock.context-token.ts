import type { UmbEditorLockContext } from './editor-lock.context.js';
import { UmbContextToken } from '@umbraco-cms/backoffice/context-api';

export const UMB_EDITOR_LOCK_CONTEXT = new UmbContextToken<UmbEditorLockContext>('Knowit.Umbraco.EditorLock.Context');
